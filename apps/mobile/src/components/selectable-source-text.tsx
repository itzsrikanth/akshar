import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useFontScale } from '@/hooks/use-font-scale';
import { useTheme } from '@/hooks/use-theme';
import {
  resolveMeanings,
  tokenizeSource,
  type ChapterVocabPair,
  type LexiconBundle,
  type MeaningResult,
  type SourceToken,
} from '@/services/lexicon';

/** Compact floating chrome — tinted surface + border so it doesn’t melt into reading text. */
const floatingChrome = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
  default: {},
});

const sheetChrome = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  android: { elevation: 8 },
  default: {},
});

type SelectionRange = { start: number; end: number };

function selectedWordForms(tokens: SourceToken[], range: SelectionRange): string[] {
  const forms: string[] = [];
  for (let i = range.start; i <= range.end; i += 1) {
    const token = tokens[i];
    if (token?.selectable) forms.push(token.text);
  }
  return forms;
}

function MeaningRows({ results }: { results: MeaningResult[] }) {
  const theme = useTheme();
  return (
    <View style={styles.rows}>
      {results.map((result, index) => (
        <View
          key={`${result.selectedForm}-${index}`}
          style={[
            styles.meaningCard,
            floatingChrome,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
            index > 0 && styles.meaningCardGap,
          ]}
        >
          <View style={[styles.meaningAccent, { backgroundColor: theme.tint }]} />
          <View style={styles.meaningBody}>
            {result.kind === 'function' ? (
              <>
                <View style={styles.formRow}>
                  <MaterialCommunityIcons name="link-variant" size={16} color={theme.textSecondary} />
                  <ThemedText type="smallBold" scalable>
                    {result.selectedForm}
                  </ThemedText>
                </View>
                <View style={[styles.glossWell, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Connecting word — no dictionary gloss
                  </ThemedText>
                </View>
              </>
            ) : result.kind === 'unavailable' ? (
              <>
                <View style={styles.formRow}>
                  <MaterialCommunityIcons name="book-search-outline" size={16} color={theme.textSecondary} />
                  <ThemedText type="smallBold" scalable>
                    {result.selectedForm}
                  </ThemedText>
                </View>
                <View style={[styles.glossWell, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Root/meaning not available
                  </ThemedText>
                </View>
              </>
            ) : (
              <>
                <View style={styles.formRow}>
                  <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color={theme.tint} />
                  <ThemedText type="smallBold" scalable themeColor="tint">
                    {result.selectedForm}
                    {result.lemma && result.lemma !== result.selectedForm ? ` → ${result.lemma}` : ''}
                  </ThemedText>
                </View>
                {result.transliteration ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.mt2}>
                    {result.transliteration}
                  </ThemedText>
                ) : null}
                <View style={[styles.glossWell, { backgroundColor: theme.tintMuted, borderColor: theme.border }]}>
                  <ThemedText type="small" scalable>
                    {result.gloss ?? 'Root/meaning not available'}
                  </ThemedText>
                </View>
                {result.ambiguous ? (
                  <ThemedText type="small" themeColor="warning" style={styles.mt2}>
                    Ambiguous mapping — more than one reviewed root
                  </ThemedText>
                ) : null}
                {result.notes ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.mt2}>
                    {result.notes}
                  </ThemedText>
                ) : null}
              </>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Grapheme-safe selectable source text with a Meaning action bar and sheet.
 * Stock RN Text selection cannot host a custom toolbar; tokens are tappable instead.
 */
export function SelectableSourceText({
  source,
  lexicon,
  chapterVocab,
  preferredLanguage,
}: {
  source: string;
  lexicon: LexiconBundle | null;
  chapterVocab: ChapterVocabPair[];
  preferredLanguage: string | null;
}) {
  const theme = useTheme();
  const { scale } = useFontScale();
  const insets = useSafeAreaInsets();
  const tokens = useMemo(() => tokenizeSource(source), [source]);
  const [range, setRange] = useState<SelectionRange | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // One tap selects that word; tap again to clear. A second different word
  // replaces the selection — do not expand a range between taps (that felt
  // like a stuck first-word meaning when the sheet was reopened).
  const onTokenPress = useCallback((token: SourceToken) => {
    if (!token.selectable) return;
    setRange((prev) => {
      if (prev && prev.start === token.index && prev.end === token.index) return null;
      return { start: token.index, end: token.index };
    });
    setSheetOpen(false);
  }, []);

  const clearSelection = useCallback(() => {
    setRange(null);
    setSheetOpen(false);
  }, []);

  const results = useMemo(() => {
    if (!range) return [];
    return resolveMeanings(selectedWordForms(tokens, range), lexicon, chapterVocab, preferredLanguage);
  }, [range, tokens, lexicon, chapterVocab, preferredLanguage]);

  const contentOnly = results.filter((r) => r.kind !== 'function');
  const meaningDisabled = results.length > 0 && contentOnly.length === 0;
  const readingSize = {
    fontSize: Typography.reading.fontSize * scale,
    lineHeight: Typography.reading.lineHeight * scale,
  };

  return (
    <View>
      <Text style={[{ color: theme.text }, readingSize]}>
        {tokens.map((token) => {
          const selected =
            range != null && token.index >= range.start && token.index <= range.end && token.selectable;
          if (!token.selectable) {
            return (
              <Text key={token.index} style={readingSize}>
                {token.text}
              </Text>
            );
          }
          return (
            <Text
              key={token.index}
              onPress={() => onTokenPress(token)}
              style={[readingSize, selected ? { backgroundColor: theme.tintMuted, borderRadius: 2 } : null]}
              accessibilityRole="button"
              accessibilityLabel={`Select word ${token.text}`}
            >
              {token.text}
            </Text>
          );
        })}
      </Text>

      {range ? (
        <View
          style={[
            styles.actionBar,
            floatingChrome,
            {
              backgroundColor: theme.tintMuted,
              borderColor: theme.border,
            },
          ]}
        >
          <Touchable
            accessibilityRole="button"
            accessibilityLabel="Show meaning"
            disabled={meaningDisabled}
            onPress={() => setSheetOpen(true)}
            style={[styles.actionBtn, meaningDisabled && { opacity: 0.4 }]}
          >
            <ThemedText type="smallBold" themeColor={meaningDisabled ? 'textDisabled' : 'tint'}>
              Meaning
            </ThemedText>
          </Touchable>
          <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />
          <Touchable
            accessibilityRole="button"
            accessibilityLabel="Clear selection"
            onPress={clearSelection}
            style={styles.actionBtn}
          >
            <ThemedText type="small" themeColor="textSecondary">
              Clear
            </ThemedText>
          </Touchable>
        </View>
      ) : null}

      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              sheetChrome,
              {
                // Distinct from the reader page (theme.background) so the panel
                // does not read as more chapter text.
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, Spacing.three),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Touchable
              accessibilityRole="button"
              accessibilityLabel="Collapse meanings"
              onPress={() => setSheetOpen(false)}
              style={styles.sheetHeader}
              hitSlop={8}
            >
              <View style={[styles.sheetHandle, { backgroundColor: theme.textDisabled }]} />
              <View style={styles.sheetTitleRow}>
                <ThemedText type="smallBold" style={styles.sheetTitle}>
                  Individual word meanings
                </ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={22} color={theme.textSecondary} />
              </View>
            </Touchable>
            <View style={[styles.sheetBody, { borderTopColor: theme.border }]}>
              <MeaningRows results={results} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.medium,
  },
  actionBtn: { paddingHorizontal: Spacing.one, paddingVertical: Spacing.half },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: Spacing.half,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    maxHeight: '70%',
  },
  sheetHeader: {
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.two,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  sheetTitle: { flex: 1 },
  sheetBody: {
    borderTopWidth: 1,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  rows: {},
  meaningCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  meaningCardGap: { marginTop: Spacing.two },
  meaningAccent: { width: 4 },
  meaningBody: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  glossWell: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.small,
    borderWidth: 1,
  },
  mt2: { marginTop: 2 },
});
