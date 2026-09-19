import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { FadeInView } from '@/components/fade-in';
import { LibrarySkeleton } from '@/components/skeletons/library-skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useDownloads } from '@/hooks/use-downloads';
import { useReadingHistoryMap } from '@/hooks/use-reading-history';
import { useV2ReadingHistoryMap } from '@/hooks/use-v2-reading-history';
import { useTheme } from '@/hooks/use-theme';
import { useV2Catalog } from '@/hooks/use-v2-catalog';
import { useV2Downloads } from '@/hooks/use-v2-downloads';
import { useV2Selection } from '@/hooks/use-v2-selection';
import type { Catalog } from '@/services/content-repository';
import { canonicalChapterPath } from '@/services/catalog-compatibility';
import { formatRelativeTime } from '@/services/reading-history';
import {
  type V2Catalog,
  type V2Selection,
  canonicalChapterKey,
  catalogChapterIdentity,
  chaptersForAdoption,
} from '@/services/v2';

export default function LibraryScreen() {
  const v1State = useCatalog();
  const v2State = useV2Catalog();
  const { selection, loaded } = useV2Selection();
  const useV2 = loaded && selection !== null && v2State.status === 'ready';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Library</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Chapters you've downloaded for offline reading
          </ThemedText>

          {!loaded || (useV2 ? false : v1State.status === 'loading') || (selection && v2State.status === 'loading') ? (
            <LibrarySkeleton />
          ) : useV2 && v2State.status === 'ready' && selection ? (
            <FadeInView>
              <LibraryV2Content catalog={v2State.catalog} selection={selection} />
            </FadeInView>
          ) : v1State.status === 'error' ? (
            <AsyncStateView state={v1State} />
          ) : v1State.status === 'ready' ? (
            <FadeInView>
              <LibraryContent catalog={v1State.catalog} />
            </FadeInView>
          ) : (
            <LibrarySkeleton />
          )}

          <Touchable onPress={() => router.push('/explore')} style={styles.browseLink}>
            <ThemedText type="smallBold" themeColor="tint">
              Browse full catalog →
            </ThemedText>
          </Touchable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function LibraryV2Content({ catalog, selection }: { catalog: V2Catalog; selection: V2Selection }) {
  const theme = useTheme();
  const downloads = useV2Downloads();
  const history = useV2ReadingHistoryMap();
  const chapters = useMemo(() => chaptersForAdoption(catalog, selection), [catalog, selection]);
  const downloaded = useMemo(
    () => chapters.filter((c) => downloads.isDownloaded(catalogChapterIdentity(c))),
    [chapters, downloads.downloadedKeys],
  );

  if (downloaded.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Nothing downloaded yet — browse Explore and tap the download icon on a chapter to read it offline. Chapters are
        shared across learner contexts for the same book edition.
      </ThemedText>
    );
  }

  return (
    <>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        {`DOWNLOADED · ${downloaded.length}`}
      </ThemedText>
      {downloaded.map((chapter, i) => {
        const identity = catalogChapterIdentity(chapter);
        const key = canonicalChapterKey(identity);
        const opened = history.get(key);
        return (
          <Touchable
            key={key}
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
            style={[styles.row, i < downloaded.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
          >
            <View style={[styles.icon, { backgroundColor: theme.tintMuted }]}>
              <MaterialCommunityIcons name="book-open-page-variant" size={22} color={theme.tint} />
            </View>
            <View style={styles.f1}>
              <ThemedText type="default">{chapter.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.mt5}>
                {opened ? `Opened ${formatRelativeTime(opened.openedAt)}` : 'Not opened yet'}
              </ThemedText>
            </View>
            <Touchable onPress={() => downloads.remove(identity)} hitSlop={8}>
              <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
            </Touchable>
          </Touchable>
        );
      })}
    </>
  );
}

function LibraryContent({ catalog }: { catalog: Catalog }) {
  const theme = useTheme();
  const downloads = useDownloads();
  const history = useReadingHistoryMap();
  const downloaded = useMemo(
    () => catalog.chapters.filter((c) => downloads.isDownloaded(c.slug)),
    [catalog, downloads.downloadedSlugs],
  );

  if (downloaded.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Nothing downloaded yet — browse the full catalog below and tap the download icon on a chapter to read it offline.
      </ThemedText>
    );
  }

  return (
    <>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        {`DOWNLOADED · ${downloaded.length}`}
      </ThemedText>
      {downloaded.map((chapter, i) => (
        <Touchable
          key={chapter.slug}
          onPress={() => router.push({ pathname: '/reader', params: { path: chapter.path } })}
          style={[styles.row, i < downloaded.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
        >
          <View style={[styles.icon, { backgroundColor: theme.tintMuted }]}>
            <MaterialCommunityIcons name="book-open-page-variant" size={22} color={theme.tint} />
          </View>
          <View style={styles.f1}>
            <ThemedText type="default">{chapter.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.mt5}>
              {history.has(canonicalChapterPath(chapter.path))
                ? `Opened ${formatRelativeTime(history.get(canonicalChapterPath(chapter.path))!.openedAt)}`
                : 'Not opened yet'}
            </ThemedText>
          </View>
          <Touchable onPress={() => downloads.remove(chapter.slug)} hitSlop={8}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
          </Touchable>
        </Touchable>
      ))}
    </>
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
  browseLink: { alignItems: 'center', marginTop: Spacing.four },
  f1: { flex: 1 },
  mt5: { marginTop: 5 },
});
