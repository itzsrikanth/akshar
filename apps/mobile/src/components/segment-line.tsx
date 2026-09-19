import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { SelectableSourceText } from '@/components/selectable-source-text';
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

/**
 * One source/transliteration/translation line. Source text supports word
 * selection + Meaning when lexicon props are provided. Read-aloud is enabled
 * in sample mode for speakable types that already have a translation.
 */
export function SegmentLine({
  segmentId,
  segmentType,
  source,
  transliteration,
  translation,
  speaker,
  lexicon,
  chapterVocab,
  preferredLanguage,
  enableWordSelection = false,
}: {
  segmentId?: string;
  segmentType?: string;
  source: string;
  transliteration?: string;
  translation?: string;
  /** Character name for a dialogue segment (schema's `speaker` field) — shown above the line. */
  speaker?: string;
  lexicon?: LexiconBundle | null;
  chapterVocab?: ChapterVocabPair[];
  preferredLanguage?: string | null;
  enableWordSelection?: boolean;
}) {
  const theme = useTheme();
  const playable = !!segmentId && canPlayPronunciation(segmentType, translation);
  const [playingId, setPlayingId] = useState(getPlayingSegmentId);
  const [busy, setBusy] = useState(false);
  const isPlaying = playable && playingId === segmentId;

  useEffect(() => subscribeToPronunciationPlayback(() => setPlayingId(getPlayingSegmentId())), []);

  const onPlay = () => {
    if (!segmentId || !playable) return;
    // Do not gate on local `busy` — another line's tap must cut this one off
    // immediately (handled inside playPronunciation via playGeneration).
    setBusy(true);
    void playPronunciation(segmentId).finally(() => setBusy(false));
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
          />
        ) : (
          <ThemedText type="reading" scalable>
            {source}
          </ThemedText>
        )}
        {transliteration ? (
          <ThemedText type="small" scalable themeColor="textSecondary" style={styles.mt2}>
            {transliteration}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
            Transliteration not yet available
          </ThemedText>
        )}
        {translation ? (
          <ThemedText type="small" scalable style={styles.mt2}>
            {translation}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
            Translation not yet available
          </ThemedText>
        )}
      </View>
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
              name={isPlaying ? 'volume-high' : 'volume-high'}
              size={18}
              color={isPlaying ? theme.tint : theme.text}
            />
          )}
        </Touchable>
      ) : (
        <MaterialCommunityIcons name="volume-high" size={18} color={theme.textDisabled} style={styles.icon} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  f1: { flex: 1 },
  speaker: { marginBottom: 2 },
  icon: { marginTop: 4 },
  iconHit: { marginTop: 2, padding: 4 },
  mt2: { marginTop: 2 },
});
