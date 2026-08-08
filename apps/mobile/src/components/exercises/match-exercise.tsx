import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { EmptyExerciseState } from './empty-exercise-state';
import type { MatchItem } from './types';

/** "Match the following" — a term paired with its meaning, numbered. */
export function MatchExercise({ items }: { items: MatchItem[] }) {
  const theme = useTheme();
  if (items.length === 0) return <EmptyExerciseState label="Match the following" />;

  return (
    <>
      {items.map((item, i) => (
        <View
          key={item.id}
          style={[styles.row, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
        >
          <View style={[styles.bubble, { backgroundColor: theme.tint }]}>
            <ThemedText type="smallBold" themeColor="onTint">
              {i + 1}
            </ThemedText>
          </View>
          <View style={styles.f1}>
            <View style={styles.termRow}>
              <ThemedText type="default" themeColor="tint">
                {item.term}
              </ThemedText>
              <MaterialCommunityIcons name="arrow-right" size={16} color={theme.textDisabled} />
              <ThemedText type="default">{item.definition}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.mt2}>
              {[item.transliteration, item.translation].filter(Boolean).join(' — ')}
            </ThemedText>
          </View>
          <MaterialCommunityIcons name="volume-high" size={17} color={theme.textDisabled} />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: Spacing.three },
  bubble: { width: 22, height: 22, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  termRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  f1: { flex: 1 },
  mt2: { marginTop: 2 },
});
