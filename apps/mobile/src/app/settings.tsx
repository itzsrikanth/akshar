import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Placeholder — no language-picker or scope-editor screens exist yet, so
// these rows aren't wired to real navigation. Values match Home's
// placeholder scope; not yet backed by ProgressRepository (see
// docs/tech-implementation.md).
const READING_LANGUAGES = [
  { label: 'Translation language', value: 'English' },
  { label: 'Transliteration script', value: 'Devanagari' },
];
const DEFAULT_SCOPE = 'KSEEB · Karnataka · English · Grade 5 · Kannada';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="tint">
              ← Back
            </ThemedText>
          </Pressable>

          {/* Typography.title (24/700) deliberately, not ThemedText's own
              type="title" (48px) — that variant is the Home screen's app
              name, a different thing that happens to share the name.
              ThemedText's ad-hoc styles vs. the Typography token scale could
              use reconciling later; not done here to keep this change scoped. */}
          <ThemedText type="default" style={styles.pageTitle}>
            Settings
          </ThemedText>

          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            READING LANGUAGES
          </ThemedText>
          <View style={[styles.card, { borderColor: theme.border }]}>
            {READING_LANGUAGES.map((row, i) => (
              <View
                key={row.label}
                style={[styles.row, i < READING_LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                <ThemedText type="default">{row.label}</ThemedText>
                <View style={styles.rowValue}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {row.value}
                  </ThemedText>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
                </View>
              </View>
            ))}
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
  pageTitle: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  card: { borderWidth: 1, borderRadius: Radius.medium, marginBottom: Spacing.four, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  f1: { flex: 1 },
});
