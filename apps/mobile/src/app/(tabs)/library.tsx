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

// "Segments read" has no backing data yet — no ProgressRepository (see
// docs/tech-implementation.md) — so it stays a fixed placeholder even
// though which chapters are "downloaded" and their titles now come from
// the real catalog fetch.
const PLACEHOLDER_PROGRESS = { segmentsRead: 5, segmentsTotal: 12 };

export default function LibraryScreen() {
  const state = useCatalog();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Library</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Chapters you've downloaded for offline reading
          </ThemedText>

          {state.status !== 'ready' ? <AsyncStateView state={state} /> : <LibraryContent catalog={state.catalog} />}

          <Pressable onPress={() => router.push('/explore')} style={styles.browseLink}>
            <ThemedText type="smallBold" themeColor="tint">
              Browse full catalog →
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function LibraryContent({ catalog }: { catalog: Catalog }) {
  const theme = useTheme();
  const downloaded = useMemo(
    () => catalog.chapters.filter((c) => DOWNLOADED_SLUGS.includes(c.slug)),
    [catalog],
  );

  return (
    <>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        {`DOWNLOADED · ${downloaded.length}`}
      </ThemedText>
      {downloaded.map((chapter, i) => (
        <Pressable
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
              {`${PLACEHOLDER_PROGRESS.segmentsRead} of ${PLACEHOLDER_PROGRESS.segmentsTotal} segments read`}
            </ThemedText>
          </View>
          <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
        </Pressable>
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
