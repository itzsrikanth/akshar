import { StyleSheet, View } from 'react-native';

import { SkeletonBox, SkeletonLine } from '@/components/skeleton';
import { Radius, Spacing } from '@/constants/theme';

/** Matches Exercises' real layout (app/exercises.tsx). */
export function ExercisesSkeleton() {
  return (
    <View style={styles.content}>
      <View style={styles.mt2}>
        <SkeletonLine width="50%" height={13} />
      </View>

      <View style={styles.pillRow}>
        <SkeletonBox width={90} height={28} radius={Radius.pill} />
        <SkeletonBox width={80} height={28} radius={Radius.pill} />
        <SkeletonBox width={100} height={28} radius={Radius.pill} />
      </View>

      {[0, 1].map((i) => (
        <View key={i} style={styles.item}>
          <SkeletonLine width="90%" height={16} />
          <View style={styles.mt6}>
            <SkeletonLine width="60%" height={12} />
          </View>
          <View style={styles.answerBox}>
            <SkeletonLine width="70%" height={16} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.two },
  mt2: { marginTop: Spacing.two },
  pillRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, marginBottom: Spacing.four },
  item: { marginBottom: Spacing.four },
  answerBox: { marginTop: Spacing.two, marginLeft: Spacing.four },
  mt6: { marginTop: 6 },
});
