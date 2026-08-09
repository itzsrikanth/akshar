import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { ScopeSetupFlow } from '@/components/scope-setup-flow';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useReadingPreference } from '@/hooks/use-reading-preference';
import { useScope } from '@/hooks/use-scope';
import type { Catalog } from '@/services/content-repository';
import { saveReadingPreference } from '@/services/reading-preference-storage';
import { saveScope } from '@/services/scope-storage';

// Reached from Settings' "Default scope" row — reuses the same picker flow
// onboarding uses (components/scope-setup-flow.tsx), prefilled with the
// current saved scope/preference instead of catalog defaults. Explore stays
// a separate, unscoped full-catalog browse tool — this is specifically for
// "change my default", which Explore was never really the right fit for.
export default function ScopeSetupScreen() {
  const state = useCatalog();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {state.status !== 'ready' ? (
          <>
            <TopBar />
            <AsyncStateView state={state} />
          </>
        ) : (
          <ScopeSetupContent catalog={state.catalog} />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function TopBar() {
  return (
    <View style={styles.topBar}>
      <Touchable onPress={() => router.back()} hitSlop={8}>
        <ThemedText type="smallBold" themeColor="tint">
          ← Back
        </ThemedText>
      </Touchable>
    </View>
  );
}

function ScopeSetupContent({ catalog }: { catalog: Catalog }) {
  const { scope } = useScope(catalog);
  const { preference } = useReadingPreference(catalog);

  return (
    <>
      <Touchable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
        <ThemedText type="smallBold" themeColor="tint">
          ← Back
        </ThemedText>
      </Touchable>
      <ScopeSetupFlow
        catalog={catalog}
        initialScope={scope}
        initialPreference={preference}
        saveLabel="Save"
        onSave={(nextScope, nextPreference) => {
          saveScope(nextScope);
          saveReadingPreference(nextPreference);
          router.back();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: { padding: Spacing.three },
  backRow: { padding: Spacing.three },
});
