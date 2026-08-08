import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DOWNLOADED_SLUGS } from '@/constants/content';
import { Radius, Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useTheme } from '@/hooks/use-theme';
import type { Catalog } from '@/services/content-repository';
import { deriveScope, labelForLanguage, labelForScript } from '@/services/scope';

export default function ExploreScreen() {
  const theme = useTheme();
  const state = useCatalog();

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

          {state.status !== 'ready' ? <AsyncStateView state={state} /> : <ExploreContent catalog={state.catalog} />}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ExploreContent({ catalog }: { catalog: Catalog }) {
  const theme = useTheme();
  const scope = useMemo(() => deriveScope(catalog), [catalog]);

  return (
    <>
      {/* Static, not a hierarchy picker — every chapter in the real catalog
          shares this one board/state/medium/grade path today, so there's
          nowhere else the breadcrumb could actually navigate to yet. */}
      {scope && (
        <View style={styles.breadcrumbRow}>
          {[scope.board, scope.state, scope.medium, `Grade ${scope.grade}`].map((segment) => (
            <View key={segment} style={styles.breadcrumbItem}>
              <ThemedText type="small" themeColor="textSecondary">
                {segment}
              </ThemedText>
              <MaterialCommunityIcons name="chevron-right" size={15} color={theme.textDisabled} />
            </View>
          ))}
          <View style={[styles.subjectPill, { backgroundColor: theme.tintMuted }]}>
            <ThemedText type="smallBold" themeColor="tint">
              {scope.subject}
            </ThemedText>
          </View>
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          {`${catalog.chapters.length} CHAPTERS`}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="tint">
          Download all
        </ThemedText>
      </View>

      {catalog.chapters.map((chapter, i) => {
        const downloaded = DOWNLOADED_SLUGS.includes(chapter.slug);
        const badges = [...chapter.translations.map(labelForLanguage), ...chapter.transliterations.map(labelForScript)];
        const row = (
          <View style={styles.chapterRowInner}>
            <View style={[styles.chapterIcon, { backgroundColor: downloaded ? theme.tintMuted : theme.backgroundElement }]}>
              <MaterialCommunityIcons name="book-open-page-variant" size={22} color={downloaded ? theme.tint : theme.textDisabled} />
            </View>
            <View style={styles.f1}>
              <ThemedText type="default">{chapter.title}</ThemedText>
              {badges.length > 0 ? (
                <View style={styles.badgeRow}>
                  {badges.map((badge) => (
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
                  No transliteration or translation yet
                </ThemedText>
              )}
            </View>
            <View style={styles.chapterActions}>
              <MaterialCommunityIcons
                name={downloaded ? 'delete-outline' : 'download'}
                size={20}
                color={downloaded ? theme.error : theme.tint}
              />
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
            </View>
          </View>
        );
        const rowStyle = [
          styles.chapterRow,
          i < catalog.chapters.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
        ];
        return (
          <Pressable
            key={chapter.slug}
            onPress={() => router.push({ pathname: '/reader', params: { path: chapter.path } })}
            style={rowStyle}
          >
            {row}
          </Pressable>
        );
      })}
    </>
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
  chapterRow: { paddingVertical: Spacing.three },
  chapterRowInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  chapterIcon: { width: 44, height: 44, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  chapterActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 5 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: Radius.pill },
  f1: { flex: 1 },
  mt5: { marginTop: 5 },
});
