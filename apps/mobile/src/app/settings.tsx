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
  // Derived from every chapter in the catalog, not hardcoded — one option
  // per row today only because that's genuinely all the real content has
  // (see docs/tech-implementation.md). Adding a chapter with a new
  // translation/script makes it show up here automatically.
  const translationOptions = useMemo(
    () => availableLanguages(catalog).map((code) => ({ label: labelForLanguage(code), value: code })),
    [catalog],
  );
  const transliterationOptions = useMemo(
    () => availableScripts(catalog).map((code) => ({ label: labelForScript(code), value: code })),
    [catalog],
  );
  const { scope, isSaved } = useScope(catalog);
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
          <Touchable onPress={() => router.push('/explore')} style={[styles.card, styles.row, { borderColor: theme.border }]}>
            <View style={styles.f1}>
              <ThemedText type="small">
                {`${scope.board} · ${scope.state} · ${scope.medium} · Grade ${scope.grade}`}
              </ThemedText>
              {!isSaved && (
                <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
                  Using default — browse Explore to set your own
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
