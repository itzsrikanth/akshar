import { StyleSheet, View } from 'react-native';

import { SkeletonBox, SkeletonCircle, SkeletonLine } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Matches Home's real layout (index.tsx) — see design/Akshar Mobile.dc.html's Skeleton view. */
export function HomeSkeleton() {
  const theme = useTheme();
  return (
    <View style={styles.content}>
      <View style={styles.section}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          CONTINUE READING
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <SkeletonLine width="55%" height={16} />
          <View style={styles.mt10}>
            <SkeletonLine width="35%" height={12} />
          </View>
          <View style={styles.mt8}>
            <SkeletonLine width="30%" height={12} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          YOUR SCOPE
        </ThemedText>
        <SkeletonBox width="100%" height={44} radius={Radius.medium} />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          SUBJECTS
        </ThemedText>
        <View style={[styles.subjectRow, { borderColor: theme.border }]}>
          <SkeletonCircle size={44} />
          <View style={styles.f1}>
            <SkeletonLine width="40%" height={14} />
            <View style={styles.mt6}>
              <SkeletonLine width="65%" height={11} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.six },
  section: { paddingHorizontal: Spacing.three, marginTop: Spacing.three },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  card: { padding: Spacing.three, borderRadius: Radius.large },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  f1: { flex: 1 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
});
