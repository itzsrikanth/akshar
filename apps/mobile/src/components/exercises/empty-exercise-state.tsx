import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Shown when an exercise type's component is registered but this chapter
// has no content shaped for it yet — e.g. no schema field distinguishes a
// "why" question worth a Give Reasons treatment from any other question
// today, and no chapter has True/False content yet. An empty pill that does
// nothing would be confusing; fabricating items to fill it would violate
// grounding every screen in real content.
export function EmptyExerciseState({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textDisabled">
        No "{label}" exercises for this chapter yet.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: Radius.medium, padding: Spacing.four, alignItems: 'center' },
});
