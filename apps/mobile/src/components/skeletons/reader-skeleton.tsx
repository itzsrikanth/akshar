import { StyleSheet, View } from 'react-native';

import { SkeletonBox, SkeletonLine } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Matches Reader's real layout (app/reader.tsx). */
export function ReaderSkeleton() {
  const theme = useTheme();
  return (
    <View style={styles.content}>
      <SkeletonLine width="60%" height={18} />
      <View style={styles.mt6}>
        <SkeletonLine width="80%" height={12} />
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        INTRODUCTION
      </ThemedText>
      <SkeletonLine width="100%" height={18} />
      <View style={styles.mt6}>
        <SkeletonLine width="90%" height={15} />
      </View>
      <View style={styles.mt6}>
        <SkeletonLine width="70%" height={15} />
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
        <SkeletonLine width="55%" height={16} />
        <View style={styles.mt10}>
          <SkeletonLine width="65%" height={13} />
        </View>
        <View style={styles.mt10}>
          <SkeletonLine width="50%" height={13} />
        </View>
      </View>

      <View style={[styles.section, styles.row, { backgroundColor: theme.backgroundElement }]}>
        <SkeletonBox width="60%" height={16} />
        <SkeletonBox width={22} height={22} radius={Radius.pill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.two },
  section: { marginTop: Spacing.four, padding: Spacing.three, borderRadius: Radius.medium },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.four, marginBottom: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mt6: { marginTop: 6 },
  mt10: { marginTop: 10 },
});
