import * as Sentry from '@sentry/react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { OnboardingFlow } from '@/components/onboarding-flow';
import { SplashView } from '@/components/splash-view';
import { useCatalog } from '@/hooks/use-catalog';
import { primeCatalog } from '@/services/catalog-store';
import { initCrashReporting } from '@/services/crash-reporting';
import { applyDevSettingsOnLaunch } from '@/services/dev-settings';
import { hasCompletedOnboarding } from '@/services/onboarding-storage';
import { deriveScope } from '@/services/scope';

SplashScreen.preventAutoHideAsync();
// As early as possible, before the rest of the app's modules even finish loading —
// see services/crash-reporting.ts (a no-op until a real DSN is configured).
initCrashReporting();

function RootLayout() {
  const colorScheme = useColorScheme();
  // Gates the first render, not just the splash hide — holding the splash
  // alone wouldn't stop a tab screen underneath from already firing its own
  // catalog fetch against the wrong content source. In production this
  // resolves quickly: dev settings are a no-op, and primeCatalog() only
  // blocks on the network when there's no cached catalog yet (first launch
  // ever) — every launch after that renders from cache immediately while
  // a fresh fetch runs in the background (see services/catalog-store.ts).
  const [ready, setReady] = useState(false);
  // Whether onboarding still needs to run — independent of scope/reading-
  // preference state (see services/onboarding-storage.ts), read alongside
  // the other boot-time checks so it's known before first render.
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const catalogState = useCatalog();

  useEffect(() => {
    // Hand off from the native splash (a static image, app.json) to our own
    // SplashView immediately — same background color (Colors.light.tint),
    // so the swap is invisible, but SplashView can show a live spinner for
    // however long the boot check actually takes.
    SplashScreen.hideAsync();
    applyDevSettingsOnLaunch()
      .then(() => Promise.all([primeCatalog(), hasCompletedOnboarding()]))
      .then(([, completed]) => setNeedsOnboarding(!completed))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <SplashView />;

  // Skip onboarding gracefully rather than block on a broken/empty catalog —
  // the normal Stack below already has its own per-screen error states for that.
  if (needsOnboarding && catalogState.status === 'ready' && deriveScope(catalogState.catalog)) {
    return <OnboardingFlow catalog={catalogState.catalog} onComplete={() => setNeedsOnboarding(false)} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="scope-setup" />
        <Stack.Screen name="reader" />
        <Stack.Screen name="exercises" />
        <Stack.Screen name="search" />
        <Stack.Screen name="dev-settings" />
      </Stack>
    </ThemeProvider>
  );
}

// Sentry.wrap adds touch-event breadcrumbs and correlates JS errors with native
// crash reports — the recommended integration point, per Sentry's RN docs.
export default Sentry.wrap(RootLayout);
