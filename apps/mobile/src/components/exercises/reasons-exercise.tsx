import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { EmptyExerciseState } from './empty-exercise-state';
import type { ReasonsItem } from './types';

/** "Give reasons" — a "why" question, then a longer-form reasoned answer. */
export function ReasonsExercise({ items }: { items: ReasonsItem[] }) {
  const theme = useTheme();
  if (items.length === 0) return <EmptyExerciseState label="Give reasons" />;

  return (
    <>
      {items.map((item) => (
        <View key={item.id} style={styles.block}>
          <View style={styles.row}>
            <View style={[styles.bubble, { backgroundColor: theme.tint }]}>
              <ThemedText type="smallBold" themeColor="onTint">
                ?
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

          <View style={[styles.reasonBox, { borderColor: theme.border }]}>
            <View style={styles.f1}>
              <ThemedText type="smallBold" themeColor="tint" style={styles.reasonLabel}>
                REASON
              </ThemedText>
              <ThemedText type="reading">{item.reason}</ThemedText>
              {(item.reasonTransliteration || item.reasonTranslation) && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.mt4}>
                  {[item.reasonTransliteration, item.reasonTranslation].filter(Boolean).join(' · ')}
                </ThemedText>
              )}
            </View>
            <MaterialCommunityIcons name="volume-high" size={17} color={theme.textDisabled} />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  qCaption: { marginLeft: Spacing.five, marginTop: 2 },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.two,
    marginTop: Spacing.two,
    marginLeft: Spacing.four,
  },
  reasonLabel: { letterSpacing: 0.5, marginBottom: 4 },
  bubble: { width: 22, height: 22, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  f1: { flex: 1 },
  mt4: { marginTop: 4 },
});
