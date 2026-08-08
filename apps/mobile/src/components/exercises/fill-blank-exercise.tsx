import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { EmptyExerciseState } from './empty-exercise-state';
import type { FillBlankItem } from './types';

/** "Fill in the blanks" — a sentence with a blank, then the missing word. */
export function FillBlankExercise({ items }: { items: FillBlankItem[] }) {
  const theme = useTheme();
  if (items.length === 0) return <EmptyExerciseState label="Fill in the blanks" />;

  return (
    <>
      {items.map((item) => (
        <View key={item.id} style={styles.block}>
          <View style={styles.row}>
            <ThemedText type="default" style={styles.f1}>
              {item.before}
              <ThemedText type="default" themeColor="tint" style={styles.blank}>
                {'   '}
              </ThemedText>
              {item.after}
            </ThemedText>
            <MaterialCommunityIcons name="volume-high" size={17} color={theme.textDisabled} />
          </View>
          {(item.transliteration || item.translation) && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
              {[item.transliteration, item.translation].filter(Boolean).join(' · ')}
            </ThemedText>
          )}
          <View style={[styles.answerRow, { backgroundColor: `${theme.tint}1A` }]}>
            <ThemedText type="smallBold" themeColor="tint" style={styles.answerLabel}>
              ANSWER
            </ThemedText>
            <ThemedText type="default">{item.answer}</ThemedText>
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  blank: { textDecorationLine: 'underline' },
  caption: { marginTop: 2 },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.two,
    marginTop: Spacing.two,
  },
  answerLabel: { letterSpacing: 0.5 },
  f1: { flex: 1 },
});
