import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AsyncStateView } from '@/components/async-state-view';
import { FadeInView } from '@/components/fade-in';
import { HomeSkeleton } from '@/components/skeletons/home-skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useDownloads } from '@/hooks/use-downloads';
import { useScope } from '@/hooks/use-scope';
import { useTheme } from '@/hooks/use-theme';
import type { Catalog } from '@/services/content-repository';

// "Progress" (segmentsRead/segmentsTotal) has no backing data yet — no
// ProgressRepository (docs/tech-implementation.md) — so it stays a fixed
// placeholder even though everything else on this screen now comes from
// the real catalog fetch.
const PLACEHOLDER_PROGRESS = { segmentsRead: 5, segmentsTotal: 12 };

export default function HomeScreen() {
  const state = useCatalog();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Generic placeholder copy for now — "Homework helper" was dropped
            because it reads as a promise of homework-checking (camera + AI,
            a future-roadmap item, not built). Revisit with real tagline
            copy once the core reading flow has been used by someone. */}
        <AppHeader subtitle="Learning app" onSettingsPress={() => router.push('/settings')} />
        {state.status === 'loading' ? (
          <HomeSkeleton />
        ) : state.status === 'error' ? (
          <AsyncStateView state={state} />
        ) : (
          <FadeInView style={styles.fill}>
            <HomeContent catalog={state.catalog} />
          </FadeInView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function HomeContent({ catalog }: { catalog: Catalog }) {
  const theme = useTheme();
  const { scope } = useScope(catalog);
  const downloads = useDownloads();
  const continueReading = catalog.chapters[0];
  const progressPct = Math.round((PLACEHOLDER_PROGRESS.segmentsRead / PLACEHOLDER_PROGRESS.segmentsTotal) * 100);

  const subjects = useMemo(() => {
    const bySubject = new Map<string, { total: number; downloaded: number }>();
    for (const c of catalog.chapters) {
      const entry = bySubject.get(c.subject) ?? { total: 0, downloaded: 0 };
      entry.total += 1;
      if (downloads.isDownloaded(c.slug)) entry.downloaded += 1;
      bySubject.set(c.subject, entry);
    }
    return Array.from(bySubject, ([subject, counts]) => ({ subject, ...counts }));
  }, [catalog, downloads.downloadedSlugs]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {continueReading && (
        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            CONTINUE READING
          </ThemedText>
          <ThemedView type="backgroundElement" style={[styles.card, { borderRadius: Radius.large }]}>
            <ThemedText type="subtitle">{continueReading.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.mt4}>
              {`${continueReading.board} · ${continueReading.state} · Grade ${continueReading.grade} · ${continueReading.subject}`}
            </ThemedText>
            <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: theme.tint }]} />
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.mt6}>
              {PLACEHOLDER_PROGRESS.segmentsRead} of {PLACEHOLDER_PROGRESS.segmentsTotal} segments read
            </ThemedText>
            <Touchable
              onPress={() => router.push('/reader')}
              style={[styles.pillButton, { backgroundColor: theme.tint }]}
            >
              <ThemedText type="smallBold" themeColor="onTint">
                Continue reading
              </ThemedText>
            </Touchable>
          </ThemedView>
        </View>
      )}

      {scope && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              YOUR SCOPE
            </ThemedText>
            <Touchable onPress={() => router.push('/settings')} hitSlop={8}>
              <ThemedText type="smallBold" themeColor="tint">
                Edit
              </ThemedText>
            </Touchable>
          </View>
          <View style={styles.chipsRow}>
            {[scope.board, scope.state, `${scope.medium} medium`, `Grade ${scope.grade}`].map((label) => (
              <View key={label} style={[styles.chip, { borderColor: theme.border }]}>
                <ThemedText type="small">{label}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          SUBJECTS
        </ThemedText>
        {subjects.map((s) => (
          <Touchable
            key={s.subject}
            onPress={() => router.push('/explore')}
            style={[styles.subjectRow, { borderColor: theme.border }]}
          >
            <View style={[styles.subjectIcon, { backgroundColor: theme.tintMuted }]}>
              <MaterialCommunityIcons name="translate" size={22} color={theme.tint} />
            </View>
            <View style={styles.f1}>
              <ThemedText type="default">{s.subject}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.mt2}>
                {`${s.downloaded} chapter${s.downloaded === 1 ? '' : 's'} downloaded · ${s.total} available`}
              </ThemedText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
          </Touchable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  fill: { flex: 1 },
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
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  subjectIcon: { width: 44, height: 44, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  f1: { flex: 1 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
});
