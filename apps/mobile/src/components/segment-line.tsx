import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/**
 * One source/transliteration/translation line, used anywhere the Reader or
 * Exercises screens show a single piece of content (intro prose, poem
 * lines, exercise passages). Read-aloud icon is rendered dimmed and
 * non-interactive — audio generation/caching (docs/roadmap.md) isn't built
 * yet, so a tinted, tappable-looking icon would promise a feature that
 * doesn't work. Falls back to an explicit "not yet available" line rather
 * than a blank gap when a chapter has partial coverage (see
 * docs/product-brief.md #5).
 */
export function SegmentLine({
  source,
  transliteration,
  translation,
  speaker,
}: {
  source: string;
  transliteration?: string;
  translation?: string;
  /** Character name for a dialogue segment (schema's `speaker` field) — shown above the line. */
  speaker?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.f1}>
        {speaker && (
          <ThemedText type="smallBold" themeColor="tint" style={styles.speaker}>
            {speaker}
          </ThemedText>
        )}
        <ThemedText type="reading">{source}</ThemedText>
        {transliteration ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.mt2}>
            {transliteration}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
            Transliteration not yet available
          </ThemedText>
        )}
        {translation ? (
          <ThemedText type="small" style={styles.mt2}>
            {translation}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
            Translation not yet available
          </ThemedText>
        )}
      </View>
      <MaterialCommunityIcons name="volume-high" size={18} color={theme.textDisabled} style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  f1: { flex: 1 },
  speaker: { marginBottom: 2 },
  icon: { marginTop: 4 },
  mt2: { marginTop: 2 },
});
