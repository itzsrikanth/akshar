import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AsyncStateView } from '@/components/async-state-view';
import { EXERCISE_TYPES } from '@/components/exercises/registry';
import { FadeInView } from '@/components/fade-in';
import { FontSizeStepper } from '@/components/font-size-stepper';
import { SegmentLine } from '@/components/segment-line';
import { ReaderSkeleton } from '@/components/skeletons/reader-skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { DEFAULT_CHAPTER_PATH } from '@/constants/content';
import { Radius, Spacing } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useChapter } from '@/hooks/use-chapter';
import { useDownloads } from '@/hooks/use-downloads';
import { useLexicon } from '@/hooks/use-lexicon';
import { useReadingPreference } from '@/hooks/use-reading-preference';
import { useTheme } from '@/hooks/use-theme';
import { useV2Chapter } from '@/hooks/use-v2-chapter';
import { useV2Downloads } from '@/hooks/use-v2-downloads';
import type { Catalog, Chapter, ChapterSegment } from '@/services/content-repository';
import type { ChapterVocabPair } from '@/services/lexicon';
import { recordChapterOpened } from '@/services/reading-history';
import {
  type ChapterIdentity,
  type V2Chapter,
  recordV2ChapterOpened,
} from '@/services/v2';

function v2ChapterAsReaderChapter(chapter: V2Chapter): Chapter {
  const meta = chapter.meta as Chapter['meta'];
  return {
    schemaVersion: chapter.schemaVersion,
    meta: {
      board: String(meta.board ?? ''),
      state: String(meta.state ?? ''),
      medium: String(meta.medium ?? ''),
      grade: Number(meta.grade ?? chapter.identity.number),
      subject: String(meta.subject ?? ''),
      chapter: Number(meta.chapter ?? chapter.identity.number),
      slug: String(meta.slug ?? chapter.identity.chapterId),
      title: String(meta.title ?? chapter.identity.chapterId),
      source_url: String(meta.source_url ?? ''),
      license: String(meta.license ?? ''),
      original_publisher: String(meta.original_publisher ?? ''),
    },
    labels: chapter.labels,
    segments: chapter.segments,
  };
}

function deriveChapterVocab(
  chapter: Chapter,
  translationLanguage: string | null,
  transliterationScript: string | null,
): ChapterVocabPair[] {
  const defs = new Map(
    chapter.segments.filter((s) => s.type === 'vocabulary_definition').map((s) => [s.ref, s]),
  );
  const pairs: ChapterVocabPair[] = [];
  for (const term of chapter.segments.filter((s) => s.type === 'vocabulary_term')) {
    const definition = defs.get(term.id);
    if (!definition?.text) continue;
    const glosses: Record<string, string> = { kn: definition.text };
    if (translationLanguage && definition.translations?.[translationLanguage]) {
      glosses[translationLanguage] = definition.translations[translationLanguage];
    }
    for (const [lang, text] of Object.entries(definition.translations ?? {})) {
      if (!glosses[lang]) glosses[lang] = text;
    }
    pairs.push({
      term: term.text,
      definitionKn: definition.text,
      glosses,
      transliteration: transliterationScript ? term.transliterations?.[transliterationScript] : undefined,
    });
  }
  return pairs;
}

function deriveReaderData(chapter: Chapter) {
  const { segments } = chapter;
  const competency = segments.find((s) => s.type === 'competency');

  // Any segment tagged with a `section` (intro, story, ...) gets its own
  // labeled block, in source order — not hardcoded to "Introduction" only.
  // ch01 has just "intro"; ch02 also has a "story" section with dialogue
  // lines. Poem/vocab/notes/exercise segments never carry `section`, so
  // this partition doesn't overlap with those below.
  const sectionKeys = Array.from(new Set(segments.filter((s) => s.section).map((s) => s.section as string)));
  const sections = sectionKeys.map((key) => ({
    key,
    label: chapter.labels?.[key]?.en ?? key.charAt(0).toUpperCase() + key.slice(1),
    segments: segments.filter((s) => s.section === key),
  }));

  const poemLines = segments.filter((s) => s.type === 'poem_line');
  const stanzas = Array.from(new Set(poemLines.map((l) => l.stanza))).sort((a, b) => (a ?? 0) - (b ?? 0));
  const vocabTerms = segments.filter((s) => s.type === 'vocabulary_term');
  const vocabDefs = new Map(segments.filter((s) => s.type === 'vocabulary_definition').map((s) => [s.ref, s]));
  const noteTerms = segments.filter((s) => s.type === 'note_term');
  const noteDefs = new Map(segments.filter((s) => s.type === 'note_definition').map((s) => [s.ref, s]));
  const exerciseLetters = Array.from(new Set(segments.filter((s) => s.exercise).map((s) => s.exercise as string))).sort();
  const breadcrumb = `${chapter.meta.board} · ${chapter.meta.state} · ${chapter.meta.medium} · Grade ${chapter.meta.grade} · ${chapter.meta.subject}`;
  return { competency, sections, poemLines, stanzas, vocabTerms, vocabDefs, noteTerms, noteDefs, exerciseLetters, breadcrumb };
}

function SectionLabel({ children }: { children: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
      {children}
    </ThemedText>
  );
}

function TermPair({
  term,
  definition,
  translationLanguage,
  transliterationScript,
}: {
  term: ChapterSegment;
  definition?: ChapterSegment;
  translationLanguage: string | null;
  transliterationScript: string | null;
}) {
  const theme = useTheme();
  if (!definition) return null;
  const caption = [
    transliterationScript ? term.transliterations?.[transliterationScript] : undefined,
    transliterationScript ? definition.transliterations?.[transliterationScript] : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  const translation = translationLanguage ? definition.translations?.[translationLanguage] : undefined;
  return (
    <View style={styles.termRow}>
      <View style={styles.f1}>
        <View style={styles.termHeadRow}>
          <ThemedText type="default" scalable themeColor="tint">
            {term.text}
          </ThemedText>
          <MaterialCommunityIcons name="arrow-right" size={16} color={theme.textDisabled} />
          <ThemedText type="default" scalable>
            {definition.text}
          </ThemedText>
        </View>
        <ThemedText type="small" scalable themeColor="textSecondary" style={styles.mt2}>
          {caption}
          {translation ? ` — ${translation}` : ''}
        </ThemedText>
      </View>
      <MaterialCommunityIcons name="volume-high" size={18} color={theme.textDisabled} />
    </View>
  );
}

export default function ReaderScreen() {
  const params = useLocalSearchParams<{ path?: string; bookId?: string; editionId?: string; chapterId?: string }>();
  const v2Identity =
    params.bookId && params.editionId && params.chapterId
      ? { bookId: params.bookId, editionId: params.editionId, chapterId: params.chapterId }
      : null;
  const chapterPath = params.path ?? (v2Identity ? null : DEFAULT_CHAPTER_PATH);
  const v1State = useChapter(v2Identity ? null : chapterPath);
  const v2State = useV2Chapter(v2Identity);
  const state = v2Identity
    ? v2State.status === 'ready'
      ? { status: 'ready' as const, chapter: v2ChapterAsReaderChapter(v2State.chapter) }
      : v2State
    : v1State;
  const catalogState = useCatalog();

  useEffect(() => {
    if (state.status !== 'ready') return;
    if (v2Identity) {
      void recordV2ChapterOpened(v2Identity);
    } else if (chapterPath) {
      void recordChapterOpened(chapterPath);
    }
  }, [state.status, chapterPath, v2Identity?.bookId, v2Identity?.editionId, v2Identity?.chapterId]);

  const showCatalogLoading = !v2Identity && catalogState.status === 'loading';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topRow}>
          <Touchable onPress={() => router.back()} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="tint">
              ← Back
            </ThemedText>
          </Touchable>
          {state.status === 'ready' && !v2Identity && chapterPath && (
            <View style={styles.topRowActions}>
              <FontSizeStepper />
              <ReaderMenu chapter={state.chapter} chapterPath={chapterPath} />
            </View>
          )}
          {state.status === 'ready' && v2Identity && (
            <View style={styles.topRowActions}>
              <FontSizeStepper />
              <V2ReaderMenu chapter={state.chapter} identity={v2Identity} />
            </View>
          )}
        </View>

        {state.status === 'loading' || showCatalogLoading ? (
          <ReaderSkeleton />
        ) : state.status === 'error' ? (
          <AsyncStateView state={state} />
        ) : catalogState.status === 'error' && !v2Identity ? (
          <AsyncStateView state={catalogState} />
        ) : state.status === 'ready' ? (
          <FadeInView style={styles.fill}>
            <ReaderContent
              chapter={state.chapter}
              chapterPath={chapterPath ?? ''}
              catalog={
                catalogState.status === 'ready'
                  ? catalogState.catalog
                  : ({ schemaVersion: '1.0', generatedAt: '', chapters: [] } as Catalog)
              }
              breadcrumbOverride={
                v2Identity
                  ? `${v2Identity.bookId} · ${v2Identity.editionId} · ${v2Identity.chapterId}`
                  : undefined
              }
              exerciseParams={
                v2Identity
                  ? {
                      bookId: v2Identity.bookId,
                      editionId: v2Identity.editionId,
                      chapterId: v2Identity.chapterId,
                    }
                  : { path: chapterPath ?? '' }
              }
            />
          </FadeInView>
        ) : (
          <ReaderSkeleton />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

// Replaces the old top-right settings shortcut — app-wide settings has no
// real relation to what's on this screen. This is chapter-scoped instead:
// download-for-offline (hidden once already downloaded) and a shortcut into
// this chapter's exercises (hidden if it doesn't have any).
function ReaderMenu({ chapter, chapterPath }: { chapter: Chapter; chapterPath: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const downloads = useDownloads();
  const [open, setOpen] = useState(false);

  const slug = chapter.meta.slug;
  const downloaded = downloads.isDownloaded(slug);
  const pending = downloads.isPending(slug);
  const hasExercises = chapter.segments.some((s) => s.exercise);

  return (
    <>
      <Touchable
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={[styles.settingsButton, { backgroundColor: theme.tintMuted }]}
      >
        <MaterialCommunityIcons name="dots-vertical" size={20} color={theme.tint} />
      </Touchable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setOpen(false)}>
          <View style={[styles.menuCard, { top: insets.top + 52, borderColor: theme.border, backgroundColor: theme.background }]}>
            {!downloaded && (
              <Touchable
                onPress={() => {
                  downloads.download(chapterPath, slug);
                  setOpen(false);
                }}
                disabled={pending}
                style={[styles.menuItem, hasExercises && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              >
                {pending ? (
                  <ActivityIndicator size="small" color={theme.tint} />
                ) : (
                  <MaterialCommunityIcons name="download" size={18} color={theme.tint} />
                )}
                <ThemedText type="default">Download</ThemedText>
              </Touchable>
            )}
            {hasExercises && (
              <Touchable
                onPress={() => {
                  setOpen(false);
                  router.push({ pathname: '/exercises', params: { path: chapterPath } });
                }}
                style={styles.menuItem}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.tint} />
                <ThemedText type="default">Exercises</ThemedText>
              </Touchable>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function V2ReaderMenu({ chapter, identity }: { chapter: Chapter; identity: ChapterIdentity }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const downloads = useV2Downloads();
  const [open, setOpen] = useState(false);
  const downloaded = downloads.isDownloaded(identity);
  const pending = downloads.isPending(identity);
  const hasExercises = chapter.segments.some((s) => s.exercise);

  return (
    <>
      <Touchable
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={[styles.settingsButton, { backgroundColor: theme.tintMuted }]}
      >
        <MaterialCommunityIcons name="dots-vertical" size={20} color={theme.tint} />
      </Touchable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setOpen(false)}>
          <View style={[styles.menuCard, { top: insets.top + 52, borderColor: theme.border, backgroundColor: theme.background }]}>
            {!downloaded && (
              <Touchable
                onPress={() => {
                  void downloads.download(identity);
                  setOpen(false);
                }}
                disabled={pending}
                style={[styles.menuItem, hasExercises && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              >
                {pending ? (
                  <ActivityIndicator size="small" color={theme.tint} />
                ) : (
                  <MaterialCommunityIcons name="download" size={18} color={theme.tint} />
                )}
                <ThemedText type="default">Download</ThemedText>
              </Touchable>
            )}
            {hasExercises && (
              <Touchable
                onPress={() => {
                  setOpen(false);
                  router.push({
                    pathname: '/exercises',
                    params: {
                      bookId: identity.bookId,
                      editionId: identity.editionId,
                      chapterId: identity.chapterId,
                    },
                  });
                }}
                style={styles.menuItem}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.tint} />
                <ThemedText type="default">Exercises</ThemedText>
              </Touchable>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function ReaderContent({
  chapter,
  chapterPath,
  catalog,
  breadcrumbOverride,
  exerciseParams,
}: {
  chapter: Chapter;
  chapterPath: string;
  catalog: Catalog;
  breadcrumbOverride?: string;
  exerciseParams: Record<string, string>;
}) {
  const theme = useTheme();
  const data = useMemo(() => deriveReaderData(chapter), [chapter]);
  const { preference } = useReadingPreference(catalog);
  const { translationLanguage, transliterationScript } = preference;
  const lexicon = useLexicon('kn');
  const chapterVocab = useMemo(
    () => deriveChapterVocab(chapter, translationLanguage, transliterationScript),
    [chapter, translationLanguage, transliterationScript],
  );
  const translationFor = (seg: ChapterSegment) => (translationLanguage ? seg.translations?.[translationLanguage] : undefined);
  const transliterationFor = (seg: ChapterSegment) =>
    transliterationScript ? seg.transliterations?.[transliterationScript] : undefined;

  const lineProps = {
    enableWordSelection: true as const,
    lexicon,
    chapterVocab,
    preferredLanguage: translationLanguage,
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="subtitle">{chapter.meta.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.breadcrumb}>
        {breadcrumbOverride ?? data.breadcrumb}
      </ThemedText>

      {data.competency && (
        <View style={[styles.calloutCard, { backgroundColor: theme.tintMuted }]}>
          <SectionLabel>{chapter.labels?.competency?.en ?? 'Competency'}</SectionLabel>
          <SegmentLine
            segmentId={data.competency.id}
            segmentType={data.competency.type}
            source={data.competency.text}
            transliteration={transliterationFor(data.competency)}
            translation={translationFor(data.competency)}
            {...lineProps}
          />
        </View>
      )}

      {data.sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <SectionLabel>{section.label}</SectionLabel>
          {section.segments.map((seg, i) => (
            <View key={seg.id} style={i > 0 ? styles.mt4 : undefined}>
              <SegmentLine
                segmentId={seg.id}
                segmentType={seg.type}
                source={seg.text}
                transliteration={transliterationFor(seg)}
                translation={translationFor(seg)}
                speaker={seg.speaker}
                {...lineProps}
              />
            </View>
          ))}
        </View>
      ))}

      {data.stanzas.map((stanza) => (
        <View key={stanza} style={styles.section}>
          <SectionLabel>{`${chapter.labels?.poem?.en ?? 'Poem'} — Stanza ${stanza}`}</SectionLabel>
          <View style={[styles.poemCard, { backgroundColor: theme.backgroundElement }]}>
            {data.poemLines
              .filter((l) => l.stanza === stanza)
              .map((line, i, arr) => (
                <View key={line.id} style={i < arr.length - 1 ? styles.poemLineSpacing : undefined}>
                  <SegmentLine
                    segmentId={line.id}
                    segmentType={line.type}
                    source={line.text}
                    transliteration={transliterationFor(line)}
                    translation={translationFor(line)}
                    {...lineProps}
                  />
                </View>
              ))}
          </View>
        </View>
      ))}

      {data.vocabTerms.length > 0 && (
        <View style={styles.section}>
          <SectionLabel>{chapter.labels?.vocab?.en ?? 'Word meanings'}</SectionLabel>
          <View style={[styles.card, { borderColor: theme.border }]}>
            {data.vocabTerms.map((term, i) => (
              <View
                key={term.id}
                style={i < data.vocabTerms.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }}
              >
                <TermPair
                  term={term}
                  definition={data.vocabDefs.get(term.id)}
                  translationLanguage={translationLanguage}
                  transliterationScript={transliterationScript}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {data.noteTerms.length > 0 && (
        <View style={styles.section}>
          <SectionLabel>{chapter.labels?.notes?.en ?? 'Notes'}</SectionLabel>
          <View style={[styles.card, { borderColor: theme.border }]}>
            {data.noteTerms.map((term, i) => (
              <View
                key={term.id}
                style={i < data.noteTerms.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }}
              >
                <TermPair
                  term={term}
                  definition={data.noteDefs.get(term.id)}
                  translationLanguage={translationLanguage}
                  transliterationScript={transliterationScript}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {data.exerciseLetters.length > 0 && (
        <View style={styles.section}>
          <Touchable
            onPress={() => router.push({ pathname: '/exercises', params: exerciseParams })}
            style={[styles.exercisesCard, { backgroundColor: theme.backgroundElement }]}
          >
            <View>
              <ThemedText type="default" themeColor="tint">
                Exercises
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.mt2}>
                {`${EXERCISE_TYPES.length} exercise types`}
              </ThemedText>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={22} color={theme.tint} />
          </Touchable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  fill: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  topRowActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  settingsButton: { width: 32, height: 32, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  menuBackdrop: { flex: 1 },
  menuCard: {
    position: 'absolute',
    right: Spacing.three,
    minWidth: 170,
    borderWidth: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  breadcrumb: { marginTop: 4, marginBottom: Spacing.three },
  section: { marginTop: Spacing.four },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  calloutCard: { borderRadius: Radius.medium, padding: Spacing.three, marginTop: Spacing.three },
  poemCard: { borderRadius: Radius.large, padding: Spacing.three },
  poemLineSpacing: { marginBottom: Spacing.three },
  card: { borderWidth: 1, borderRadius: Radius.medium, overflow: 'hidden' },
  termRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: Spacing.three },
  termHeadRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  exercisesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  f1: { flex: 1 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: Spacing.three },
});
