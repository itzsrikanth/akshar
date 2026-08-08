import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Host, Picker } from '@expo/ui';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useTheme } from '@/hooks/use-theme';
import type { Catalog } from '@/services/content-repository';
import { availableLanguages, availableScripts, deriveScope, labelForLanguage, labelForScript } from '@/services/scope';

export default function SettingsScreen() {
  const state = useCatalog();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="tint">
              ← Back
            </ThemedText>
          </Pressable>

          <ThemedText type="subtitle" style={styles.pageTitle}>
            Settings
          </ThemedText>

          {state.status !== 'ready' ? <AsyncStateView state={state} /> : <SettingsContent catalog={state.catalog} />}
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
  const scope = useMemo(() => deriveScope(catalog), [catalog]);

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
          <Pressable onPress={() => router.push('/explore')} style={[styles.card, styles.row, { borderColor: theme.border }]}>
            <ThemedText type="small" style={styles.f1}>
              {`${scope.board} · ${scope.state} · ${scope.medium} · Grade ${scope.grade} · ${scope.subject}`}
            </ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
          </Pressable>
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
});
