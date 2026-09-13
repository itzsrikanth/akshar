import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useDevSettings } from '@/hooks/use-dev-settings';
import { useTheme } from '@/hooks/use-theme';
import { CONTENT_SOURCES, type ContentSourceId } from '@/services/config';
import { resetLocalDataAndRestart } from '@/services/reset-local-data';

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
  const [changingSource, setChangingSource] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetStarted, setResetStarted] = useState(false);
  const actionPending = useRef(false);

  const changeSource = async (source: ContentSourceId) => {
    if (actionPending.current || resetStarted) return;
    actionPending.current = true;
    setChangingSource(true);
    try {
      await setContentSource(source);
    } catch {
      Alert.alert('Could not change content source', 'Please try again.');
    } finally {
      actionPending.current = false;
      setChangingSource(false);
    }
  };

  const confirmReset = () => {
    if (actionPending.current) return;
    actionPending.current = true;
    Alert.alert(
      'Reset all local app data?',
      'This permanently removes downloaded chapters, reading history, saved scope, reading preferences, font size, cached catalog, developer settings, and onboarding progress from Akshar on this device. The app will restart. Keep Metro and the local content server running to load onboarding again.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => { actionPending.current = false; } },
        {
          text: 'Reset and restart',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            setResetStarted(true);
            try {
              await resetLocalDataAndRestart();
            } catch (error) {
              Alert.alert('Reset needs attention', error instanceof Error ? error.message : 'Please retry the reset.');
              actionPending.current = false;
              setResetting(false);
            }
          },
        },
      ],
      { cancelable: false },
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Touchable onPress={() => router.back()} hitSlop={8} disabled={resetStarted}>
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
                  onPress={() => changeSource(id)}
                  disabled={!loaded || changingSource || resetStarted}
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
            Takes effect immediately — forces a catalog refetch from the new source everywhere in the app.
          </ThemedText>

          <ThemedText type="small" themeColor="textSecondary" style={[styles.sectionLabel, styles.resetSection]}>
            RESET LOCAL DATA
          </ThemedText>
          <Touchable
            onPress={confirmReset}
            disabled={changingSource || resetting}
            accessibilityRole="button"
            accessibilityState={{ disabled: changingSource || resetting, busy: resetting }}
            style={[styles.card, styles.row, { borderColor: theme.error }]}
          >
            <ThemedText type="smallBold" themeColor="error" style={styles.f1}>
              {resetting ? 'Clearing data and restarting…' : 'Reset local data and restart'}
            </ThemedText>
            {resetting ? (
              <ActivityIndicator color={theme.error} />
            ) : (
              <MaterialCommunityIcons name="delete-forever-outline" size={22} color={theme.error} />
            )}
          </Touchable>
          <ThemedText type="small" themeColor="textDisabled" style={styles.hint}>
            Start again from onboarding. Removes all saved app settings, history, catalog cache, and downloaded chapters. Does not change repository content or data on other devices. The content source returns to the local server default.
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
  resetSection: { marginTop: Spacing.four },
});
