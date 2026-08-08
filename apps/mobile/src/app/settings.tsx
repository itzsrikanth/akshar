import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Host, Picker } from '@expo/ui';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { FadeInView } from '@/components/fade-in';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
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

          {state.status !== 'ready' ? (
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

  // Local-only state, not yet persisted anywhere (no ProgressRepository yet).
  const [translation, setTranslation] = useState(translationOptions[0]?.value);
  const [transliteration, setTransliteration] = useState(transliterationOptions[0]?.value);

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
                <Picker selectedValue={translation} onValueChange={setTranslation}>
                  {translationOptions.map((o) => (
                    <Picker.Item key={o.value} label={o.label} value={o.value} />
                  ))}
                </Picker>
              </Host>
            </View>
            <View style={styles.row}>
              <ThemedText type="default">Transliteration script</ThemedText>
              <Host matchContents>
                <Picker selectedValue={transliteration} onValueChange={setTransliteration}>
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
});
