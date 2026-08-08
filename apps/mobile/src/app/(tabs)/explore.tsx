import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { autoResolve, filterChapters, LEVEL_KEYS, levelLabel, levelName, optionsAtLevel } from '@/services/hierarchy';
import { labelForLanguage, labelForScript } from '@/services/scope';
import type { LevelValue } from '@/services/hierarchy';

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
  // What the user has actually tapped — auto-filled with any level that
  // only ever has one possible value (see services/hierarchy.ts).
  const [manualSelected, setManualSelected] = useState<LevelValue[]>([]);
  const resolved = useMemo(() => autoResolve(catalog.chapters, manualSelected), [catalog, manualSelected]);
  const atChapterList = resolved.length === LEVEL_KEYS.length;
  const chaptersInScope = useMemo(() => filterChapters(catalog.chapters, resolved), [catalog, resolved]);

  return (
    <>
      <View style={styles.breadcrumbRow}>
        {resolved.map((value, i) => {
          const key = LEVEL_KEYS[i];
          const isLast = i === resolved.length - 1;
          // Only tappable if this level actually had more than one option
          // when it was resolved — otherwise it was auto-filled and
          // there's nothing else here to choose.
          const optionsHere = optionsAtLevel(catalog.chapters, resolved.slice(0, i), i);
          const tappable = optionsHere.length > 1;
          const label = levelLabel(key, value);
          const content =
            isLast && atChapterList ? (
              <View style={[styles.subjectPill, { backgroundColor: theme.tintMuted }]}>
                <ThemedText type="smallBold" themeColor="tint">
                  {label}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.breadcrumbItem}>
                <ThemedText type="small" themeColor={tappable ? 'tint' : 'textSecondary'}>
                  {label}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-right" size={15} color={theme.textDisabled} />
              </View>
            );
          return tappable ? (
            <Pressable key={key} onPress={() => setManualSelected(resolved.slice(0, i))} hitSlop={6}>
              {content}
            </Pressable>
          ) : (
            <View key={key}>{content}</View>
          );
        })}
      </View>

      {!atChapterList ? (
        <View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            {`CHOOSE A ${levelName(LEVEL_KEYS[resolved.length]).toUpperCase()}`}
          </ThemedText>
          {optionsAtLevel(catalog.chapters, resolved, resolved.length).map((option, i, options) => (
            <Pressable
              key={String(option)}
              onPress={() => setManualSelected([...resolved, option])}
              style={[styles.optionRow, i < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
            >
              <ThemedText type="default">{levelLabel(LEVEL_KEYS[resolved.length], option)}</ThemedText>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              {`${chaptersInScope.length} CHAPTERS`}
            </ThemedText>
            <ThemedText type="smallBold" themeColor="tint">
              Download all
            </ThemedText>
          </View>

          {chaptersInScope.map((chapter, i) => {
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
              i < chaptersInScope.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
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
      )}
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
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  chapterRow: { paddingVertical: Spacing.three },
  chapterRowInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  chapterIcon: { width: 44, height: 44, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  chapterActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 5 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: Radius.pill },
  f1: { flex: 1 },
  mt5: { marginTop: 5 },
});
