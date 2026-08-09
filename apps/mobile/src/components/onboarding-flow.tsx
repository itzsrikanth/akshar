import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScopeSetupFlow } from '@/components/scope-setup-flow';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Touchable } from '@/components/touchable';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Catalog } from '@/services/content-repository';
import { setOnboardingCompleted } from '@/services/onboarding-storage';
import { saveReadingPreference } from '@/services/reading-preference-storage';
import { saveScope } from '@/services/scope-storage';

type Step = 'welcome' | 'flow';

export function OnboardingFlow({ catalog, onComplete }: { catalog: Catalog; onComplete: () => void }) {
  const [step, setStep] = useState<Step>('welcome');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {step === 'welcome' ? (
          <WelcomeStep onGetStarted={() => setStep('flow')} />
        ) : (
          <ScopeSetupFlow
            catalog={catalog}
            onSave={(scope, preference) => {
              saveScope(scope);
              saveReadingPreference(preference);
              setOnboardingCompleted();
              onComplete();
            }}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

// Plain View/Text, not ThemedText/ThemedView — same reasoning as SplashView:
// a fixed brand-color surface (#F4F1EC per the design), independent of theme.
function WelcomeStep({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeCenter}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="translate" size={36} color="#ffffff" />
        </View>
        <ThemedText type="title" style={styles.welcomeTitle}>
          Welcome to Akshar
        </ThemedText>
        {/* Not the design's literal "reads chapters aloud in your language" —
            there's no audio/TTS playback built yet (see docs/roadmap.md).
            Same substitution reasoning as Home's "Learning app" subtitle. */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.welcomeSubtitle}>
          Every line of every lesson, alongside a pronunciation guide and a translation — plus
          exercises to check what you've learned. Let's set up what you're studying.
        </ThemedText>
      </View>
      <View style={styles.welcomeFooter}>
        <Touchable onPress={onGetStarted} style={[styles.primaryButton, { backgroundColor: Colors.light.tint }]}>
          <ThemedText type="default" style={styles.primaryButtonText}>
            Get started
          </ThemedText>
        </Touchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  welcomeContainer: { flex: 1, backgroundColor: '#F4F1EC' },
  welcomeCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: Spacing.five },
  badge: { width: 72, height: 72, borderRadius: Radius.large, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { textAlign: 'center' },
  welcomeSubtitle: { textAlign: 'center', lineHeight: 20 },
  welcomeFooter: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },

  primaryButton: { borderRadius: Radius.medium, padding: Spacing.three, alignItems: 'center' },
  primaryButtonText: { fontWeight: '600', fontSize: 16 },
});
