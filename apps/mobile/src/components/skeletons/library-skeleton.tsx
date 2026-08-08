import { StyleSheet, View } from 'react-native';

import { SkeletonCircle, SkeletonLine } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function Row({ last }: { last?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <SkeletonCircle size={44} />
      <View style={styles.f1}>
        <SkeletonLine width="70%" height={14} />
        <View style={styles.mt6}>
          <SkeletonLine width="45%" height={11} />
        </View>
      </View>
    </View>
  );
}

/** Matches Library's real layout ((tabs)/library.tsx). */
export function LibrarySkeleton() {
  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        DOWNLOADED
      </ThemedText>
      <Row />
      <Row last />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  f1: { flex: 1 },
  mt6: { marginTop: 6 },
});
