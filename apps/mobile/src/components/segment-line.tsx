import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { SelectableSourceText } from '@/components/selectable-source-text';
import { SuggestFixSheet } from '@/components/suggest-fix-sheet';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/touchable';
import { useTheme } from '@/hooks/use-theme';
import type { ChapterVocabPair, LexiconBundle } from '@/services/lexicon';
import {
  canPlayPronunciation,
  getPlayingSegmentId,
  playPronunciation,
  subscribeToPronunciationPlayback,
} from '@/services/pronunciation-audio';
import type { SuggestFixContext } from '@/services/suggest-fix';
import type { ChapterIdentity } from '@/services/v2/identity';

/**
 * One source/transliteration/translation line. Source text supports word
 * selection + Meaning when lexicon props are provided. Read-aloud is enabled
 * in sample mode for speakable types that already have a translation.
 * Suggest-a-fix attaches to this line (flag / long-press), not chapter edit mode.
 */
export function SegmentLine({
  segmentId,
  segmentType,
  source,
  transliteration,
  translation,
  speaker,
  chapterIdentity,
  lexicon,
  chapterVocab,
  preferredLanguage,
  enableWordSelection = false,
  suggestContext,
}: {
  segmentId?: string;
  segmentType?: string;
  source: string;
  transliteration?: string;
  translation?: string;
  /** Character name for a dialogue segment (schema's `speaker` field) — shown above the line. */
  speaker?: string;
  /** When set, playback resolves local audio-v1 cache / chapter media manifest first. */
  chapterIdentity?: ChapterIdentity | null;
  lexicon?: LexiconBundle | null;
  chapterVocab?: ChapterVocabPair[];
  preferredLanguage?: string | null;
  enableWordSelection?: boolean;
  /** When set, show Suggest a fix for this segment (Stage 1 → GitHub issue). */
  suggestContext?: Omit<SuggestFixContext, 'sourceText' | 'translationText' | 'transliterationText'> | null;
}) {
  const theme = useTheme();
  const playable = !!segmentId && canPlayPronunciation(segmentType, translation);
  const [playingId, setPlayingId] = useState(getPlayingSegmentId);
  const [busy, setBusy] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const isPlaying = playable && playingId === segmentId;

  useEffect(() => subscribeToPronunciationPlayback(() => setPlayingId(getPlayingSegmentId())), []);

  const resolvedSuggestContext = useMemo((): SuggestFixContext | null => {
    if (!suggestContext || !segmentId) return null;
    return {
      ...suggestContext,
      segmentId,
      sourceText: source,
      translationText: translation,
      transliterationText: transliteration,
    };
  }, [suggestContext, segmentId, source, translation, transliteration]);

  const onPlay = () => {
    if (!segmentId || !playable) return;
    // Do not gate on local `busy` — another line's tap must cut this one off
    // immediately (handled inside playPronunciation via playGeneration).
    setBusy(true);
    void playPronunciation(segmentId, chapterIdentity).finally(() => setBusy(false));
  };

  return (
    <View style={styles.row}>
      <View style={styles.f1}>
        {speaker && (
          <ThemedText type="smallBold" themeColor="tint" style={styles.speaker}>
            {speaker}
          </ThemedText>
        )}
        {enableWordSelection ? (
          <SelectableSourceText
            source={source}
            lexicon={lexicon ?? null}
            chapterVocab={chapterVocab ?? []}
            preferredLanguage={preferredLanguage ?? null}
            suggestContext={resolvedSuggestContext}
          />
        ) : (
          <ThemedText type="reading" scalable>
            {source}
          </ThemedText>
        )}
        {transliteration ? (
          <ThemedText
            type="small"
            scalable
            themeColor="textSecondary"
            style={styles.mt2}
            onLongPress={resolvedSuggestContext ? () => setSuggestOpen(true) : undefined}
          >
            {transliteration}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
            Transliteration not yet available
          </ThemedText>
        )}
        {translation ? (
          <ThemedText
            type="small"
            scalable
            style={styles.mt2}
            onLongPress={resolvedSuggestContext ? () => setSuggestOpen(true) : undefined}
          >
            {translation}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
            Translation not yet available
          </ThemedText>
        )}
      </View>
      <View style={styles.actions}>
        {resolvedSuggestContext ? (
          <Touchable
            accessibilityRole="button"
            accessibilityLabel="Suggest a fix for this line"
            onPress={() => setSuggestOpen(true)}
            style={styles.iconHit}
          >
            <MaterialCommunityIcons name="flag-outline" size={18} color={theme.textSecondary} />
          </Touchable>
        ) : null}
        {playable ? (
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Playing pronunciation' : 'Play pronunciation'}
            onPress={onPlay}
            style={styles.iconHit}
          >
            {busy ? (
              <ActivityIndicator size="small" color={theme.tint} />
            ) : (
              <MaterialCommunityIcons
                name="volume-high"
                size={18}
                color={isPlaying ? theme.tint : theme.text}
              />
            )}
          </Touchable>
        ) : (
          <MaterialCommunityIcons name="volume-high" size={18} color={theme.textDisabled} style={styles.icon} />
        )}
      </View>
      <SuggestFixSheet
        visible={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        context={resolvedSuggestContext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  f1: { flex: 1 },
  speaker: { marginBottom: 2 },
  actions: { alignItems: 'center', gap: 2 },
  icon: { marginTop: 4 },
  iconHit: { marginTop: 2, padding: 4 },
  mt2: { marginTop: 2 },
});
