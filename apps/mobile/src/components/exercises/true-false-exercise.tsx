import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { EmptyExerciseState } from './empty-exercise-state';
import type { TrueFalseItem } from './types';

function Pill({ label, state }: { label: string; state: 'correct' | 'incorrect' | 'muted' }) {
  const theme = useTheme();
  if (state === 'muted') {
    return (
      <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold" themeColor="textDisabled">
          {label}
        </ThemedText>
      </View>
    );
  }
  const color = state === 'correct' ? theme.success : theme.error;
  return (
    <View style={[styles.pill, styles.pillOutline, { borderColor: color, backgroundColor: `${color}1A` }]}>
      <MaterialCommunityIcons name="check-circle" size={16} color={color} />
      <ThemedText type="smallBold" themeColor={state === 'correct' ? 'success' : 'error'}>
        {label}
      </ThemedText>
    </View>
  );
}

/** "True or False" — a statement, with the correct answer highlighted. */
export function TrueFalseExercise({ items }: { items: TrueFalseItem[] }) {
  const theme = useTheme();
  if (items.length === 0) return <EmptyExerciseState label="True or False" />;

  return (
    <>
      {items.map((item) => (
        <View key={item.id} style={styles.block}>
          <View style={styles.row}>
            <ThemedText type="default" style={styles.f1}>
              {item.statement}
            </ThemedText>
            <MaterialCommunityIcons name="volume-high" size={17} color={theme.textDisabled} />
          </View>
          {(item.transliteration || item.translation) && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
              {[item.transliteration, item.translation].filter(Boolean).join(' · ')}
            </ThemedText>
          )}
          <View style={styles.pillRow}>
            <Pill label="True" state={item.answer ? 'correct' : 'muted'} />
            <Pill label="False" state={!item.answer ? 'incorrect' : 'muted'} />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  caption: { marginTop: 2, marginBottom: Spacing.two },
  pillRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
  },
  pillOutline: { borderWidth: 1 },
  f1: { flex: 1 },
});
