import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AnswerExercise } from '@/components/exercises/answer-exercise';
import { EXERCISE_TYPES } from '@/components/exercises/registry';
import { FillBlankExercise } from '@/components/exercises/fill-blank-exercise';
import { MatchExercise } from '@/components/exercises/match-exercise';
import { ReasonsExercise } from '@/components/exercises/reasons-exercise';
import { TrueFalseExercise } from '@/components/exercises/true-false-exercise';
import type { AnswerItem, ExerciseTypeId, FillBlankItem, MatchItem } from '@/components/exercises/types';
import { AsyncStateView } from '@/components/async-state-view';
import { FadeInView } from '@/components/fade-in';
import { FontSizeStepper } from '@/components/font-size-stepper';
import { SegmentLine } from '@/components/segment-line';
import { ExercisesSkeleton } from '@/components/skeletons/exercises-skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { DEFAULT_CHAPTER_PATH } from '@/constants/content';
import { Radius, Spacing } from '@/constants/theme';
import { useChapter } from '@/hooks/use-chapter';
import { useTheme } from '@/hooks/use-theme';
import { useV2Chapter } from '@/hooks/use-v2-chapter';
import type { Chapter } from '@/services/content-repository';
import type { V2Chapter } from '@/services/v2';

function v2AsChapter(chapter: V2Chapter): Chapter {
  const meta = chapter.meta as Chapter['meta'];
  return {
    schemaVersion: chapter.schemaVersion,
    meta: {
      board: String(meta.board ?? ''),
      state: String(meta.state ?? ''),
      medium: String(meta.medium ?? ''),
      grade: Number(meta.grade ?? chapter.identity.number),
      subject: String(meta.subject ?? ''),
      chapter: Number(meta.chapter ?? chapter.identity.number),
      slug: String(meta.slug ?? chapter.identity.chapterId),
      title: String(meta.title ?? chapter.identity.chapterId),
      source_url: String(meta.source_url ?? ''),
      license: String(meta.license ?? ''),
      original_publisher: String(meta.original_publisher ?? ''),
    },
    labels: chapter.labels,
    segments: chapter.segments,
  };
}

// Building all 5 exercise-type item lists from the same real segment array.
// Answer/FillBlank/Match are backed by real ch01 content; TrueFalse/Reasons
// stay empty (see components/exercises/empty-exercise-state.tsx) — there's
// no schema field distinguishing a "reasoning" question from any other
// question today, and no chapter has true/false content yet. Registering
// the components without data is deliberate: it's what makes them ready
// the moment such content exists, without a screen rewrite.
function deriveExerciseData(chapter: Chapter) {
  const { segments } = chapter;
  const answerById = new Map(segments.filter((s) => s.type === 'answer' && s.ref).map((s) => [s.ref, s]));

  const passageItems = segments.filter((s) => s.type === 'prose' && s.exercise === 'C');

  const answerItems: AnswerItem[] = segments
    .filter((s) => s.type === 'question' && s.exercise)
    .map((s) => {
      const answer = answerById.get(s.id);
      return {
        id: s.id,
        group: `Exercise ${s.exercise}`,
        question: s.text,
        questionTransliteration: s.transliterations?.devanagari,
        questionTranslation: s.translations?.en,
        answer: answer?.text ?? '',
        answerTransliteration: answer?.transliterations?.devanagari,
        answerTranslation: answer?.translations?.en,
      };
    });

  const fillBlankItems: FillBlankItem[] = segments
    .filter((s) => s.type === 'fill_blank')
    .map((s) => {
      const answer = answerById.get(s.id);
      const [before, after] = s.text.split(/_+/);
      return {
        id: s.id,
        before: before ?? '',
        after: after ?? '',
        transliteration: s.transliterations?.devanagari,
        translation: s.translations?.en,
        answer: answer?.text ?? '',
      };
    });

  const defByRef = new Map(
    segments.filter((s) => s.type === 'vocabulary_definition' || s.type === 'note_definition').map((s) => [s.ref, s]),
  );
  const matchItems: MatchItem[] = segments
    .filter((s) => s.type === 'vocabulary_term' || s.type === 'note_term')
    .map((term) => {
      const definition = defByRef.get(term.id);
      return {
        id: term.id,
        term: term.text,
        definition: definition?.text ?? '',
        transliteration: [term.transliterations?.devanagari, definition?.transliterations?.devanagari]
          .filter(Boolean)
          .join(' · '),
        translation: definition?.translations?.en,
      };
    });

  return { passageItems, answerItems, fillBlankItems, matchItems };
}

export default function ExercisesScreen() {
  const params = useLocalSearchParams<{ path?: string; bookId?: string; editionId?: string; chapterId?: string }>();
  const v2Identity =
    params.bookId && params.editionId && params.chapterId
      ? { bookId: params.bookId, editionId: params.editionId, chapterId: params.chapterId }
      : null;
  const v1State = useChapter(v2Identity ? null : (params.path ?? DEFAULT_CHAPTER_PATH));
  const v2State = useV2Chapter(v2Identity);
  const state = v2Identity
    ? v2State.status === 'ready'
      ? { status: 'ready' as const, chapter: v2AsChapter(v2State.chapter) }
      : v2State
    : v1State;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Touchable onPress={() => router.back()} hitSlop={8}>
                <ThemedText type="smallBold" themeColor="tint">
                  ← Back to chapter
                </ThemedText>
              </Touchable>
              <FontSizeStepper />
            </View>
          </ScrollView>
          {state.status === 'loading' ? (
            <ExercisesSkeleton />
          ) : state.status === 'error' ? (
            <AsyncStateView state={state} />
          ) : (
            <FadeInView>
              <ExercisesContent chapter={state.chapter} />
            </FadeInView>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ExercisesContent({ chapter }: { chapter: Chapter }) {
  const theme = useTheme();
  const [selected, setSelected] = useState<ExerciseTypeId>('answer');
  const data = useMemo(() => deriveExerciseData(chapter), [chapter]);

  return (
    <>
      <ThemedText type="small" themeColor="textSecondary" style={styles.chapterTitle}>
        {chapter.meta.title}
      </ThemedText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        <View style={styles.pillRow}>
          {EXERCISE_TYPES.map((t) => {
            const active = t.id === selected;
            return (
              <Touchable
                key={t.id}
                onPress={() => setSelected(t.id)}
                style={[styles.pill, { backgroundColor: active ? theme.tint : theme.backgroundElement }]}
              >
                <ThemedText type="smallBold" themeColor={active ? 'onTint' : 'textSecondary'}>
                  {t.label}
                </ThemedText>
              </Touchable>
            );
          })}
        </View>
      </ScrollView>

      <Animated.View key={selected} entering={FadeIn.duration(150)}>
        {selected === 'answer' && (
          <>
            {data.passageItems.length > 0 && (
              <View style={styles.passage}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.passageLabel}>
                  Exercise C · Passage
                </ThemedText>
                {data.passageItems.map((p) => (
                  <View key={p.id} style={styles.mt3}>
                    <SegmentLine
                      source={p.text}
                      transliteration={p.transliterations?.devanagari}
                      translation={p.translations?.en}
                    />
                  </View>
                ))}
              </View>
            )}
            <AnswerExercise items={data.answerItems} />
          </>
        )}
        {selected === 'fillblank' && <FillBlankExercise items={data.fillBlankItems} />}
        {selected === 'match' && <MatchExercise items={data.matchItems} />}
        {selected === 'truefalse' && <TrueFalseExercise items={[]} />}
        {selected === 'reasons' && <ReasonsExercise items={[]} />}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  chapterTitle: { marginTop: Spacing.two, marginBottom: Spacing.three },
  pillScroll: { marginBottom: Spacing.four },
  pillRow: { flexDirection: 'row', gap: Spacing.two },
  pill: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.four, borderRadius: Radius.pill },
  passage: { marginBottom: Spacing.four },
  passageLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  mt3: { marginTop: Spacing.three },
});
