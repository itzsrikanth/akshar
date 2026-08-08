import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { EmptyExerciseState } from './empty-exercise-state';
import type { AnswerItem } from './types';

/** "Answer the following" — a question, then its answer revealed alongside it. */
export function AnswerExercise({ items }: { items: AnswerItem[] }) {
  const theme = useTheme();
  if (items.length === 0) return <EmptyExerciseState label="Answer the following" />;

  let lastGroup: string | undefined;
  return (
    <>
      {items.map((item) => {
        const groupHeader = item.group && item.group !== lastGroup ? item.group : undefined;
        lastGroup = item.group;
        return (
          <Fragment key={item.id}>
            {groupHeader && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.groupLabel}>
                {groupHeader}
              </ThemedText>
            )}
            <View style={styles.block}>
              <View style={styles.row}>
                <View style={[styles.bubble, { backgroundColor: theme.tint }]}>
                  <ThemedText type="smallBold" themeColor="onTint">
                    Q
                  </ThemedText>
                </View>
                <ThemedText type="default" style={styles.f1}>
                  {item.question}
                </ThemedText>
                <MaterialCommunityIcons name="volume-high" size={17} color={theme.textDisabled} />
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.qCaption}>
                {[item.questionTransliteration, item.questionTranslation].filter(Boolean).join(' · ')}
              </ThemedText>

              <View style={[styles.row, styles.answerRow, { backgroundColor: `${theme.tint}1A` }]}>
                <View style={[styles.bubble, styles.bubbleOutline, { borderColor: theme.tint }]}>
                  <ThemedText type="smallBold" themeColor="tint">
                    A
                  </ThemedText>
                </View>
                <ThemedText type="default" style={styles.f1}>
                  {item.answer}
                </ThemedText>
                <MaterialCommunityIcons name="volume-high" size={17} color={theme.textDisabled} />
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.aCaption}>
                {[item.answerTransliteration, item.answerTranslation].filter(Boolean).join(' · ')}
              </ThemedText>
            </View>
          </Fragment>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  groupLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.two, marginBottom: Spacing.two },
  block: { marginBottom: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  answerRow: { borderRadius: Radius.medium, padding: Spacing.two, marginTop: Spacing.two, marginLeft: Spacing.four },
  qCaption: { marginLeft: Spacing.five, marginTop: 2 },
  aCaption: { marginLeft: Spacing.six, marginTop: 2 },
  bubble: { width: 22, height: 22, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  bubbleOutline: { backgroundColor: 'transparent', borderWidth: 1 },
  f1: { flex: 1 },
});
