import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * A pulsing placeholder block for first-load skeleton screens (see
 * design/Akshar Mobile.dc.html's "Loading states" page, "Skeleton" view).
 * The design uses a gradient sweep; this uses an opacity pulse instead —
 * same "something is coming" read, no expo-linear-gradient dependency
 * needed just for a placeholder shape.
 */
export function SkeletonBox({
  width,
  height,
  radius = Radius.small,
  style,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.backgroundSelected }, animatedStyle, style]}
    />
  );
}

export function SkeletonLine({ width, height = 13 }: { width: DimensionValue; height?: number }) {
  return <SkeletonBox width={width} height={height} radius={4} />;
}

export function SkeletonCircle({ size }: { size: number }) {
  return <SkeletonBox width={size} height={size} radius={size / 2} />;
}
