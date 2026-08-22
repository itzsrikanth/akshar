import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Catalog } from '@/services/content-repository';
import { filterChapters, optionsAtLevel } from '@/services/hierarchy';
import type { ReadingPreference } from '@/services/reading-preference-storage';
import { availableLanguages, availableScripts, labelForLanguage, labelForScript, type Scope } from '@/services/scope';

type Step = 'scope' | 'board' | 'state' | 'medium' | 'grade' | 'translation' | 'transliteration';

/**
 * The reusable "pick a scope + reading preference" flow — used both by
 * onboarding (components/onboarding-flow.tsx, first run, no initial values)
 * and by app/scope-setup.tsx (editing an existing saved scope from
 * Settings, prefilled via initialScope/initialPreference).
 */
export function ScopeSetupFlow({
  catalog,
  initialScope,
  initialPreference,
  saveLabel = 'Continue',
  onSave,
}: {
  catalog: Catalog;
  initialScope?: Scope | null;
  initialPreference?: ReadingPreference | null;
  saveLabel?: string;
  onSave: (scope: Scope, preference: ReadingPreference) => void;
}) {
  const [step, setStep] = useState<Step>('scope');

  // Only an *editing* session (Settings → scope-setup, initialScope/
  // initialPreference passed in) falls back to "first option" for a level
  // that isn't explicitly set — a genuinely fresh onboarding starts every
  // field truly empty (see ScopeStep below), even though today's catalog
  // has exactly one option at every level, so a new user always makes a
  // real, visible choice rather than inheriting a silent default.
  const hasInitialScope = initialScope != null;
  const hasInitialPreference = initialPreference != null;

  // Every level (board/state/medium/grade) is independently tappable, same
  // as Explore's hierarchy browse — even a level with only one real option
  // today still opens a real picker (of one item), rather than being
  // silently auto-filled and non-interactive. Picking a higher level clears
  // everything below it (including translation/transliteration — see below)
  // so stale/invalid combinations can't linger.
  const [obBoard, setObBoard] = useState<string | null>(initialScope?.board ?? null);
  const [obState, setObState] = useState<string | null>(initialScope?.state ?? null);
  const [obMedium, setObMedium] = useState<string | null>(initialScope?.medium ?? null);
  const [obGrade, setObGrade] = useState<number | null>(initialScope?.grade ?? null);
  const [obTranslation, setObTranslation] = useState<string | null>(initialPreference?.translationLanguage ?? null);
  const [obTransliteration, setObTransliteration] = useState<string | null>(
    initialPreference?.transliterationScript ?? null,
  );

  const boardOptions = useMemo(() => optionsAtLevel(catalog.chapters, [], 0) as string[], [catalog]);
  const board = obBoard ?? (hasInitialScope ? boardOptions[0] ?? null : null);

  const stateOptions = useMemo(
    () => (board ? (optionsAtLevel(catalog.chapters, [board], 1) as string[]) : []),
    [catalog, board],
  );
  const state = obState ?? (hasInitialScope ? stateOptions[0] ?? null : null);

  const mediumOptions = useMemo(
    () => (board && state ? (optionsAtLevel(catalog.chapters, [board, state], 2) as string[]) : []),
    [catalog, board, state],
  );
  const medium = obMedium ?? (hasInitialScope ? mediumOptions[0] ?? null : null);

  const gradeOptions = useMemo(
    () => (board && state && medium ? (optionsAtLevel(catalog.chapters, [board, state, medium], 3) as number[]) : []),
    [catalog, board, state, medium],
  );
  const grade = obGrade ?? (hasInitialScope ? gradeOptions[0] ?? null : null);

  // Translation (meaning) and transliteration (pronunciation) are separate
  // axes — same split Settings already has, not one combined "reading
  // language" choice. Scoped to whatever board/state/medium/grade is
  // currently selected above — not the whole catalog — so this flow never
  // offers a language/script that isn't actually available for the scope
  // being set up (see services/scope.ts's availableLanguages/availableScripts).
  const scopedChapters = useMemo(
    () => (board && state && medium && grade ? filterChapters(catalog.chapters, [board, state, medium, grade]) : []),
    [catalog, board, state, medium, grade],
  );
  const translationOptions = useMemo(() => availableLanguages(scopedChapters), [scopedChapters]);
  const translation = obTranslation ?? (hasInitialPreference ? translationOptions[0] ?? null : null);
  const transliterationOptions = useMemo(() => availableScripts(scopedChapters), [scopedChapters]);
  const transliteration = obTransliteration ?? (hasInitialPreference ? transliterationOptions[0] ?? null : null);

  // Any change to board/state/medium/grade clears everything downstream —
  // including translation/transliteration, since those are scoped to the
  // combination above and a choice valid under one scope may not exist
  // under another.
  const clearDownstreamOfBoard = () => {
    setObState(null);
    setObMedium(null);
    setObGrade(null);
    setObTranslation(null);
    setObTransliteration(null);
  };
  const clearDownstreamOfState = () => {
    setObMedium(null);
    setObGrade(null);
    setObTranslation(null);
    setObTransliteration(null);
  };
  const clearDownstreamOfMedium = () => {
    setObGrade(null);
    setObTranslation(null);
    setObTransliteration(null);
  };
  const clearDownstreamOfGrade = () => {
    setObTranslation(null);
    setObTransliteration(null);
  };

  // A fresh onboarding starts every field null (see hasInitialScope/
  // hasInitialPreference above) until the user actually taps through each
  // picker, so — unlike before — board/state/medium/grade genuinely can be
  // unset here. canSave/handleSave gate on that instead of an early return.
  const canSave = board !== null && state !== null && medium !== null && grade !== null && translation !== null && transliteration !== null;

  const handleSave = () => {
    if (!board || !state || !medium || grade === null || translation === null || transliteration === null) return;
    onSave({ board, state, medium, grade }, { translationLanguage: translation, transliterationScript: transliteration });
  };

  return (
    <>
      {step === 'scope' && (
        <ScopeStep
          board={board}
          state={state}
          medium={medium}
          grade={grade}
          translation={translation}
          transliteration={transliteration}
          saveLabel={saveLabel}
          canSave={canSave}
          onPickBoard={() => setStep('board')}
          onPickState={() => setStep('state')}
          onPickMedium={() => setStep('medium')}
          onPickGrade={() => setStep('grade')}
          onPickTranslation={() => setStep('translation')}
          onPickTransliteration={() => setStep('transliteration')}
          onSave={handleSave}
        />
      )}
      {step === 'board' && (
        <ListPickerStep
          title="Select board"
          options={boardOptions}
          selected={board}
          labelFor={String}
          onSelect={(v) => {
            setObBoard(v);
            clearDownstreamOfBoard();
            setStep('scope');
          }}
          onBack={() => setStep('scope')}
        />
      )}
      {step === 'state' && (
        <ListPickerStep
          title="Select state"
          options={stateOptions}
          selected={state}
          labelFor={String}
          onSelect={(v) => {
            setObState(v);
            clearDownstreamOfState();
            setStep('scope');
          }}
          onBack={() => setStep('scope')}
        />
      )}
      {step === 'medium' && (
        <ListPickerStep
          title="Select medium"
          options={mediumOptions}
          selected={medium}
          labelFor={(v) => `${v} medium`}
          onSelect={(v) => {
            setObMedium(v);
            clearDownstreamOfMedium();
            setStep('scope');
          }}
          onBack={() => setStep('scope')}
        />
      )}
      {step === 'grade' && (
        <ListPickerStep
          title="Select grade"
          options={gradeOptions}
          selected={grade}
          labelFor={(g) => `Grade ${g}`}
          onSelect={(g) => {
            setObGrade(g);
            clearDownstreamOfGrade();
            setStep('scope');
          }}
          onBack={() => setStep('scope')}
        />
      )}
      {step === 'translation' && (
        <ListPickerStep
          title="Select translation language"
          options={translationOptions}
          selected={translation}
          labelFor={labelForLanguage}
          onSelect={(v) => {
            setObTranslation(v);
            setStep('scope');
          }}
          onBack={() => setStep('scope')}
        />
      )}
      {step === 'transliteration' && (
        <ListPickerStep
          title="Select transliteration script"
          options={transliterationOptions}
          selected={transliteration}
          labelFor={labelForScript}
          onSelect={(v) => {
            setObTransliteration(v);
            setStep('scope');
          }}
          onBack={() => setStep('scope')}
        />
      )}
    </>
  );
}

// `value: null` means "not chosen yet" (fresh onboarding, before this row's
// been tapped) — shown as a distinct "Not selected" placeholder rather than
// a real-looking value, and the row is disabled if `enabled` is false (its
// prerequisite level hasn't been picked yet, e.g. State before Board).
function ScopeRow({
  label,
  value,
  onPress,
  isLast = false,
  enabled = true,
}: {
  label: string;
  value: string | null;
  onPress: () => void;
  isLast?: boolean;
  enabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Touchable
      onPress={onPress}
      disabled={!enabled}
      style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }, !enabled && styles.rowDisabled]}
    >
      <ThemedText type="default">{label}</ThemedText>
      <View style={styles.rowValue}>
        <ThemedText type="small" themeColor={value ? 'textSecondary' : 'textDisabled'}>
          {value ?? 'Not selected'}
        </ThemedText>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
      </View>
    </Touchable>
  );
}

function ScopeStep({
  board,
  state,
  medium,
  grade,
  translation,
  transliteration,
  saveLabel,
  canSave,
  onPickBoard,
  onPickState,
  onPickMedium,
  onPickGrade,
  onPickTranslation,
  onPickTransliteration,
  onSave,
}: {
  board: string | null;
  state: string | null;
  medium: string | null;
  grade: number | null;
  translation: string | null;
  transliteration: string | null;
  saveLabel: string;
  canSave: boolean;
  onPickBoard: () => void;
  onPickState: () => void;
  onPickMedium: () => void;
  onPickGrade: () => void;
  onPickTranslation: () => void;
  onPickTransliteration: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.fill}>
      <View style={styles.scopeContent}>
        <ThemedText type="title">Set up your scope</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.scopeSubtitle}>
          This decides which chapters and exercises you'll see. You can change it anytime in
          Settings.
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          BOARD & MEDIUM
        </ThemedText>
        {/* Board, State, and Medium are each their own tappable picker — even
            with only one real option today (matters once a board spans more
            than one state, e.g. CBSE across several states, each potentially
            with state-specific subjects), same "still a real picker, even of
            one item" treatment as Grade. Each row past Board is disabled
            until its prerequisite is actually chosen — nothing to pick from
            yet otherwise (e.g. State's options depend on Board). */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <ScopeRow label="Board" value={board} onPress={onPickBoard} />
          <ScopeRow label="State" value={state} onPress={onPickState} enabled={board !== null} />
          <ScopeRow label="Medium" value={medium ? `${medium} medium` : null} onPress={onPickMedium} enabled={state !== null} isLast />
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          YOUR DETAILS
        </ThemedText>
        <View style={[styles.card, { borderColor: theme.border }]}>
          <ScopeRow label="Grade" value={grade !== null ? `Grade ${grade}` : null} onPress={onPickGrade} enabled={medium !== null} />
          {/* Translation (meaning) and transliteration (pronunciation) are
              separate rows/axes, same split Settings uses — not one combined
              "reading language" choice. */}
          <ScopeRow
            label="Translation language"
            value={translation ? labelForLanguage(translation) : null}
            onPress={onPickTranslation}
            enabled={grade !== null}
          />
          <ScopeRow
            label="Transliteration script"
            value={transliteration ? labelForScript(transliteration) : null}
            onPress={onPickTransliteration}
            enabled={grade !== null}
            isLast
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Touchable
          onPress={onSave}
          disabled={!canSave}
          style={[styles.primaryButton, { backgroundColor: theme.tint }, !canSave && styles.primaryButtonDisabled]}
        >
          <ThemedText type="default" style={[styles.primaryButtonText, { color: theme.onTint }]}>
            {saveLabel}
          </ThemedText>
        </Touchable>
      </View>
    </View>
  );
}

function PickerHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.pickerHeader}>
      <Touchable onPress={onBack} hitSlop={8}>
        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
      </Touchable>
      <ThemedText type="subtitle">{title}</ThemedText>
    </View>
  );
}

/** Shared flat-list-with-checkmark picker — used for every step (board/state/medium/grade/translation/transliteration). */
function ListPickerStep<T extends string | number>({
  title,
  options,
  selected,
  labelFor,
  onSelect,
  onBack,
}: {
  title: string;
  options: T[];
  selected: T | null;
  labelFor: (value: T) => string;
  onSelect: (value: T) => void;
  onBack: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.fill}>
      <PickerHeader title={title} onBack={onBack} />
      <View style={styles.pickerList}>
        {options.map((opt, i) => (
          <Touchable
            key={String(opt)}
            onPress={() => onSelect(opt)}
            style={[styles.pickerRow, i < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
          >
            <ThemedText type="default">{labelFor(opt)}</ThemedText>
            {opt === selected && <MaterialCommunityIcons name="check" size={20} color={theme.tint} />}
          </Touchable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  scopeContent: { flex: 1, padding: Spacing.three },
  scopeSubtitle: { marginTop: 6, marginBottom: Spacing.four, lineHeight: 19 },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  card: { borderWidth: 1, borderRadius: Radius.medium, overflow: 'hidden', marginBottom: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  rowDisabled: { opacity: 0.4 },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { padding: Spacing.three, paddingBottom: Spacing.five },

  primaryButton: { borderRadius: Radius.medium, padding: Spacing.three, alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { fontWeight: '600', fontSize: 16 },

  pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  pickerList: { flex: 1, paddingHorizontal: Spacing.three },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three },
});
