import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

/**
 * Wraps a screen's "ready" content (the branch shown once
 * useAsyncResource-backed data has loaded) so it fades in instead of
 * abruptly replacing the AsyncStateView spinner. No default sizing — most
 * call sites render plain block content inside an outer ScrollView, where a
 * default flex: 1 would collapse; pass `style={{ flex: 1 }}` explicitly at
 * the few sites (Home, Reader) where the child is itself a top-level
 * ScrollView expected to fill the remaining space.
 */
export function FadeInView({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeIn.duration(220)} style={style}>
      {children}
    </Animated.View>
  );
}
