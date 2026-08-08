import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SegmentLine } from '@/components/segment-line';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Same chapter JSON the Reader screen imports — see reader.tsx's comment on
// why this is a direct import rather than a hand-copied placeholder.
import chapterData from '../../../../api/KSEEB/Karnataka/English/Grade5/Kannada/ch01-bannada-tagadina.json';

type Segment = {
  id: string;
  type: string;
  text: string;
  exercise?: string;
  ref?: string;
  translations?: Record<string, string>;
  transliterations?: Record<string, string>;
};

const chapter = chapterData as { meta: { title: string }; segments: Segment[] };
const answerById = new Map(chapter.segments.filter((s) => s.type === 'answer' && s.ref).map((s) => [s.ref, s]));
const exerciseLetters = Array.from(
  new Set(chapter.segments.filter((s) => s.exercise).map((s) => s.exercise as string)),
).sort();

function QuestionAnswer({ question, answer }: { question: Segment; answer?: Segment }) {
  const theme = useTheme();
  const badge = question.type === 'fill_blank' ? '?' : 'Q';
  return (
    <View style={styles.qaBlock}>
      <View style={styles.qaRow}>
        <View style={[styles.bubble, { backgroundColor: theme.tint }]}>
          <ThemedText type="smallBold" themeColor="onTint">
            {badge}
          </ThemedText>
        </View>
        <ThemedText type="default" style={styles.f1}>
          {question.text}
        </ThemedText>
        <MaterialCommunityIcons name="volume-high" size={17} color={theme.textDisabled} />
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.qaCaption}>
        {[question.transliterations?.devanagari, question.translations?.en].filter(Boolean).join(' · ')}
      </ThemedText>

      {answer && (
        <>
          <View style={[styles.qaRow, styles.answerRow, { backgroundColor: `${theme.tint}1A` }]}>
            <View style={[styles.bubble, styles.bubbleOutline, { borderColor: theme.tint }]}>
              <ThemedText type="smallBold" themeColor="tint">
                A
              </ThemedText>
            </View>
            <ThemedText type="default" style={styles.f1}>
              {answer.text}
            </ThemedText>
            <MaterialCommunityIcons name="volume-high" size={17} color={theme.textDisabled} />
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.answerCaption}>
            {[answer.transliterations?.devanagari, answer.translations?.en].filter(Boolean).join(' · ')}
          </ThemedText>
        </>
      )}
    </View>
  );
}

export default function ExercisesScreen() {
  const theme = useTheme();
  const [selected, setSelected] = useState(exerciseLetters[0]);
  const items = chapter.segments.filter((s) => s.exercise === selected && s.type !== 'answer');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="tint">
              ← Back to chapter
            </ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.chapterTitle}>
            {chapter.meta.title}
          </ThemedText>

          <View style={styles.pillRow}>
            {exerciseLetters.map((letter) => {
              const active = letter === selected;
              return (
                <Pressable
                  key={letter}
                  onPress={() => setSelected(letter)}
                  style={[
                    styles.pill,
                    { backgroundColor: active ? theme.tint : theme.backgroundElement },
                  ]}
                >
                  <ThemedText type="smallBold" themeColor={active ? 'onTint' : 'textSecondary'}>
                    {letter}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {items.map((item) =>
            item.type === 'prose' ? (
              <View key={item.id} style={styles.proseRow}>
                <SegmentLine
                  source={item.text}
                  transliteration={item.transliterations?.devanagari}
                  translation={item.translations?.en}
                />
              </View>
            ) : (
              <QuestionAnswer key={item.id} question={item} answer={answerById.get(item.id)} />
            ),
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
  chapterTitle: { marginTop: Spacing.two, marginBottom: Spacing.three },
  pillRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.four },
  pill: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.four, borderRadius: Radius.pill },
  proseRow: { marginBottom: Spacing.three },
  qaBlock: { marginBottom: Spacing.four },
  qaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  answerRow: { borderRadius: Radius.medium, padding: Spacing.two, marginTop: Spacing.two, marginLeft: Spacing.four },
  qaCaption: { marginLeft: Spacing.five, marginTop: 2 },
  answerCaption: { marginLeft: Spacing.six, marginTop: 2 },
  bubble: { width: 22, height: 22, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  bubbleOutline: { backgroundColor: 'transparent', borderWidth: 1 },
  f1: { flex: 1 },
});
