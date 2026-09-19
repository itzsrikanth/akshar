import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { SplashView } from '@/components/splash-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { V2SetupFlow } from '@/components/v2-setup-flow';
import { Spacing } from '@/constants/theme';
import { useV2Catalog } from '@/hooks/use-v2-catalog';
import { forceV2CatalogRefresh } from '@/services/v2';

/** Reselection entry from Settings — same adoption picker, not a destructive reset. */
export default function AdoptionSetupScreen() {
  const state = useV2Catalog();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Touchable onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <ThemedText type="smallBold" themeColor="tint">
            ← Back
          </ThemedText>
        </Touchable>
        {state.status === 'loading' ? (
          <SplashView />
        ) : state.status === 'error' ? (
          <View style={styles.errorBlock}>
            <AsyncStateView state={state} />
            <Touchable onPress={() => void forceV2CatalogRefresh()} style={styles.retry}>
              <ThemedText type="smallBold" themeColor="tint">
                Retry
              </ThemedText>
            </Touchable>
          </View>
        ) : (
          <V2SetupFlow
            catalog={state.catalog}
            isUpgrade={false}
            onComplete={() => router.back()}
            onRetry={() => {
              void forceV2CatalogRefresh();
            }}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  back: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  errorBlock: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.three },
  retry: { alignSelf: 'center' },
});
