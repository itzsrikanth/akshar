import { StyleSheet, View } from 'react-native';

import { SkeletonBox, SkeletonLine } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Matches Settings' real layout (app/settings.tsx). */
export function SettingsSkeleton() {
  const theme = useTheme();
  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        READING LANGUAGES
      </ThemedText>
      <View style={[styles.card, { borderColor: theme.border }]}>
        <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
          <SkeletonLine width="45%" height={14} />
          <SkeletonLine width={70} height={13} />
        </View>
        <View style={styles.row}>
          <SkeletonLine width="45%" height={14} />
          <SkeletonLine width={70} height={13} />
        </View>
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={[styles.sectionLabel, styles.mt4]}>
        DEFAULT SCOPE
      </ThemedText>
      <SkeletonBox width="100%" height={48} radius={Radius.medium} />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  mt4: { marginTop: Spacing.four },
  card: { borderWidth: 1, borderRadius: Radius.medium, marginBottom: Spacing.four, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
});
