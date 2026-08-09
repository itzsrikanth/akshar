import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Catalog } from '@/services/content-repository';
import { setOnboardingCompleted } from '@/services/onboarding-storage';
import { saveReadingPreference } from '@/services/reading-preference-storage';
import { saveScope } from '@/services/scope-storage';
import { deriveScope, readingOptions, type ReadingOption } from '@/services/scope';
import { optionsAtLevel } from '@/services/hierarchy';

type Step = 'welcome' | 'scope' | 'grade' | 'language';

export function OnboardingFlow({ catalog, onComplete }: { catalog: Catalog; onComplete: () => void }) {
  const [step, setStep] = useState<Step>('welcome');

  // Board/state/medium aren't a picker here — every chapter in the catalog
  // today shares one of each (same fallback deriveScope uses elsewhere), so
  // there's nothing to actually choose yet. Becomes a real picker step the
  // moment a second board/state/medium exists — not built speculatively now.
  const baseScope = useMemo(() => deriveScope(catalog), [catalog]);
  const grades = useMemo(
    () => (baseScope ? optionsAtLevel(catalog.chapters, [baseScope.board, baseScope.state, baseScope.medium], 3) : []),
    [catalog, baseScope],
  );
  const options = useMemo(() => readingOptions(catalog), [catalog]);

  const [grade, setGrade] = useState<number | null>(null);
  const [reading, setReading] = useState<ReadingOption | null>(null);

  // baseScope can't actually be null here — app/_layout.tsx only renders
  // this component once deriveScope(catalog) already succeeded — but typed
  // as nullable since deriveScope itself always returns nullable.
  if (!baseScope) return null;
  const resolvedGrade = grade ?? (grades[0] as number | undefined) ?? baseScope.grade;

  const handleContinue = () => {
    if (!reading) return;
    saveScope({ ...baseScope, grade: resolvedGrade });
    saveReadingPreference({
      translationLanguage: reading.kind === 'language' ? reading.code : null,
      transliterationScript: reading.kind === 'script' ? reading.code : null,
    });
    setOnboardingCompleted();
    onComplete();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {step === 'welcome' && <WelcomeStep onGetStarted={() => setStep('scope')} />}
        {step === 'scope' && (
          <ScopeStep
            baseScope={baseScope}
            grade={resolvedGrade}
            reading={reading}
            onPickGrade={() => setStep('grade')}
            onPickReading={() => setStep('language')}
            onContinue={handleContinue}
          />
        )}
        {step === 'grade' && (
          <GradePickerStep
            grades={grades}
            selected={resolvedGrade}
            onSelect={(g) => {
              setGrade(g);
              setStep('scope');
            }}
            onBack={() => setStep('scope')}
          />
        )}
        {step === 'language' && (
          <LanguagePickerStep
            options={options}
            selected={reading}
            onSelect={(o) => {
              setReading(o);
              setStep('scope');
            }}
            onBack={() => setStep('scope')}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

// Plain View/Text, not ThemedText/ThemedView — same reasoning as SplashView:
// a fixed brand-color surface (#F4F1EC per the design), independent of theme.
function WelcomeStep({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeCenter}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="translate" size={36} color="#ffffff" />
        </View>
        <ThemedText type="title" style={styles.welcomeTitle}>
          Welcome to Akshar
        </ThemedText>
        {/* Not the design's literal "reads chapters aloud in your language" —
            there's no audio/TTS playback built yet (see docs/roadmap.md).
            Same substitution reasoning as Home's "Learning app" subtitle. */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.welcomeSubtitle}>
          Every line of every lesson, alongside a pronunciation guide and a translation — plus
          exercises to check what you've learned. Let's set up what you're studying.
        </ThemedText>
      </View>
      <View style={styles.welcomeFooter}>
        <Touchable onPress={onGetStarted} style={[styles.primaryButton, { backgroundColor: Colors.light.tint }]}>
          <ThemedText type="default" style={styles.primaryButtonText}>
            Get started
          </ThemedText>
        </Touchable>
      </View>
    </View>
  );
}

function ScopeStep({
  baseScope,
  grade,
  reading,
  onPickGrade,
  onPickReading,
  onContinue,
}: {
  baseScope: { board: string; state: string; medium: string };
  grade: number;
  reading: ReadingOption | null;
  onPickGrade: () => void;
  onPickReading: () => void;
  onContinue: () => void;
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
        {/* Board, State, and Medium are separate rows, not combined — they're
            independent levels in the real hierarchy (services/hierarchy.ts's
            LEVEL_KEYS), and staying separate here matters once a board spans
            more than one state (e.g. CBSE across several states, each
            potentially with state-specific subjects) — that's a real picker
            at that point, same "becomes a picker once there's more than one
            option" rule Explore already follows, not built speculatively now. */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <ThemedText type="default">Board</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {baseScope.board}
            </ThemedText>
          </View>
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <ThemedText type="default">State</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {baseScope.state}
            </ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText type="default">Medium</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {`${baseScope.medium} medium`}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          YOUR DETAILS
        </ThemedText>
        <View style={[styles.card, { borderColor: theme.border }]}>
          <Touchable
            onPress={onPickGrade}
            style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
          >
            <ThemedText type="default">Grade</ThemedText>
            <View style={styles.rowValue}>
              <ThemedText type="small" themeColor="textSecondary">{`Grade ${grade}`}</ThemedText>
              <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
            </View>
          </Touchable>
          <Touchable onPress={onPickReading} style={styles.row}>
            <ThemedText type="default">Reading language</ThemedText>
            <View style={styles.rowValue}>
              <ThemedText type="small" themeColor={reading ? 'textSecondary' : 'textDisabled'}>
                {reading?.label ?? 'Select'}
              </ThemedText>
              <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
            </View>
          </Touchable>
        </View>
      </View>

      <View style={styles.footer}>
        <Touchable
          onPress={onContinue}
          disabled={!reading}
          style={[styles.primaryButton, { backgroundColor: reading ? theme.tint : theme.border }]}
        >
          <ThemedText type="default" style={[styles.primaryButtonText, { color: reading ? theme.onTint : theme.textDisabled }]}>
            Continue
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

function GradePickerStep({
  grades,
  selected,
  onSelect,
  onBack,
}: {
  grades: (string | number)[];
  selected: number;
  onSelect: (grade: number) => void;
  onBack: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.fill}>
      <PickerHeader title="Select grade" onBack={onBack} />
      <View style={styles.pickerList}>
        {grades.map((g, i) => (
          <Touchable
            key={g}
            onPress={() => onSelect(Number(g))}
            style={[styles.pickerRow, i < grades.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
          >
            <ThemedText type="default">{`Grade ${g}`}</ThemedText>
            {Number(g) === selected && <MaterialCommunityIcons name="check" size={20} color={theme.tint} />}
          </Touchable>
        ))}
      </View>
    </View>
  );
}

function LanguagePickerStep({
  options,
  selected,
  onSelect,
  onBack,
}: {
  options: ReadingOption[];
  selected: ReadingOption | null;
  onSelect: (option: ReadingOption) => void;
  onBack: () => void;
}) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.fill}>
      <PickerHeader title="Select reading language" onBack={onBack} />
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search languages"
            placeholderTextColor={theme.textDisabled}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>
      </View>
      <View style={styles.pickerList}>
        {filtered.map((o, i) => (
          <Touchable
            key={`${o.kind}-${o.code}`}
            onPress={() => onSelect(o)}
            style={[styles.pickerRow, i < filtered.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
          >
            <ThemedText type="default">{o.label}</ThemedText>
            {selected?.kind === o.kind && selected.code === o.code && (
              <MaterialCommunityIcons name="check" size={20} color={theme.tint} />
            )}
          </Touchable>
        ))}
        {filtered.length === 0 && (
          <ThemedText type="small" themeColor="textDisabled" style={styles.noResults}>
            {`No languages match "${search}"`}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  fill: { flex: 1 },

  welcomeContainer: { flex: 1, backgroundColor: '#F4F1EC' },
  welcomeCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: Spacing.five },
  badge: { width: 72, height: 72, borderRadius: Radius.large, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { textAlign: 'center' },
  welcomeSubtitle: { textAlign: 'center', lineHeight: 20 },
  welcomeFooter: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },

  primaryButton: { borderRadius: Radius.medium, padding: Spacing.three, alignItems: 'center' },
  primaryButtonText: { fontWeight: '600', fontSize: 16 },

  scopeContent: { flex: 1, padding: Spacing.three },
  scopeSubtitle: { marginTop: 6, marginBottom: Spacing.four, lineHeight: 19 },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  card: { borderWidth: 1, borderRadius: Radius.medium, overflow: 'hidden', marginBottom: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { padding: Spacing.three, paddingBottom: Spacing.five },

  pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  pickerList: { flex: 1, paddingHorizontal: Spacing.three },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three },
  searchWrap: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: Radius.medium, paddingVertical: 10, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  noResults: { textAlign: 'center', paddingVertical: Spacing.four },
});
