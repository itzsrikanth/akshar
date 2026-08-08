import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { SplashView } from '@/components/splash-view';
import { primeCatalog } from '@/services/catalog-store';
import { applyDevSettingsOnLaunch } from '@/services/dev-settings';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Gates the first render, not just the splash hide — holding the splash
  // alone wouldn't stop a tab screen underneath from already firing its own
  // catalog fetch against the wrong content source. In production this
  // resolves quickly: dev settings are a no-op, and primeCatalog() only
  // blocks on the network when there's no cached catalog yet (first launch
  // ever) — every launch after that renders from cache immediately while
  // a fresh fetch runs in the background (see services/catalog-store.ts).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hand off from the native splash (a static image, app.json) to our own
    // SplashView immediately — same background color (Colors.light.tint),
    // so the swap is invisible, but SplashView can show a live spinner for
    // however long the boot check actually takes.
    SplashScreen.hideAsync();
    applyDevSettingsOnLaunch()
      .then(() => primeCatalog())
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <SplashView />;

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
