import * as Sentry from '@sentry/react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, useColorScheme } from 'react-native';

import { OnboardingFlow } from '@/components/onboarding-flow';
import { SplashView } from '@/components/splash-view';
import { V2SetupFlow } from '@/components/v2-setup-flow';
import { useCatalog } from '@/hooks/use-catalog';
import { useV2Catalog } from '@/hooks/use-v2-catalog';
import { primeCatalog } from '@/services/catalog-store';
import { initCrashReporting } from '@/services/crash-reporting';
import { applyDevSettingsOnLaunch } from '@/services/dev-settings';
import { primeFontScale } from '@/services/font-scale-store';
import { refreshMediaAvailability } from '@/services/media-availability';
import { hasCompletedOnboarding } from '@/services/onboarding-storage';
import { deriveScope } from '@/services/scope';
import { forceV2CatalogRefresh, hasCompletedV2Setup, primeV2Catalog } from '@/services/v2';

SplashScreen.preventAutoHideAsync();
initCrashReporting();

function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [needsV2Setup, setNeedsV2Setup] = useState(false);
  const catalogState = useCatalog();
  const v2CatalogState = useV2Catalog();

  useEffect(() => {
    SplashScreen.hideAsync();
    applyDevSettingsOnLaunch()
      .then(() =>
        Promise.all([
          primeCatalog(),
          primeV2Catalog(),
          hasCompletedOnboarding(),
          hasCompletedV2Setup(),
          primeFontScale(),
          refreshMediaAvailability(),
        ]),
      )
      .then(([, , completedOnboarding, completedV2Setup]) => {
        setNeedsOnboarding(!completedOnboarding);
        // Existing v1 users and fresh installs both need an explicit v2
        // selection once the v2 catalog is available — never silent migrate.
        setNeedsV2Setup(!completedV2Setup);
      })
      .finally(() => setReady(true));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshMediaAvailability();
    });
    return () => subscription.remove();
  }, []);

  if (!ready) return <SplashView />;

  // Prefer v2 setup when the publication catalog is ready. Fall back to the
  // legacy board/medium/grade onboarding only if v2 is unavailable.
  if (needsV2Setup && v2CatalogState.status === 'ready') {
    return (
      <V2SetupFlow
        catalog={v2CatalogState.catalog}
        isUpgrade={!needsOnboarding}
        onComplete={() => {
          setNeedsV2Setup(false);
          setNeedsOnboarding(false);
        }}
        onRetry={() => {
          void forceV2CatalogRefresh();
        }}
      />
    );
  }

  if (needsV2Setup && v2CatalogState.status === 'error' && needsOnboarding && catalogState.status === 'ready' && deriveScope(catalogState.catalog)) {
    return <OnboardingFlow catalog={catalogState.catalog} onComplete={() => setNeedsOnboarding(false)} />;
  }

  if (needsV2Setup && v2CatalogState.status === 'loading') {
    return <SplashView />;
  }

  if (needsOnboarding && catalogState.status === 'ready' && deriveScope(catalogState.catalog) && v2CatalogState.status !== 'ready') {
    return <OnboardingFlow catalog={catalogState.catalog} onComplete={() => setNeedsOnboarding(false)} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="scope-setup" />
        <Stack.Screen name="adoption-setup" />
        <Stack.Screen name="reader" />
        <Stack.Screen name="exercises" />
        <Stack.Screen name="search" />
        <Stack.Screen name="dev-settings" />
      </Stack>
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
