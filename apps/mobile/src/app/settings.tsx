import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Host, Picker } from '@expo/ui';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { FadeInView } from '@/components/fade-in';
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useReadingPreference } from '@/hooks/use-reading-preference';
import { useScope } from '@/hooks/use-scope';
import { useTheme } from '@/hooks/use-theme';
import type { Catalog } from '@/services/content-repository';
import { filterChapters } from '@/services/hierarchy';
import { availableLanguages, availableScripts, labelForLanguage, labelForScript } from '@/services/scope';

export default function SettingsScreen() {
  const state = useCatalog();

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
            Settings
          </ThemedText>

          {state.status === 'loading' ? (
            <SettingsSkeleton />
          ) : state.status === 'error' ? (
            <AsyncStateView state={state} />
          ) : (
            <FadeInView>
              <SettingsContent catalog={state.catalog} />
            </FadeInView>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SettingsContent({ catalog }: { catalog: Catalog }) {
  const theme = useTheme();
  const { scope, isSaved } = useScope(catalog);
  // Scoped to the saved default scope, not the whole catalog — a parent
  // should never be offered a language/script that isn't actually available
  // for their kid's board/state/medium/grade (see services/scope.ts).
  // Today this is a no-op (one scope, one language, one script exist) — it
  // stops being one the moment content grows.
  const scopedChapters = useMemo(
    () => (scope ? filterChapters(catalog.chapters, [scope.board, scope.state, scope.medium, scope.grade]) : catalog.chapters),
    [catalog, scope],
  );
  const translationOptions = useMemo(
    () => availableLanguages(scopedChapters).map((code) => ({ label: labelForLanguage(code), value: code })),
    [scopedChapters],
  );
  const transliterationOptions = useMemo(
    () => availableScripts(scopedChapters).map((code) => ({ label: labelForScript(code), value: code })),
    [scopedChapters],
  );
  const { preference, setPreference } = useReadingPreference(catalog);
  const translation = preference.translationLanguage ?? translationOptions[0]?.value;
  const transliteration = preference.transliterationScript ?? transliterationOptions[0]?.value;

  return (
    <>
      {translationOptions.length > 0 && (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            READING LANGUAGES
          </ThemedText>
          <View style={[styles.card, { borderColor: theme.border }]}>
            <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <ThemedText type="default">Translation language</ThemedText>
              <Host matchContents>
                <Picker
                  selectedValue={translation}
                  onValueChange={(value) => setPreference({ translationLanguage: value })}
                >
                  {translationOptions.map((o) => (
                    <Picker.Item key={o.value} label={o.label} value={o.value} />
                  ))}
                </Picker>
              </Host>
            </View>
            <View style={styles.row}>
              <ThemedText type="default">Transliteration script</ThemedText>
              <Host matchContents>
                <Picker
                  selectedValue={transliteration}
                  onValueChange={(value) => setPreference({ transliterationScript: value })}
                >
                  {transliterationOptions.map((o) => (
                    <Picker.Item key={o.value} label={o.label} value={o.value} />
                  ))}
                </Picker>
              </Host>
            </View>
          </View>
        </>
      )}

      {scope && (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            DEFAULT SCOPE
          </ThemedText>
          <Touchable onPress={() => router.push('/scope-setup')} style={[styles.card, styles.row, { borderColor: theme.border }]}>
            <View style={styles.f1}>
              <ThemedText type="small">
                {`${scope.board} · ${scope.state} · ${scope.medium} · Grade ${scope.grade}`}
              </ThemedText>
              {!isSaved && (
                <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
                  Using default — tap to set your own
                </ThemedText>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
          </Touchable>
        </>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        ABOUT
      </ThemedText>
      <View style={[styles.card, { borderColor: theme.border }]}>
        <Touchable
          onPress={() => Linking.openURL('https://github.com/itzsrikanth/akshar/blob/main/apps/mobile/PRIVACY_POLICY.md')}
          style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
        >
          <ThemedText type="default" style={styles.f1}>
            Privacy policy
          </ThemedText>
          <MaterialCommunityIcons name="open-in-new" size={16} color={theme.textDisabled} />
        </Touchable>
        <Touchable onPress={() => Linking.openURL('https://github.com/itzsrikanth/akshar')} style={styles.row}>
          <ThemedText type="default" style={styles.f1}>
            Source code
          </ThemedText>
          <MaterialCommunityIcons name="open-in-new" size={16} color={theme.textDisabled} />
        </Touchable>
      </View>
      <ThemedText type="small" themeColor="textDisabled" style={styles.versionText}>
        {`Akshar ${Constants.expoConfig?.version ?? ''}`}
      </ThemedText>

      {__DEV__ && (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            DEVELOPER
          </ThemedText>
          <Touchable onPress={() => router.push('/dev-settings')} style={[styles.card, styles.row, { borderColor: theme.border }]}>
            <ThemedText type="small" style={styles.f1}>
              Content source, test flags
            </ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
          </Touchable>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  pageTitle: { marginTop: Spacing.three, marginBottom: Spacing.four },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  card: { borderWidth: 1, borderRadius: Radius.medium, marginBottom: Spacing.four, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  f1: { flex: 1 },
  mt2: { marginTop: 2 },
  versionText: { textAlign: 'center', marginTop: Spacing.two, marginBottom: Spacing.four },
});
