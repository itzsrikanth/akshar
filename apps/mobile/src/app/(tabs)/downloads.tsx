import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { FadeInView } from '@/components/fade-in';
import { DownloadsSkeleton } from '@/components/skeletons/downloads-skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useDownloads } from '@/hooks/use-downloads';
import { useReadingHistoryMap } from '@/hooks/use-reading-history';
import { useTheme } from '@/hooks/use-theme';
import { useV2Catalog } from '@/hooks/use-v2-catalog';
import { useV2Downloads } from '@/hooks/use-v2-downloads';
import { useV2ReadingHistoryMap } from '@/hooks/use-v2-reading-history';
import { useV2Selection } from '@/hooks/use-v2-selection';
import type { Catalog, CatalogChapter } from '@/services/content-repository';
import { canonicalChapterPath } from '@/services/catalog-compatibility';
import { formatRelativeTime } from '@/services/reading-history';
import {
  type V2Catalog,
  type V2CatalogChapter,
  type V2Selection,
  canonicalChapterKey,
  catalogChapterIdentity,
  chaptersForAdoption,
} from '@/services/v2';

export default function DownloadsScreen() {
  const v1State = useCatalog();
  const v2State = useV2Catalog();
  const { selection, loaded } = useV2Selection();
  const useV2 = loaded && selection !== null && v2State.status === 'ready';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Downloads</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Chapters saved on this device for offline reading
          </ThemedText>

          {!loaded || (useV2 ? false : v1State.status === 'loading') || (selection && v2State.status === 'loading') ? (
            <DownloadsSkeleton />
          ) : useV2 && v2State.status === 'ready' && selection ? (
            <FadeInView>
              <DownloadsV2Content catalog={v2State.catalog} selection={selection} />
            </FadeInView>
          ) : v1State.status === 'error' ? (
            <AsyncStateView state={v1State} />
          ) : v1State.status === 'ready' ? (
            <FadeInView>
              <DownloadsContent catalog={v1State.catalog} />
            </FadeInView>
          ) : (
            <DownloadsSkeleton />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function EmptyDownloads() {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundElement }]}>
        <MaterialCommunityIcons name="download-outline" size={28} color={theme.textDisabled} />
      </View>
      <ThemedText type="default" style={styles.emptyTitle}>
        Nothing downloaded yet
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.emptyBody}>
        Browse Explore and tap the download icon on a chapter. It will show up here for offline reading.
      </ThemedText>
      <Touchable
        onPress={() => router.push('/explore')}
        style={[styles.emptyCta, { backgroundColor: theme.tint }]}
      >
        <ThemedText type="smallBold" themeColor="onTint">
          Go to Explore
        </ThemedText>
      </Touchable>
    </View>
  );
}

function DownloadsV2Content({ catalog, selection }: { catalog: V2Catalog; selection: V2Selection }) {
  const downloads = useV2Downloads();
  const history = useV2ReadingHistoryMap();
  const chapters = useMemo(() => chaptersForAdoption(catalog, selection), [catalog, selection]);
  const downloaded = useMemo(
    () => chapters.filter((c) => downloads.isDownloaded(catalogChapterIdentity(c))),
    [chapters, downloads.downloadedKeys],
  );

  if (downloaded.length === 0) return <EmptyDownloads />;

  return (
    <>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        {`ON THIS DEVICE · ${downloaded.length}`}
      </ThemedText>
      {downloaded.map((chapter, i) => (
        <V2Row
          key={canonicalChapterKey(catalogChapterIdentity(chapter))}
          chapter={chapter}
          showDivider={i < downloaded.length - 1}
          downloads={downloads}
          openedAt={history.get(canonicalChapterKey(catalogChapterIdentity(chapter)))?.openedAt}
        />
      ))}
    </>
  );
}

function DownloadsContent({ catalog }: { catalog: Catalog }) {
  const downloads = useDownloads();
  const history = useReadingHistoryMap();
  const downloaded = useMemo(
    () => catalog.chapters.filter((c) => downloads.isDownloaded(c.slug)),
    [catalog, downloads.downloadedSlugs],
  );

  if (downloaded.length === 0) return <EmptyDownloads />;

  return (
    <>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        {`ON THIS DEVICE · ${downloaded.length}`}
      </ThemedText>
      {downloaded.map((chapter, i) => (
        <V1Row
          key={chapter.slug}
          chapter={chapter}
          showDivider={i < downloaded.length - 1}
          downloads={downloads}
          openedAt={history.get(canonicalChapterPath(chapter.path))?.openedAt}
        />
      ))}
    </>
  );
}

function V1Row({
  chapter,
  showDivider,
  downloads,
  openedAt,
}: {
  chapter: CatalogChapter;
  showDivider: boolean;
  downloads: ReturnType<typeof useDownloads>;
  openedAt?: string;
}) {
  const theme = useTheme();
  return (
    <Touchable
      onPress={() => router.push({ pathname: '/reader', params: { path: chapter.path } })}
      style={[styles.row, showDivider && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
    >
      <View style={[styles.icon, { backgroundColor: theme.tintMuted }]}>
        <MaterialCommunityIcons name="book-open-page-variant" size={22} color={theme.tint} />
      </View>
      <View style={styles.f1}>
        <ThemedText type="default">{chapter.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.mt5}>
          {openedAt ? `Opened ${formatRelativeTime(openedAt)}` : 'Not opened yet'}
        </ThemedText>
      </View>
      <Touchable onPress={() => downloads.remove(chapter.slug)} hitSlop={8}>
        <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
      </Touchable>
    </Touchable>
  );
}

function V2Row({
  chapter,
  showDivider,
  downloads,
  openedAt,
}: {
  chapter: V2CatalogChapter;
  showDivider: boolean;
  downloads: ReturnType<typeof useV2Downloads>;
  openedAt?: string;
}) {
  const theme = useTheme();
  const identity = catalogChapterIdentity(chapter);
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
      style={[styles.row, showDivider && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
    >
      <View style={[styles.icon, { backgroundColor: theme.tintMuted }]}>
        <MaterialCommunityIcons name="book-open-page-variant" size={22} color={theme.tint} />
      </View>
      <View style={styles.f1}>
        <ThemedText type="default">{chapter.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.mt5}>
          {openedAt ? `Opened ${formatRelativeTime(openedAt)}` : 'Not opened yet'}
        </ThemedText>
      </View>
      <Touchable onPress={() => downloads.remove(identity)} hitSlop={8}>
        <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
      </Touchable>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  subtitle: { marginTop: 4, marginBottom: Spacing.four },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  icon: { width: 44, height: 44, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  f1: { flex: 1 },
  mt5: { marginTop: 5 },
  empty: { alignItems: 'center', paddingTop: Spacing.six, paddingHorizontal: Spacing.two },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  emptyTitle: { textAlign: 'center', marginBottom: Spacing.one },
  emptyBody: { textAlign: 'center', marginBottom: Spacing.four },
  emptyCta: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
  },
});
