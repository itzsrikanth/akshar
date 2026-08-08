import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useDevSettings } from '@/hooks/use-dev-settings';
import { useTheme } from '@/hooks/use-theme';
import { CONTENT_SOURCES, type ContentSourceId } from '@/services/config';

const SOURCE_LABELS: Record<ContentSourceId, string> = {
  local: 'Local content server',
  cdn: 'jsDelivr (CDN)',
};

// Only ever reachable via Settings' "Developer" section, itself hidden
// outside __DEV__ — this redirect covers a direct deep link in a build
// where that section wasn't shown, since the route file still exists
// either way (see docs/local-dev-content-server.md).
export default function DevSettingsScreen() {
  if (!__DEV__) return <Redirect href="/settings" />;
  return <DevSettingsContent />;
}

function DevSettingsContent() {
  const theme = useTheme();
  const { contentSource, loaded, setContentSource } = useDevSettings();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Touchable onPress={() => router.back()} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="tint">
              ← Back
            </ThemedText>
          </Touchable>

          <ThemedText type="subtitle" style={styles.pageTitle}>
            Developer settings
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Dev-build only — never shown in a release build.
          </ThemedText>

          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            CONTENT SOURCE
          </ThemedText>
          <View style={[styles.card, { borderColor: theme.border }]}>
            {(Object.keys(CONTENT_SOURCES) as ContentSourceId[]).map((id, i, ids) => {
              const active = loaded && (contentSource ?? (__DEV__ ? 'local' : 'cdn')) === id;
              return (
                <Touchable
                  key={id}
                  onPress={() => setContentSource(id)}
                  style={[styles.row, i < ids.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                >
                  <View style={styles.f1}>
                    <ThemedText type="default">{SOURCE_LABELS[id]}</ThemedText>
                    <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
                      {CONTENT_SOURCES[id]}
                    </ThemedText>
                  </View>
                  {active && <MaterialCommunityIcons name="check-circle" size={18} color={theme.success} />}
                </Touchable>
              );
            })}
          </View>
          <ThemedText type="small" themeColor="textDisabled" style={styles.hint}>
            Takes effect immediately for new fetches; already-loaded screens pick it up next time you navigate to them.
          </ThemedText>

          <ThemedText type="small" themeColor="textDisabled" style={styles.hint}>
            Splash/onboarding skip toggles will land here once those flows exist.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  pageTitle: { marginTop: Spacing.three, marginBottom: 2 },
  subtitle: { marginBottom: Spacing.four },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  card: { borderWidth: 1, borderRadius: Radius.medium, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  hint: { marginTop: Spacing.three },
  f1: { flex: 1 },
  mt2: { marginTop: 2 },
});
