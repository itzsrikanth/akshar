import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Placeholder — real chapter titles/coverage from api/contents.json
// (KSEEB/Karnataka/English/Grade5/Kannada), but there's only ever been one
// board/state/medium/grade/subject combination in the content so far, so
// there's nowhere else the breadcrumb could actually navigate to yet. Kept
// static rather than wired to fake hierarchy navigation. Same for
// download/delete/"Download all" — no download layer exists yet (see
// docs/tech-implementation.md), so these render the target visual state but
// aren't Pressable.
const BREADCRUMB = ['KSEEB', 'Karnataka', 'English', 'Grade 5'];
const CURRENT_SUBJECT = 'Kannada';
const CHAPTERS = [
  { title: 'ಬಣ್ಣದ ತಗಡಿನ ತುತ್ತೂರಿ', badges: ['EN', 'Devanagari'], caption: null, downloaded: true },
  { title: 'ನನ್ನ ಕನಸು', badges: [] as string[], caption: 'No transliteration or translation yet', downloaded: false },
];

export default function ExploreScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <ThemedText type="subtitle">Explore</ThemedText>
            <Pressable onPress={() => router.push('/search')} hitSlop={8}>
              <MaterialCommunityIcons name="magnify" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Browse the full catalog
          </ThemedText>

          <View style={styles.breadcrumbRow}>
            {BREADCRUMB.map((segment) => (
              <View key={segment} style={styles.breadcrumbItem}>
                <ThemedText type="small" themeColor="textSecondary">
                  {segment}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-right" size={15} color={theme.textDisabled} />
              </View>
            ))}
            <View style={[styles.subjectPill, { backgroundColor: theme.tintMuted }]}>
              <ThemedText type="smallBold" themeColor="tint">
                {CURRENT_SUBJECT}
              </ThemedText>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              {CHAPTERS.length} CHAPTERS
            </ThemedText>
            <ThemedText type="smallBold" themeColor="tint">
              Download all
            </ThemedText>
          </View>

          {CHAPTERS.map((chapter, i) => (
            <View key={chapter.title} style={[styles.chapterRow, i < CHAPTERS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={[styles.chapterIcon, { backgroundColor: chapter.downloaded ? theme.tintMuted : theme.backgroundElement }]}>
                <MaterialCommunityIcons name="book-open-page-variant" size={22} color={chapter.downloaded ? theme.tint : theme.textDisabled} />
              </View>
              <View style={styles.f1}>
                <ThemedText type="default">{chapter.title}</ThemedText>
                {chapter.badges.length > 0 ? (
                  <View style={styles.badgeRow}>
                    {chapter.badges.map((badge) => (
                      // theme.success at reduced opacity via hex alpha, rather than a
                      // new successMuted token — a one-off availability badge, not
                      // reused enough yet to warrant expanding the token set.
                      <View key={badge} style={[styles.badge, { backgroundColor: `${theme.success}1A` }]}>
                        <ThemedText type="smallBold" themeColor="success">
                          {badge}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="textDisabled" style={styles.mt5}>
                    {chapter.caption}
                  </ThemedText>
                )}
              </View>
              <View style={styles.chapterActions}>
                <MaterialCommunityIcons
                  name={chapter.downloaded ? 'delete-outline' : 'download'}
                  size={20}
                  color={chapter.downloaded ? theme.error : theme.tint}
                />
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtitle: { marginTop: 2, marginBottom: Spacing.three },
  breadcrumbRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2, marginBottom: Spacing.four },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  subjectPill: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: Radius.pill },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  chapterIcon: { width: 44, height: 44, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  chapterActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 5 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: Radius.pill },
  f1: { flex: 1 },
  mt5: { marginTop: 5 },
});
