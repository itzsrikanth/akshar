import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Host, Picker } from '@expo/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Placeholder — only one option exists per row because that's genuinely all
// ch01-bannada-tagadina has (api/contents.json: translations: ["en"],
// transliterations: ["devanagari"]). Future: derive these lists by
// aggregating translations/transliterations across every chapter in the
// user's current scope, not hardcoding them — see docs/tech-implementation.md.
const TRANSLATION_OPTIONS = [{ label: 'English', value: 'en' }];
const TRANSLITERATION_OPTIONS = [{ label: 'Devanagari', value: 'devanagari' }];
const DEFAULT_SCOPE = 'KSEEB · Karnataka · English · Grade 5 · Kannada';

export default function SettingsScreen() {
  const theme = useTheme();
  // Local-only state, not yet persisted anywhere (no ProgressRepository yet).
  const [translation, setTranslation] = useState(TRANSLATION_OPTIONS[0].value);
  const [transliteration, setTransliteration] = useState(TRANSLITERATION_OPTIONS[0].value);

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

          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            READING LANGUAGES
          </ThemedText>
          <View style={[styles.card, { borderColor: theme.border }]}>
            <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <ThemedText type="default">Translation language</ThemedText>
              <Host matchContents>
                <Picker selectedValue={translation} onValueChange={setTranslation}>
                  {TRANSLATION_OPTIONS.map((o) => (
                    <Picker.Item key={o.value} label={o.label} value={o.value} />
                  ))}
                </Picker>
              </Host>
            </View>
            <View style={styles.row}>
              <ThemedText type="default">Transliteration script</ThemedText>
              <Host matchContents>
                <Picker selectedValue={transliteration} onValueChange={setTransliteration}>
                  {TRANSLITERATION_OPTIONS.map((o) => (
                    <Picker.Item key={o.value} label={o.label} value={o.value} />
                  ))}
                </Picker>
              </Host>
            </View>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            DEFAULT SCOPE
          </ThemedText>
          <View style={[styles.card, styles.row, { borderColor: theme.border }]}>
            <ThemedText type="small" style={styles.f1}>
              {DEFAULT_SCOPE}
            </ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
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
