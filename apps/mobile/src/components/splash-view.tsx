import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Colors, Radius } from '@/constants/theme';

/**
 * Shown while app/_layout.tsx holds the native splash open for a real boot
 * check (currently applyDevSettingsOnLaunch(), see services/dev-settings.ts
 * — a future "check for new content" step would extend the same gate). A
 * plain View/Text, not ThemedText/ThemedView — this sits on a fixed brand
 * surface regardless of theme, matching
 * design/Akshar Mobile.dc.html's "Splash" loading-state view. Copy says
 * "Learning app" rather than the design's literal "Homework helper..." —
 * see (tabs)/index.tsx's same substitution and why.
 */
export function SplashView() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 800, easing: Easing.linear }), -1, false);
  }, [rotation]);

  const spinnerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <MaterialCommunityIcons name="translate" size={36} color={Colors.light.tint} />
      </View>
      <Text style={styles.title}>Akshar</Text>
      <Text style={styles.tagline}>Learning app</Text>
      <Animated.View style={[styles.spinner, spinnerStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: Colors.light.tint,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: Radius.large,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '700', color: '#ffffff' },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  spinner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    borderTopColor: '#ffffff',
    marginTop: 14,
  },
});
