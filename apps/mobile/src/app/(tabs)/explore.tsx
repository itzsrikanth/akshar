import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { FadeInView } from '@/components/fade-in';
import { LoadingOverlay } from '@/components/loading-overlay';
import { ExploreSkeleton } from '@/components/skeletons/explore-skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useDownloads } from '@/hooks/use-downloads';
import { useScope } from '@/hooks/use-scope';
import { useTheme } from '@/hooks/use-theme';
import type { Catalog } from '@/services/content-repository';
import { autoResolve, filterChapters, LEVEL_KEYS, levelLabel, levelName, optionsAtLevel } from '@/services/hierarchy';
import { labelForLanguage, labelForScript, scopesEqual, type Scope } from '@/services/scope';
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
            <Touchable onPress={() => router.push('/search')} hitSlop={8}>
              <MaterialCommunityIcons name="magnify" size={22} color={theme.textSecondary} />
            </Touchable>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Browse the full catalog
          </ThemedText>

          {state.status === 'loading' ? (
            <ExploreSkeleton />
          ) : state.status === 'error' ? (
            <AsyncStateView state={state} />
          ) : (
            <FadeInView>
              <ExploreContent catalog={state.catalog} />
            </FadeInView>
          )}
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
  // Set when the user taps a breadcrumb to go back up the tree — pins the
  // display to that level instead of letting autoResolve immediately
  // re-skip through it, which would otherwise make "going up" a no-op for
  // any level that (like every level in today's catalog) has only one
  // option. Cleared the moment they pick an option at that level again.
  const [pinnedLevel, setPinnedLevel] = useState<number | null>(null);
  const autoResolved = useMemo(() => autoResolve(catalog.chapters, manualSelected), [catalog, manualSelected]);
  const resolved = pinnedLevel !== null ? autoResolved.slice(0, pinnedLevel) : autoResolved;
  const atChapterList = resolved.length === LEVEL_KEYS.length;
  const chaptersInScope = useMemo(() => filterChapters(catalog.chapters, resolved), [catalog, resolved]);

  const { scope, isSaved, setScope } = useScope(catalog);
  // Scope is board/state/medium/grade only (see services/scope.ts) — offer
  // to save it the moment those first 4 levels are resolved, regardless of
  // which subject the user is currently browsing into.
  const candidateScope: Scope | null =
    resolved.length >= 4
      ? { board: resolved[0] as string, state: resolved[1] as string, medium: resolved[2] as string, grade: resolved[3] as number }
      : null;
  const candidateIsCurrent = isSaved && scopesEqual(scope, candidateScope);

  const downloads = useDownloads();
  const notYetDownloaded = chaptersInScope.filter((c) => !downloads.isDownloaded(c.slug) && !downloads.isPending(c.slug));

  // A local flag, not just per-row `isPending` — "Download all" touches
  // every row at once, so it needs its own block against a second tap
  // firing a duplicate batch while the first is still in flight.
  const [batchDownloading, setBatchDownloading] = useState(false);
  const downloadAll = async () => {
    setBatchDownloading(true);
    try {
      await Promise.all(notYetDownloaded.map((c) => downloads.download(c.path, c.slug)));
    } finally {
      setBatchDownloading(false);
    }
  };

  return (
    <>
      <View style={styles.breadcrumbRow}>
        {resolved.map((value, i) => {
          const key = LEVEL_KEYS[i];
          const isLast = i === resolved.length - 1;
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
                <ThemedText type="small" themeColor="tint">
                  {label}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-right" size={15} color={theme.textDisabled} />
              </View>
            );
          // Every crumb goes back up the tree to the picker for that level —
          // including ones auto-filled because they only had one option, so
          // there's always a way up even through a run of singleton levels.
          return (
            <Touchable
              key={key}
              onPress={() => {
                setManualSelected(resolved.slice(0, i));
                setPinnedLevel(i);
              }}
              hitSlop={6}
            >
              {content}
            </Touchable>
          );
        })}
      </View>

      {candidateScope && (
        <Touchable
          onPress={() => !candidateIsCurrent && setScope(candidateScope)}
          disabled={candidateIsCurrent}
          style={styles.setScopeRow}
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name={candidateIsCurrent ? 'check-circle' : 'map-marker-outline'}
            size={16}
            color={candidateIsCurrent ? theme.success : theme.tint}
          />
          <ThemedText type="smallBold" themeColor={candidateIsCurrent ? 'success' : 'tint'}>
            {candidateIsCurrent ? 'This is your default scope' : 'Set as my default scope'}
          </ThemedText>
        </Touchable>
      )}

      {!atChapterList ? (
        <View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            {`CHOOSE A ${levelName(LEVEL_KEYS[resolved.length]).toUpperCase()}`}
          </ThemedText>
          {optionsAtLevel(catalog.chapters, resolved, resolved.length).map((option, i, options) => (
            <Touchable
              key={String(option)}
              onPress={() => {
                setManualSelected([...resolved, option]);
                setPinnedLevel(null);
              }}
              style={[styles.optionRow, i < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
            >
              <ThemedText type="default">{levelLabel(LEVEL_KEYS[resolved.length], option)}</ThemedText>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
            </Touchable>
          ))}
        </View>
      ) : (
        <View style={styles.relative}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              {`${chaptersInScope.length} CHAPTERS`}
            </ThemedText>
            {notYetDownloaded.length > 0 && (
              <Touchable onPress={downloadAll} disabled={batchDownloading} hitSlop={6}>
                <ThemedText type="smallBold" themeColor="tint">
                  Download all
                </ThemedText>
              </Touchable>
            )}
          </View>

          {chaptersInScope.map((chapter, i) => {
            const downloaded = downloads.isDownloaded(chapter.slug);
            const pending = downloads.isPending(chapter.slug);
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
                  {pending ? (
                    <ActivityIndicator size="small" color={theme.tint} />
                  ) : (
                    <Touchable
                      onPress={() => (downloaded ? downloads.remove(chapter.slug) : downloads.download(chapter.path, chapter.slug))}
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons
                        name={downloaded ? 'delete-outline' : 'download'}
                        size={20}
                        color={downloaded ? theme.error : theme.tint}
                      />
                    </Touchable>
                  )}
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
                </View>
              </View>
            );
            const rowStyle = [
              styles.chapterRow,
              i < chaptersInScope.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
            ];
            return (
              <Touchable
                key={chapter.slug}
                onPress={() => router.push({ pathname: '/reader', params: { path: chapter.path } })}
                style={rowStyle}
              >
                {row}
              </Touchable>
            );
          })}

          {batchDownloading && <LoadingOverlay message="Downloading chapters…" />}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  relative: { position: 'relative' },
  subtitle: { marginTop: 2, marginBottom: Spacing.three },
  breadcrumbRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2, marginBottom: Spacing.four },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  setScopeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.four },
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
