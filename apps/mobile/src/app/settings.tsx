import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Host, Picker } from '@expo/ui';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { FadeInView } from '@/components/fade-in';
import { FontSizeStepper } from '@/components/font-size-stepper';
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useReadingPreference } from '@/hooks/use-reading-preference';
import { useScope } from '@/hooks/use-scope';
import { useTheme } from '@/hooks/use-theme';
import { useV2Catalog } from '@/hooks/use-v2-catalog';
import { useV2Selection } from '@/hooks/use-v2-selection';
import { openFeedbackForm } from '@/services/crash-reporting';
import type { Catalog } from '@/services/content-repository';
import { filterChapters } from '@/services/hierarchy';
import { availableLanguages, availableScripts, labelForLanguage, labelForScript } from '@/services/scope';
import { clearLegacyV1LocalData, findAdoptionOption } from '@/services/v2';

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
  const v2Catalog = useV2Catalog();
  const { selection } = useV2Selection();
  const adoption =
    selection && v2Catalog.status === 'ready'
      ? findAdoptionOption(v2Catalog.catalog, selection.adoptionId)
      : undefined;
  const [clearingLegacy, setClearingLegacy] = useState(false);
  const scopedChapters = useMemo(
    () => (scope ? filterChapters(catalog.chapters, [scope.board, scope.state, scope.medium, scope.grade]) : catalog.chapters),
    [catalog, scope],
  );
  // Prefer languages available on the selected v2 edition so Settings tracks
  // the publication catalog after setup, not only legacy board/grade filters.
  const editionLanguageChapters = useMemo(() => {
    if (!selection || v2Catalog.status !== 'ready') return null;
    return v2Catalog.catalog.chapters.filter(
      (chapter) => chapter.bookId === selection.bookId && chapter.editionId === selection.editionId,
    );
  }, [selection, v2Catalog]);
  const translationOptions = useMemo(() => {
    const codes = editionLanguageChapters
      ? Array.from(new Set(editionLanguageChapters.flatMap((chapter) => chapter.translations))).sort()
      : availableLanguages(scopedChapters);
    return codes.map((code) => ({ label: labelForLanguage(code), value: code }));
  }, [editionLanguageChapters, scopedChapters]);
  const transliterationOptions = useMemo(() => {
    const codes = editionLanguageChapters
      ? Array.from(new Set(editionLanguageChapters.flatMap((chapter) => chapter.transliterations))).sort()
      : availableScripts(scopedChapters);
    return codes.map((code) => ({ label: labelForScript(code), value: code }));
  }, [editionLanguageChapters, scopedChapters]);
  const { preference, setPreference } = useReadingPreference(catalog);
  const translation = preference.translationLanguage ?? translationOptions[0]?.value;
  const transliteration = preference.transliterationScript ?? transliterationOptions[0]?.value;

  const confirmClearLegacy = () => {
    Alert.alert(
      'Remove old offline copies?',
      'This deletes legacy folder-based downloads, reading history, and the old saved scope on this device. Your new book downloads, learner context, and reading preferences stay. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove old copies',
          style: 'destructive',
          onPress: () => {
            setClearingLegacy(true);
            clearLegacyV1LocalData()
              .catch((err) => {
                Alert.alert('Could not clear old data', err instanceof Error ? err.message : String(err));
              })
              .finally(() => setClearingLegacy(false));
          },
        },
      ],
    );
  };

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
              <Host matchContents colorScheme="light">
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
              <Host matchContents colorScheme="light">
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

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        TEXT SIZE
      </ThemedText>
      <View style={[styles.card, styles.row, { borderColor: theme.border }]}>
        <ThemedText type="default">Reading text size</ThemedText>
        <FontSizeStepper showLabel />
      </View>

      {(adoption || selection) && (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            LEARNER CONTEXT
          </ThemedText>
          <Touchable
            onPress={() => router.push('/adoption-setup')}
            style={[styles.card, styles.row, { borderColor: theme.border }]}
          >
            <View style={styles.f1}>
              <ThemedText type="small">{adoption?.displayLabel ?? selection!.adoptionId}</ThemedText>
              <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
                {adoption ? `${adoption.bookTitle} · tap to switch context` : 'Tap to choose a learner context'}
              </ThemedText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
          </Touchable>
        </>
      )}

      {scope && !selection && (
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

      {selection && (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            STORAGE
          </ThemedText>
          <Touchable
            onPress={confirmClearLegacy}
            disabled={clearingLegacy}
            style={[styles.card, styles.row, { borderColor: theme.border, opacity: clearingLegacy ? 0.5 : 1 }]}
          >
            <View style={styles.f1}>
              <ThemedText type="small">Remove old offline copies</ThemedText>
              <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
                Clears legacy downloads and history only. Keeps your current book downloads and learner context.
              </ThemedText>
            </View>
            <MaterialCommunityIcons name="delete-outline" size={18} color={theme.error} />
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
        <Touchable
          onPress={() => Linking.openURL('https://github.com/itzsrikanth/akshar')}
          style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
        >
          <ThemedText type="default" style={styles.f1}>
            Source code
          </ThemedText>
          <MaterialCommunityIcons name="open-in-new" size={16} color={theme.textDisabled} />
        </Touchable>
        <Touchable onPress={openFeedbackForm} style={styles.row}>
          <ThemedText type="default" style={styles.f1}>
            Report a problem
          </ThemedText>
          <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  f1: { flex: 1 },
  mt2: { marginTop: 2 },
  versionText: { textAlign: 'center', marginTop: Spacing.two, marginBottom: Spacing.four },
});
