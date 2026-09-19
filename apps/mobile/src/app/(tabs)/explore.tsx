import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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
import { useReadingPreference } from '@/hooks/use-reading-preference';
import { useScope } from '@/hooks/use-scope';
import { useTheme } from '@/hooks/use-theme';
import { useV2Catalog } from '@/hooks/use-v2-catalog';
import { useV2Downloads } from '@/hooks/use-v2-downloads';
import { useV2Selection } from '@/hooks/use-v2-selection';
import { forceCatalogRefresh } from '@/services/catalog-store';
import type { Catalog } from '@/services/content-repository';
import { autoResolve, filterChapters, LEVEL_KEYS, levelLabel, levelName, optionsAtLevel } from '@/services/hierarchy';
import { labelForLanguage, labelForScript, scopesEqual, type Scope } from '@/services/scope';
import type { LevelValue } from '@/services/hierarchy';
import {
  type V2Catalog,
  type V2CatalogChapter,
  type V2Selection,
  catalogChapterIdentity,
  chaptersForAdoption,
  findAdoptionOption,
  forceV2CatalogRefresh,
  listAdoptionOptions,
  selectionFromAdoption,
} from '@/services/v2';

export default function ExploreScreen() {
  const theme = useTheme();
  const v1State = useCatalog();
  const v2State = useV2Catalog();
  const { selection, loaded: selectionLoaded, setSelection } = useV2Selection();
  const preferenceCatalog =
    v1State.status === 'ready'
      ? v1State.catalog
      : ({ schemaVersion: '1.0', generatedAt: '', chapters: [] } as Catalog);
  const { preference } = useReadingPreference(preferenceCatalog);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([forceCatalogRefresh(), forceV2CatalogRefresh()]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const useV2 = selectionLoaded && selection !== null && v2State.status === 'ready';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
        >
          <View style={styles.headerRow}>
            <ThemedText type="subtitle">Explore</ThemedText>
            <Touchable onPress={() => router.push('/search')} hitSlop={8}>
              <MaterialCommunityIcons name="magnify" size={22} color={theme.textSecondary} />
            </Touchable>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            {useV2 ? 'Browse by publication and learner context' : 'Browse the full catalog'}
          </ThemedText>

          {!selectionLoaded || (useV2 ? false : v1State.status === 'loading') || (selection && v2State.status === 'loading') ? (
            <ExploreSkeleton />
          ) : useV2 && v2State.status === 'ready' && selection ? (
            <FadeInView>
              <ExploreV2Content
                catalog={v2State.catalog}
                selection={selection}
                onSelectionChange={setSelection}
                preference={preference}
              />
            </FadeInView>
          ) : v1State.status === 'error' ? (
            <AsyncStateView state={v1State} />
          ) : v1State.status === 'ready' ? (
            <FadeInView>
              <ExploreContent catalog={v1State.catalog} />
            </FadeInView>
          ) : v2State.status === 'error' ? (
            <AsyncStateView state={v2State} />
          ) : (
            <ExploreSkeleton />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ExploreV2Content({
  catalog,
  selection,
  onSelectionChange,
  preference,
}: {
  catalog: V2Catalog;
  selection: V2Selection;
  onSelectionChange: (next: V2Selection) => void;
  preference: { translationLanguage: string | null; transliterationScript: string | null };
}) {
  const theme = useTheme();
  const downloads = useV2Downloads();
  const options = useMemo(() => listAdoptionOptions(catalog), [catalog]);
  const current = findAdoptionOption(catalog, selection.adoptionId);
  const chapters = useMemo(() => chaptersForAdoption(catalog, selection), [catalog, selection]);
  const notYetDownloaded = chapters.filter((c) => {
    const identity = catalogChapterIdentity(c);
    return !downloads.isDownloaded(identity) && !downloads.isPending(identity);
  });
  const [batchDownloading, setBatchDownloading] = useState(false);

  const downloadAll = async () => {
    setBatchDownloading(true);
    try {
      await Promise.all(notYetDownloaded.map((c) => downloads.download(catalogChapterIdentity(c))));
    } finally {
      setBatchDownloading(false);
    }
  };

  return (
    <>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        LEARNER CONTEXT
      </ThemedText>
      {options.map((option, i) => {
        const active = option.adoption.id === selection.adoptionId;
        return (
          <Touchable
            key={option.adoption.id}
            onPress={() => onSelectionChange(selectionFromAdoption(option.adoption))}
            style={[
              styles.optionRow,
              i < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
            ]}
          >
            <View style={styles.f1}>
              <ThemedText type={active ? 'smallBold' : 'default'} themeColor={active ? 'tint' : undefined}>
                {option.displayLabel}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.mt5}>
                {`${option.bookTitle} · ${option.chapterCount} chapters`}
              </ThemedText>
            </View>
            <MaterialCommunityIcons
              name={active ? 'check-circle' : 'circle-outline'}
              size={20}
              color={active ? theme.tint : theme.textDisabled}
            />
          </Touchable>
        );
      })}

      {current && (
        <ThemedText type="small" themeColor="textSecondary" style={[styles.sectionLabel, styles.mtSection]}>
          {`${current.editionLabel} · ${chapters.length} CHAPTERS`}
        </ThemedText>
      )}

      <View style={styles.sectionHeaderRow}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          SHARED BOOK
        </ThemedText>
        {notYetDownloaded.length > 0 && (
          <Touchable onPress={downloadAll} disabled={batchDownloading} hitSlop={6}>
            <ThemedText type="smallBold" themeColor="tint">
              Download all
            </ThemedText>
          </Touchable>
        )}
      </View>

      <View style={styles.relative}>
        {chapters.map((chapter, i) => (
          <V2ChapterRow
            key={`${chapter.bookId}/${chapter.editionId}/${chapter.chapterId}`}
            chapter={chapter}
            preference={preference}
            downloads={downloads}
            showDivider={i < chapters.length - 1}
          />
        ))}
        {batchDownloading && <LoadingOverlay message="Downloading chapters…" />}
      </View>
    </>
  );
}

function V2ChapterRow({
  chapter,
  preference,
  downloads,
  showDivider,
}: {
  chapter: V2CatalogChapter;
  preference: { translationLanguage: string | null; transliterationScript: string | null };
  downloads: ReturnType<typeof useV2Downloads>;
  showDivider: boolean;
}) {
  const theme = useTheme();
  const identity = catalogChapterIdentity(chapter);
  const downloaded = downloads.isDownloaded(identity);
  const pending = downloads.isPending(identity);
  const titleTranslation = preference.translationLanguage
    ? chapter.titleTranslations?.[preference.translationLanguage]
    : undefined;
  const titleTransliteration = preference.transliterationScript
    ? chapter.titleTransliterations?.[preference.transliterationScript]
    : undefined;

  return (
    <Touchable
      onPress={() =>
        router.push({
          pathname: '/reader',
          params: {
            bookId: identity.bookId,
            editionId: identity.editionId,
            chapterId: identity.chapterId,
          },
        })
      }
      style={[styles.chapterRow, showDivider && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
    >
      <View style={styles.chapterRowInner}>
        <View style={[styles.chapterIcon, { backgroundColor: downloaded ? theme.tintMuted : theme.backgroundElement }]}>
          <MaterialCommunityIcons name="book-open-page-variant" size={22} color={downloaded ? theme.tint : theme.textDisabled} />
        </View>
        <View style={styles.f1}>
          <ThemedText type="default">{chapter.title}</ThemedText>
          {titleTransliteration && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.mt5}>
              {titleTransliteration}
            </ThemedText>
          )}
          {titleTranslation && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.mt5}>
              {titleTranslation}
            </ThemedText>
          )}
        </View>
        <View style={styles.chapterActions}>
          {pending ? (
            <ActivityIndicator size="small" color={theme.tint} />
          ) : (
            <Touchable onPress={() => (downloaded ? downloads.remove(identity) : downloads.download(identity))} hitSlop={8}>
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
    </Touchable>
  );
}

function ExploreContent({ catalog }: { catalog: Catalog }) {
  const theme = useTheme();
  const [manualSelected, setManualSelected] = useState<LevelValue[]>([]);
  const [pinnedLevel, setPinnedLevel] = useState<number | null>(null);
  const autoResolved = useMemo(() => autoResolve(catalog.chapters, manualSelected), [catalog, manualSelected]);
  const resolved = pinnedLevel !== null ? autoResolved.slice(0, pinnedLevel) : autoResolved;
  const atChapterList = resolved.length === LEVEL_KEYS.length;
  const chaptersInScope = useMemo(() => filterChapters(catalog.chapters, resolved), [catalog, resolved]);

  const { scope, isSaved, setScope } = useScope(catalog);
  const { preference } = useReadingPreference(catalog);
  const candidateScope: Scope | null =
    resolved.length >= 4
      ? { board: resolved[0] as string, state: resolved[1] as string, medium: resolved[2] as string, grade: resolved[3] as number }
      : null;
  const candidateIsCurrent = isSaved && scopesEqual(scope, candidateScope);

  const downloads = useDownloads();
  const notYetDownloaded = chaptersInScope.filter((c) => !downloads.isDownloaded(c.slug) && !downloads.isPending(c.slug));
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
            const titleTranslation = preference.translationLanguage
              ? chapter.titleTranslations?.[preference.translationLanguage]
              : undefined;
            const titleTransliteration = preference.transliterationScript
              ? chapter.titleTransliterations?.[preference.transliterationScript]
              : undefined;
            const row = (
              <View style={styles.chapterRowInner}>
                <View style={[styles.chapterIcon, { backgroundColor: downloaded ? theme.tintMuted : theme.backgroundElement }]}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={22} color={downloaded ? theme.tint : theme.textDisabled} />
                </View>
                <View style={styles.f1}>
                  <ThemedText type="default">{chapter.title}</ThemedText>
                  {titleTransliteration && (
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.mt5}
                      accessibilityLabel={`${labelForScript(preference.transliterationScript!)} transliteration: ${titleTransliteration}`}
                    >
                      {titleTransliteration}
                    </ThemedText>
                  )}
                  {titleTranslation && (
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.mt5}
                      accessibilityLabel={`${labelForLanguage(preference.translationLanguage!)} translation: ${titleTranslation}`}
                    >
                      {titleTranslation}
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
  mtSection: { marginTop: Spacing.four },
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
  f1: { flex: 1 },
  mt5: { marginTop: 5 },
});
