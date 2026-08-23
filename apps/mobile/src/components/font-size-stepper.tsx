import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useFontScale } from '@/hooks/use-font-scale';
import { useTheme } from '@/hooks/use-theme';

/**
 * The one shared reading-text-size control — Reader/Exercises headers use it as-is, Settings
 * wraps it with `showLabel` for the current step name. Decrease/increase only ever move one step
 * at a time and disable at the fixed floor/ceiling (see hooks/use-font-scale.ts) — never
 * unbounded. Not itself `scalable` — the control's own size stays fixed regardless of the
 * setting it controls.
 */
export function FontSizeStepper({ showLabel = false }: { showLabel?: boolean }) {
  const theme = useTheme();
  const { decrease, increase, canDecrease, canIncrease, label } = useFontScale();

  return (
    <View style={styles.container}>
      {showLabel && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <View style={[styles.row, { borderColor: theme.border }]}>
        <Touchable onPress={decrease} disabled={!canDecrease} hitSlop={8} style={styles.button}>
          <ThemedText type="smallBold" themeColor={canDecrease ? 'text' : 'textDisabled'} style={styles.small}>
            A
          </ThemedText>
        </Touchable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Touchable onPress={increase} disabled={!canIncrease} hitSlop={8} style={styles.button}>
          <ThemedText type="smallBold" themeColor={canIncrease ? 'text' : 'textDisabled'} style={styles.large}>
            A
          </ThemedText>
        </Touchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { minWidth: 60 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Radius.pill, overflow: 'hidden' },
  button: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  divider: { width: 1, alignSelf: 'stretch', marginVertical: Spacing.one },
  small: { fontSize: 13 },
  large: { fontSize: 18 },
});
