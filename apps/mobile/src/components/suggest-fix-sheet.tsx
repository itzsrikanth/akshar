import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/touchable';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  openSuggestFixIssue,
  type SuggestFixContext,
  type SuggestLayer,
} from '@/services/suggest-fix';
import { recordSuggestFixEvent } from '@/services/suggest-fix-metrics';

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

type Step = 'choose' | 'form';

type GlossSeed = {
  selectedForm: string;
  lemma?: string;
  currentGloss?: string;
  glossLanguage?: string | null;
};

export type SuggestFixSheetProps = {
  visible: boolean;
  onClose: () => void;
  context: SuggestFixContext | null;
  /** When set, skip the layer chooser and open directly on that layer. */
  initialLayer?: SuggestLayer;
  /** Prefill for word-meaning suggestions from the meaning sheet. */
  glossSeed?: GlossSeed | null;
};

const LAYER_OPTIONS: Array<{
  layer: SuggestLayer;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
  {
    layer: 'translation',
    title: 'Translation',
    subtitle: 'Meaning of this line in your language',
    icon: 'translate',
  },
  {
    layer: 'source',
    title: 'Source text',
    subtitle: 'Typo or error in the textbook line',
    icon: 'book-open-page-variant-outline',
  },
  {
    layer: 'gloss',
    title: 'Word meaning',
    subtitle: 'Root or gloss for a word in this line',
    icon: 'book-search-outline',
  },
  {
    layer: 'other',
    title: 'Something else',
    subtitle: 'Transliteration, audio, missing content, …',
    icon: 'dots-horizontal-circle-outline',
  },
];

function currentDisplay(layer: SuggestLayer, context: SuggestFixContext, glossSeed?: GlossSeed | null): string {
  switch (layer) {
    case 'translation':
      return context.translationText?.trim() || 'Translation not yet available';
    case 'source':
      return context.sourceText;
    case 'gloss':
      return glossSeed?.currentGloss?.trim() || 'Root/meaning not available';
    case 'other':
      return [
        context.sourceText,
        context.translationText ? `Translation: ${context.translationText}` : null,
        context.transliterationText ? `Transliteration: ${context.transliterationText}` : null,
      ]
        .filter(Boolean)
        .join('\n\n');
  }
}

export function SuggestFixSheet({
  visible,
  onClose,
  context,
  initialLayer,
  glossSeed,
}: SuggestFixSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(initialLayer ? 'form' : 'choose');
  const [layer, setLayer] = useState<SuggestLayer | null>(initialLayer ?? null);
  const [proposedText, setProposedText] = useState('');
  const [note, setNote] = useState('');
  const [selectedForm, setSelectedForm] = useState(glossSeed?.selectedForm ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    recordSuggestFixEvent({ type: 'sheet_opened' });
    setStep(initialLayer ? 'form' : 'choose');
    setLayer(initialLayer ?? null);
    setProposedText('');
    setNote('');
    setSelectedForm(glossSeed?.selectedForm ?? '');
    setSubmitting(false);
  }, [visible, initialLayer, glossSeed?.selectedForm]);

  const title = useMemo(() => {
    if (step === 'choose') return 'Suggest a fix';
    switch (layer) {
      case 'translation':
        return 'Suggest a better translation';
      case 'source':
        return 'Suggest a source-text fix';
      case 'gloss':
        return 'Suggest a better meaning';
      case 'other':
        return 'Tell us what is wrong';
      default:
        return 'Suggest a fix';
    }
  }, [step, layer]);

  const close = useCallback(() => {
    recordSuggestFixEvent({ type: 'cancelled' });
    onClose();
  }, [onClose]);

  const pickLayer = useCallback((next: SuggestLayer) => {
    const apply = () => {
      recordSuggestFixEvent({ type: 'layer_chosen', layer: next });
      setLayer(next);
      setStep('form');
      setProposedText('');
      setNote('');
    };

    if (next === 'source') {
      Alert.alert(
        'Source text is carefully reviewed',
        'Fixes to the textbook line itself may need audio updates and a maintainer check. Continue only if the printed line looks wrong.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: apply },
        ],
      );
      return;
    }
    apply();
  }, []);

  const submit = useCallback(() => {
    if (!context || !layer) return;
    const payloadProposed = proposedText.trim();
    const payloadNote = note.trim();
    if (layer === 'other' && !payloadNote && !payloadProposed) {
      Alert.alert('Add a short note', 'Describe what looks wrong so a reviewer can help.');
      return;
    }
    if (layer === 'gloss' && !selectedForm.trim()) {
      Alert.alert('Which word?', 'Enter the word you are suggesting a meaning for.');
      return;
    }

    Alert.alert(
      'Open review form?',
      'We will open a short form on GitHub so a reviewer can check this. You will need a free GitHub account to submit. Nothing is published automatically.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open form',
          onPress: () => {
            setSubmitting(true);
            void openSuggestFixIssue({
              ...context,
              layer,
              selectedForm: selectedForm.trim() || glossSeed?.selectedForm,
              lemma: glossSeed?.lemma,
              currentGloss: glossSeed?.currentGloss,
              glossLanguage: glossSeed?.glossLanguage ?? context.translationLanguage,
              proposedText: payloadProposed,
              note: payloadNote,
            })
              .then(() => {
                onClose();
              })
              .catch((err: unknown) => {
                Alert.alert(
                  'Could not open GitHub',
                  err instanceof Error ? err.message : 'Please try again.',
                );
              })
              .finally(() => setSubmitting(false));
          },
        },
      ],
    );
  }, [context, layer, proposedText, note, selectedForm, glossSeed, onClose]);

  if (!context) return null;

  const current = layer ? currentDisplay(layer, context, glossSeed) : '';
  const proposedPlaceholder =
    layer === 'other'
      ? 'Optional — what it should say'
      : layer === 'gloss'
        ? 'Better meaning (or leave blank to flag only)'
        : 'Corrected text (or leave blank to flag only)';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.sheetBackdrop} onPress={close}>
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
              {title}
            </ThemedText>
            <Touchable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={close}
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
            {step === 'choose' ? (
              <View style={styles.optionList}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                  What looks wrong on this line? Pick one layer — we will show only that text.
                </ThemedText>
                {LAYER_OPTIONS.map((option) => (
                  <Touchable
                    key={option.layer}
                    accessibilityRole="button"
                    accessibilityLabel={option.title}
                    onPress={() => pickLayer(option.layer)}
                    style={[
                      styles.optionRow,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    <MaterialCommunityIcons name={option.icon} size={22} color={theme.tint} />
                    <View style={styles.optionText}>
                      <ThemedText type="default">{option.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {option.subtitle}
                      </ThemedText>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
                  </Touchable>
                ))}
              </View>
            ) : (
              <View style={styles.form}>
                {!initialLayer ? (
                  <Touchable
                    onPress={() => {
                      setStep('choose');
                      setLayer(null);
                    }}
                    hitSlop={8}
                    style={styles.backLink}
                  >
                    <ThemedText type="small" themeColor="tint">
                      ← Change what is wrong
                    </ThemedText>
                  </Touchable>
                ) : null}

                {layer === 'gloss' ? (
                  <>
                    <ThemedText type="small" themeColor="textSecondary">
                      Word
                    </ThemedText>
                    <TextInput
                      value={selectedForm}
                      onChangeText={setSelectedForm}
                      placeholder="Word in the source line"
                      placeholderTextColor={theme.textDisabled}
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                        },
                      ]}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </>
                ) : null}

                <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                  Current
                </ThemedText>
                <View
                  style={[
                    styles.currentBox,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  <ThemedText type="small" scalable>
                    {current}
                  </ThemedText>
                </View>

                <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                  Your suggestion
                </ThemedText>
                <TextInput
                  value={proposedText}
                  onChangeText={setProposedText}
                  placeholder={proposedPlaceholder}
                  placeholderTextColor={theme.textDisabled}
                  multiline
                  style={[
                    styles.input,
                    styles.multiline,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                  textAlignVertical="top"
                />

                <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                  Note (optional)
                </ThemedText>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={layer === 'other' ? 'What is wrong?' : 'Why this looks better'}
                  placeholderTextColor={theme.textDisabled}
                  multiline
                  style={[
                    styles.input,
                    styles.noteInput,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                  textAlignVertical="top"
                />

                <ThemedText type="small" themeColor="textSecondary" style={styles.footerHint}>
                  A reviewer checks every suggestion. Nothing is published from this screen.
                </ThemedText>

                <Touchable
                  accessibilityRole="button"
                  accessibilityLabel="Open review form"
                  onPress={submit}
                  disabled={submitting}
                  style={[styles.submitBtn, { backgroundColor: theme.tint, opacity: submitting ? 0.7 : 1 }]}
                >
                  {submitting ? (
                    <ActivityIndicator color={theme.onTint} />
                  ) : (
                    <ThemedText type="smallBold" style={{ color: theme.onTint }}>
                      Continue to review form
                    </ThemedText>
                  )}
                </Touchable>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
    maxHeight: '85%',
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
  sheetBody: { paddingBottom: Spacing.one },
  hint: { marginBottom: Spacing.two },
  optionList: { gap: Spacing.two },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  optionText: { flex: 1, gap: 2 },
  form: { gap: 0 },
  backLink: { marginBottom: Spacing.two },
  fieldLabel: { marginTop: Spacing.three, marginBottom: Spacing.one },
  currentBox: {
    borderWidth: 1,
    borderRadius: Radius.small,
    padding: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
    lineHeight: 22,
  },
  multiline: { minHeight: 88 },
  noteInput: { minHeight: 64 },
  footerHint: { marginTop: Spacing.three, marginBottom: Spacing.two },
  submitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    minHeight: 48,
  },
});
