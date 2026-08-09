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
  const board = obBoard ?? boardOptions[0] ?? null;

  const stateOptions = useMemo(
    () => (board ? (optionsAtLevel(catalog.chapters, [board], 1) as string[]) : []),
    [catalog, board],
  );
  const state = obState ?? stateOptions[0] ?? null;

  const mediumOptions = useMemo(
    () => (board && state ? (optionsAtLevel(catalog.chapters, [board, state], 2) as string[]) : []),
    [catalog, board, state],
  );
  const medium = obMedium ?? mediumOptions[0] ?? null;

  const gradeOptions = useMemo(
    () => (board && state && medium ? (optionsAtLevel(catalog.chapters, [board, state, medium], 3) as number[]) : []),
    [catalog, board, state, medium],
  );
  const grade = obGrade ?? gradeOptions[0] ?? null;

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
  const translation = obTranslation ?? translationOptions[0] ?? null;
  const transliterationOptions = useMemo(() => availableScripts(scopedChapters), [scopedChapters]);
  const transliteration = obTransliteration ?? transliterationOptions[0] ?? null;

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

  // board/state/medium/grade can't actually be null once the catalog has
  // any chapters at all — both call sites (onboarding, scope-setup) only
  // render this once a real scope already resolved — but every
  // optionsAtLevel call above is typed nullable, so this is a real (if
  // practically unreachable) guard.
  if (!board || !state || !medium || !grade) return null;

  const handleSave = () => {
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

function ScopeRow({ label, value, onPress, isLast = false }: { label: string; value: string; onPress: () => void; isLast?: boolean }) {
  const theme = useTheme();
  return (
    <Touchable onPress={onPress} style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <ThemedText type="default">{label}</ThemedText>
      <View style={styles.rowValue}>
        <ThemedText type="small" themeColor="textSecondary">
          {value}
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
  onPickBoard,
  onPickState,
  onPickMedium,
  onPickGrade,
  onPickTranslation,
  onPickTransliteration,
  onSave,
}: {
  board: string;
  state: string;
  medium: string;
  grade: number;
  translation: string;
  transliteration: string;
  saveLabel: string;
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
            one item" treatment as Grade. */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <ScopeRow label="Board" value={board} onPress={onPickBoard} />
          <ScopeRow label="State" value={state} onPress={onPickState} />
          <ScopeRow label="Medium" value={`${medium} medium`} onPress={onPickMedium} isLast />
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          YOUR DETAILS
        </ThemedText>
        <View style={[styles.card, { borderColor: theme.border }]}>
          <ScopeRow label="Grade" value={`Grade ${grade}`} onPress={onPickGrade} />
          {/* Translation (meaning) and transliteration (pronunciation) are
              separate rows/axes, same split Settings uses — not one combined
              "reading language" choice. */}
          <ScopeRow label="Translation language" value={labelForLanguage(translation)} onPress={onPickTranslation} />
          <ScopeRow
            label="Transliteration script"
            value={labelForScript(transliteration)}
            onPress={onPickTransliteration}
            isLast
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Touchable onPress={onSave} style={[styles.primaryButton, { backgroundColor: theme.tint }]}>
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
  selected: T;
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
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { padding: Spacing.three, paddingBottom: Spacing.five },

  primaryButton: { borderRadius: Radius.medium, padding: Spacing.three, alignItems: 'center' },
  primaryButtonText: { fontWeight: '600', fontSize: 16 },

  pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  pickerList: { flex: 1, paddingHorizontal: Spacing.three },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three },
});
