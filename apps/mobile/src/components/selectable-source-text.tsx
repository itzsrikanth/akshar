import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useFontScale } from '@/hooks/use-font-scale';
import { useTheme } from '@/hooks/use-theme';
import {
  resolveMeaning,
  tokenizeSource,
  type ChapterVocabPair,
  type LexiconBundle,
  type MeaningResult,
  type SourceToken,
} from '@/services/lexicon';

const cardChrome = Platform.select({
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

function MeaningDetail({ result }: { result: MeaningResult }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.meaningCard,
        cardChrome,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.meaningAccent, { backgroundColor: theme.tint }]} />
      <View style={styles.meaningBody}>
        {result.kind === 'function' ? (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Selected word
            </ThemedText>
            <View style={styles.formRow}>
              <MaterialCommunityIcons name="link-variant" size={16} color={theme.textSecondary} />
              <ThemedText type="default" scalable>
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
            <ThemedText type="small" themeColor="textSecondary">
              Selected word
            </ThemedText>
            <View style={styles.formRow}>
              <MaterialCommunityIcons name="book-search-outline" size={16} color={theme.textSecondary} />
              <ThemedText type="default" scalable>
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
            <ThemedText type="small" themeColor="textSecondary">
              Selected word
            </ThemedText>
            <View style={styles.formRow}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color={theme.tint} />
              <ThemedText type="default" scalable themeColor="tint">
                {result.selectedForm}
              </ThemedText>
            </View>

            {result.lemma ? (
              <>
                <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                  Root / lemma
                </ThemedText>
                <ThemedText type="default" scalable>
                  {result.lemma}
                  {result.transliteration ? ` · ${result.transliteration}` : ''}
                </ThemedText>
              </>
            ) : result.transliteration ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.mt2}>
                {result.transliteration}
              </ThemedText>
            ) : null}

            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              Meaning
            </ThemedText>
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
  );
}

/**
 * Grapheme-safe tappable source text. Tapping a word opens a bottom sheet with
 * form / root / gloss. Close via the X or by tapping outside. Stock RN Text
 * selection cannot host a custom toolbar; tokens are tappable instead.
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const closeSheet = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const onTokenPress = useCallback((token: SourceToken) => {
    if (!token.selectable) return;
    setActiveIndex(token.index);
  }, []);

  const activeToken = activeIndex != null ? tokens[activeIndex] : null;
  const result = useMemo(() => {
    if (!activeToken?.selectable) return null;
    return resolveMeaning(activeToken.text, lexicon, chapterVocab, preferredLanguage);
  }, [activeToken, lexicon, chapterVocab, preferredLanguage]);

  const sheetOpen = result != null;
  const readingSize = {
    fontSize: Typography.reading.fontSize * scale,
    lineHeight: Typography.reading.lineHeight * scale,
  };

  return (
    <View>
      <Text style={[{ color: theme.text }, readingSize]}>
        {tokens.map((token) => {
          const selected = activeIndex === token.index && token.selectable;
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
              accessibilityLabel={`Show meaning for ${token.text}`}
            >
              {token.text}
            </Text>
          );
        })}
      </Text>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={closeSheet}>
        <Pressable style={styles.sheetBackdrop} onPress={closeSheet}>
          <Pressable
            style={[
              styles.sheet,
              sheetChrome,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, Spacing.three),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.textDisabled }]} />
            <View style={styles.sheetTitleRow}>
              <ThemedText type="smallBold" style={styles.sheetTitle}>
                Word meaning
              </ThemedText>
              <Touchable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={closeSheet}
                hitSlop={12}
                style={[styles.closeBtn, { backgroundColor: theme.backgroundSelected }]}
              >
                <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
              </Touchable>
            </View>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetBody}
              keyboardShouldPersistTaps="handled"
            >
              {result ? <MeaningDetail result={result} /> : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.two,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sheetTitle: { flex: 1, paddingRight: Spacing.two },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: { flexGrow: 0 },
  sheetBody: {
    paddingBottom: Spacing.one,
  },
  meaningCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  meaningAccent: { width: 4 },
  meaningBody: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.half,
  },
  sectionLabel: {
    marginTop: Spacing.three,
  },
  glossWell: {
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.small,
    borderWidth: 1,
  },
  mt2: { marginTop: 2 },
});
