import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { applyDevSettingsOnLaunch } from '@/services/dev-settings';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Gates the first render, not just the splash hide — holding the splash
  // alone wouldn't stop a tab screen underneath from already firing its
  // catalog fetch against the wrong content source. In production this
  // resolves on the next tick (applyDevSettingsOnLaunch is a no-op there),
  // so there's no user-visible delay. This is also the seam a real
  // "check for new content" step would slot into later (see docs).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    applyDevSettingsOnLaunch().finally(() => {
      setReady(true);
      SplashScreen.hideAsync();
    });
  }, []);

  if (!ready) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="reader" />
        <Stack.Screen name="exercises" />
        <Stack.Screen name="search" />
        <Stack.Screen name="dev-settings" />
      </Stack>
    </ThemeProvider>
  );
}
