import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { setOnboardingCompleted } from '@/services/onboarding-storage';
import {
  type V2Catalog,
  type V2Selection,
  listAdoptionOptions,
  saveV2Selection,
  selectionFromAdoption,
  setV2SetupCompleted,
} from '@/services/v2';

type Props = {
  catalog: V2Catalog;
  /** True when the user already completed legacy v1 onboarding. */
  isUpgrade: boolean;
  onComplete: (selection: V2Selection) => void;
  onRetry?: () => void;
  busy?: boolean;
};

/**
 * Explained book/adoption selection for the v2 pilot. Does not import v1
 * history/downloads or clear them — cleanup stays explicit and later.
 */
export function V2SetupFlow({ catalog, isUpgrade, onComplete, onRetry, busy }: Props) {
  const theme = useTheme();
  const options = useMemo(() => listAdoptionOptions(catalog), [catalog]);
  const [selectedId, setSelectedId] = useState<string | null>(options[0]?.adoption.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = options.find((option) => option.adoption.id === selectedId) ?? null;

  const finish = async () => {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const selection = selectionFromAdoption(selected.adoption);
      await saveV2Selection(selection);
      await setV2SetupCompleted();
      await setOnboardingCompleted();
      onComplete(selection);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="book-education-outline" size={32} color="#ffffff" />
          </View>
          <ThemedText type="title" style={styles.title}>
            {isUpgrade ? 'Update your library setup' : 'Choose how you study'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
            {isUpgrade
              ? 'Akshar now identifies books by publication and edition, not just board and grade folders. Pick your learner context below. Your previous downloads and history stay on this device until you choose to clear them later — this step does not delete them or require a reinstall.'
              : 'The same Kannada book can be used as Grade 3 first language or Grade 5 second language. Choose the context that matches how you study. You can switch later without downloading the chapters again.'}
          </ThemedText>

          {options.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary">
                No learner contexts are available yet. Check the content server and try again.
              </ThemedText>
              {onRetry && (
                <Touchable onPress={onRetry} style={[styles.secondaryButton, { borderColor: theme.border }]}>
                  <ThemedText type="smallBold" themeColor="tint">
                    Retry
                  </ThemedText>
                </Touchable>
              )}
            </View>
          ) : (
            <View style={styles.list}>
              {options.map((option) => {
                const active = option.adoption.id === selectedId;
                return (
                  <Touchable
                    key={option.adoption.id}
                    onPress={() => setSelectedId(option.adoption.id)}
                    style={[
                      styles.option,
                      {
                        borderColor: active ? theme.tint : theme.border,
                        backgroundColor: active ? theme.tintMuted : theme.background,
                      },
                    ]}
                  >
                    <View style={styles.optionText}>
                      <ThemedText type="subtitle">{option.displayLabel}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.mt4}>
                        {`${option.bookTitle} · ${option.editionLabel}`}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.mt4}>
                        {`${option.chapterCount} chapters · same book for every context above`}
                      </ThemedText>
                    </View>
                    <MaterialCommunityIcons
                      name={active ? 'check-circle' : 'circle-outline'}
                      size={22}
                      color={active ? theme.tint : theme.textDisabled}
                    />
                  </Touchable>
                );
              })}
            </View>
          )}

          {error && (
            <ThemedText type="small" themeColor="error" style={styles.error}>
              {error}
            </ThemedText>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Touchable
            onPress={finish}
            disabled={!selected || saving || busy}
            style={[styles.primaryButton, { backgroundColor: Colors.light.tint, opacity: !selected || saving || busy ? 0.5 : 1 }]}
          >
            {saving || busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText type="default" style={styles.primaryButtonText}>
                {isUpgrade ? 'Continue with this context' : 'Save and continue'}
              </ThemedText>
            )}
          </Touchable>
          {isUpgrade && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.footerNote}>
              Offline or failed setup can be retried anytime. Old files are left alone until you clear them from developer settings.
            </ThemedText>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  badge: {
    width: 64,
    height: 64,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    alignSelf: 'center',
    marginTop: Spacing.four,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', lineHeight: 20 },
  list: { gap: Spacing.two, marginTop: Spacing.two },
  option: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  optionText: { flex: 1 },
  empty: { gap: Spacing.three, alignItems: 'center', marginTop: Spacing.four },
  secondaryButton: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  error: { textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.two },
  primaryButton: { borderRadius: Radius.medium, padding: Spacing.three, alignItems: 'center' },
  primaryButtonText: { fontWeight: '600', fontSize: 16, color: '#ffffff' },
  footerNote: { textAlign: 'center', lineHeight: 18 },
  mt4: { marginTop: 4 },
});
