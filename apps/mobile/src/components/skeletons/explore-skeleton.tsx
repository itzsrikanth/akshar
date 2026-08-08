import { StyleSheet, View } from 'react-native';

import { SkeletonBox, SkeletonLine } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function Row({ last }: { last?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <SkeletonBox width={44} height={44} radius={Radius.medium} />
      <View style={styles.f1}>
        <SkeletonLine width="75%" height={16} />
        <View style={styles.badgeRow}>
          <SkeletonBox width={40} height={16} radius={Radius.pill} />
          <SkeletonBox width={70} height={16} radius={Radius.pill} />
        </View>
      </View>
    </View>
  );
}

/** Matches Explore's real layout ((tabs)/explore.tsx) once resolved to a chapter list. */
export function ExploreSkeleton() {
  return (
    <View>
      <SkeletonLine width="60%" height={13} />
      <View style={styles.sectionHeaderRow}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          CHAPTERS
        </ThemedText>
      </View>
      <Row />
      <Row last />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: { marginTop: Spacing.four, marginBottom: Spacing.two },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 5 },
  f1: { flex: 1 },
});
