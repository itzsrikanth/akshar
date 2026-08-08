import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EXERCISE_TYPES } from '@/components/exercises/registry';
import { SegmentLine } from '@/components/segment-line';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Real, complete chapter JSON, imported directly rather than hand-copied —
// single source of truth with the exact shape a future ContentRepository
// fetch (docs/tech-implementation.md) would return, so swapping the import
// for a real fetch call later is a one-line change, not a rewrite.
import chapterData from '../../../../api/KSEEB/Karnataka/English/Grade5/Kannada/ch01-bannada-tagadina.json';

type Segment = {
  id: string;
  type: string;
  text: string;
  section?: string;
  stanza?: number;
  exercise?: string;
  ref?: string;
  translations?: Record<string, string>;
  transliterations?: Record<string, string>;
};

const chapter = chapterData as {
  labels: Record<string, Record<string, string>>;
  meta: { title: string; board: string; state: string; medium: string; grade: number; subject: string };
  segments: Segment[];
};

const BREADCRUMB = `${chapter.meta.board} · ${chapter.meta.state} · ${chapter.meta.medium} · Grade ${chapter.meta.grade} · ${chapter.meta.subject}`;

const competency = chapter.segments.find((s) => s.type === 'competency');
const introLines = chapter.segments.filter((s) => s.section === 'intro' && s.type !== 'competency');
const poemLines = chapter.segments.filter((s) => s.type === 'poem_line');
const stanzas = Array.from(new Set(poemLines.map((l) => l.stanza))).sort((a, b) => (a ?? 0) - (b ?? 0));
const vocabTerms = chapter.segments.filter((s) => s.type === 'vocabulary_term');
const vocabDefs = new Map(
  chapter.segments.filter((s) => s.type === 'vocabulary_definition').map((s) => [s.ref, s]),
);
const noteTerms = chapter.segments.filter((s) => s.type === 'note_term');
const noteDefs = new Map(chapter.segments.filter((s) => s.type === 'note_definition').map((s) => [s.ref, s]));
const exerciseLetters = Array.from(
  new Set(chapter.segments.filter((s) => s.exercise).map((s) => s.exercise as string)),
).sort();

function SectionLabel({ children }: { children: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
      {children}
    </ThemedText>
  );
}

function TermPair({ term, definition }: { term: Segment; definition?: Segment }) {
  const theme = useTheme();
  if (!definition) return null;
  const caption = [term.transliterations?.devanagari, definition.transliterations?.devanagari]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.termRow}>
      <View style={styles.f1}>
        <View style={styles.termHeadRow}>
          <ThemedText type="default" themeColor="tint">
            {term.text}
          </ThemedText>
          <MaterialCommunityIcons name="arrow-right" size={16} color={theme.textDisabled} />
          <ThemedText type="default">{definition.text}</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.mt2}>
          {caption}
          {definition.translations?.en ? ` — ${definition.translations.en}` : ''}
        </ThemedText>
      </View>
      <MaterialCommunityIcons name="volume-high" size={18} color={theme.textDisabled} />
    </View>
  );
}

export default function ReaderScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">{chapter.meta.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.breadcrumb}>
            {BREADCRUMB}
          </ThemedText>

          {competency && (
            <View style={[styles.calloutCard, { backgroundColor: theme.tintMuted }]}>
              <SectionLabel>{chapter.labels.competency?.en ?? 'Competency'}</SectionLabel>
              <SegmentLine
                source={competency.text}
                transliteration={competency.transliterations?.devanagari}
                translation={competency.translations?.en}
              />
            </View>
          )}

          <View style={styles.section}>
            <SectionLabel>{chapter.labels.intro?.en ?? 'Introduction'}</SectionLabel>
            {introLines.map((line, i) => (
              <View key={line.id} style={i > 0 ? styles.mt4 : undefined}>
                <SegmentLine
                  source={line.text}
                  transliteration={line.transliterations?.devanagari}
                  translation={line.translations?.en}
                />
              </View>
            ))}
          </View>

          {stanzas.map((stanza) => (
            <View key={stanza} style={styles.section}>
              <SectionLabel>{`${chapter.labels.poem?.en ?? 'Poem'} — Stanza ${stanza}`}</SectionLabel>
              <View style={[styles.poemCard, { backgroundColor: theme.backgroundElement }]}>
                {poemLines
                  .filter((l) => l.stanza === stanza)
                  .map((line, i, arr) => (
                    <View key={line.id} style={i < arr.length - 1 ? styles.poemLineSpacing : undefined}>
                      <SegmentLine
                        source={line.text}
                        transliteration={line.transliterations?.devanagari}
                        translation={line.translations?.en}
                      />
                    </View>
                  ))}
              </View>
            </View>
          ))}

          {vocabTerms.length > 0 && (
            <View style={styles.section}>
              <SectionLabel>{chapter.labels.vocab?.en ?? 'Word meanings'}</SectionLabel>
              <View style={[styles.card, { borderColor: theme.border }]}>
                {vocabTerms.map((term, i) => (
                  <View
                    key={term.id}
                    style={i < vocabTerms.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }}
                  >
                    <TermPair term={term} definition={vocabDefs.get(term.id)} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {noteTerms.length > 0 && (
            <View style={styles.section}>
              <SectionLabel>{chapter.labels.notes?.en ?? 'Notes'}</SectionLabel>
              <View style={[styles.card, { borderColor: theme.border }]}>
                {noteTerms.map((term, i) => (
                  <View
                    key={term.id}
                    style={i < noteTerms.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }}
                  >
                    <TermPair term={term} definition={noteDefs.get(term.id)} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {exerciseLetters.length > 0 && (
            <View style={styles.section}>
              <Pressable
                onPress={() => router.push('/exercises')}
                style={[styles.exercisesCard, { backgroundColor: theme.backgroundElement }]}
              >
                <View>
                  <ThemedText type="default" themeColor="tint">
                    Exercises
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.mt2}>
                    {`${EXERCISE_TYPES.length} exercise types`}
                  </ThemedText>
                </View>
                <MaterialCommunityIcons name="arrow-right" size={22} color={theme.tint} />
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  breadcrumb: { marginTop: 4, marginBottom: Spacing.three },
  section: { marginTop: Spacing.four },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  calloutCard: { borderRadius: Radius.medium, padding: Spacing.three, marginTop: Spacing.three },
  poemCard: { borderRadius: Radius.large, padding: Spacing.three },
  poemLineSpacing: { marginBottom: Spacing.three },
  card: { borderWidth: 1, borderRadius: Radius.medium, overflow: 'hidden' },
  termRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: Spacing.three },
  termHeadRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  exercisesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  f1: { flex: 1 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: Spacing.three },
});
