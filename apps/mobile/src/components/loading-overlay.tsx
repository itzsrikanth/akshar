import { ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/**
 * Full-screen (within its nearest positioned ancestor) blocking loader —
 * see design/Akshar Mobile.dc.html's "Full-screen loader" treatment.
 * Absolute-fills its parent and sits on top, so nothing behind it is
 * reachable while shown. For actions that touch several items at once
 * (e.g. "Download all") where a per-row spinner alone wouldn't stop a
 * second tap from re-triggering the whole batch. The design uses a
 * background blur; skipped here (no expo-blur dependency) in favor of a
 * plain translucent scrim — same "you can't interact right now" read.
 */
export function LoadingOverlay({ message = 'Loading…' }: { message?: string }) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: `${theme.background}CC` }]}
    >
      <ActivityIndicator size="small" color={theme.tint} />
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.mt3}>
        {message}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  mt3: { marginTop: 4 },
});
