import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Placeholder data — no content-fetch or local-progress layer exists yet
// (see docs/tech-implementation.md's repository-pattern plan). Real values
// below (title, board/state/medium/grade/subject) are ch01-bannada-tagadina's
// actual api/contents.json entry; "progress" and "downloaded" counts are
// static mockups matching the Claude Design source, not live-tracked yet.
const SCOPE_CHIPS = ['KSEEB', 'Karnataka', 'English medium', 'Grade 5', 'Kannada'];
const CONTINUE_READING = {
  title: 'ಬಣ್ಣದ ತಗಡಿನ ತುತ್ತೂರಿ',
  meta: 'KSEEB · Karnataka · Grade 5 · Kannada',
  segmentsRead: 5,
  segmentsTotal: 12,
};

export default function HomeScreen() {
  const theme = useTheme();
  const progressPct = Math.round((CONTINUE_READING.segmentsRead / CONTINUE_READING.segmentsTotal) * 100);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <AppHeader subtitle="Homework helper for Kannada, Grade 5" onSettingsPress={() => router.push('/settings')} />

          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              CONTINUE READING
            </ThemedText>
            <ThemedView type="backgroundElement" style={[styles.card, { borderRadius: Radius.large }]}>
              <ThemedText type="subtitle">{CONTINUE_READING.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.mt4}>
                {CONTINUE_READING.meta}
              </ThemedText>
              <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: theme.tint }]} />
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.mt6}>
                {CONTINUE_READING.segmentsRead} of {CONTINUE_READING.segmentsTotal} segments read
              </ThemedText>
              <View style={[styles.pillButton, { backgroundColor: theme.tint }]}>
                <ThemedText type="smallBold" themeColor="onTint">
                  Continue reading
                </ThemedText>
              </View>
            </ThemedView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                YOUR SCOPE
              </ThemedText>
              <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
                <ThemedText type="smallBold" themeColor="tint">
                  Edit
                </ThemedText>
              </Pressable>
            </View>
            <View style={styles.chipsRow}>
              {SCOPE_CHIPS.map((label) => (
                <View key={label} style={[styles.chip, { borderColor: theme.border }]}>
                  <ThemedText type="small">{label}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              SUBJECTS
            </ThemedText>
            <View style={[styles.subjectRow, { borderColor: theme.border }]}>
              <View style={[styles.subjectIcon, { backgroundColor: theme.tintMuted }]}>
                <MaterialCommunityIcons name="translate" size={22} color={theme.tint} />
              </View>
              <View style={styles.f1}>
                <ThemedText type="default">Kannada</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.mt2}>
                  1 chapter downloaded · 1 available
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingBottom: Spacing.six },
  section: { paddingHorizontal: Spacing.three, marginTop: Spacing.three },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  card: { padding: Spacing.three },
  progressTrack: { height: 6, borderRadius: Radius.pill, marginTop: Spacing.three },
  progressFill: { height: 6, borderRadius: Radius.pill },
  pillButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, borderWidth: 1 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1, borderRadius: Radius.medium, padding: Spacing.three },
  subjectIcon: { width: 44, height: 44, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  f1: { flex: 1 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
});
