import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Placeholder — real chapter data (api/contents.json), but "downloaded" and
// "segments read" aren't tracked anywhere yet (no download layer, no
// ProgressRepository — see docs/tech-implementation.md). Only ch01 is shown
// since it's the only chapter that's ever actually been "read" in this
// placeholder sense; ch02 has no coverage yet (see explore.tsx).
const DOWNLOADED = [{ title: 'ಬಣ್ಣದ ತಗಡಿನ ತುತ್ತೂರಿ', segmentsRead: 5, segmentsTotal: 12 }];

export default function LibraryScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Library</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Chapters you've downloaded for offline reading
          </ThemedText>

          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            {`DOWNLOADED · ${DOWNLOADED.length}`}
          </ThemedText>
          {DOWNLOADED.map((chapter, i) => (
            <Pressable
              key={chapter.title}
              onPress={() => router.push('/reader')}
              style={[styles.row, i < DOWNLOADED.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
            >
              <View style={[styles.icon, { backgroundColor: theme.tintMuted }]}>
                <MaterialCommunityIcons name="book-open-page-variant" size={22} color={theme.tint} />
              </View>
              <View style={styles.f1}>
                <ThemedText type="default">{chapter.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.mt5}>
                  {`${chapter.segmentsRead} of ${chapter.segmentsTotal} segments read`}
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
            </Pressable>
          ))}

          <Pressable onPress={() => router.push('/explore')} style={styles.browseLink}>
            <ThemedText type="smallBold" themeColor="tint">
              Browse full catalog →
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  subtitle: { marginTop: 4, marginBottom: Spacing.four },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  icon: { width: 44, height: 44, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  browseLink: { alignItems: 'center', marginTop: Spacing.four },
  f1: { flex: 1 },
  mt5: { marginTop: 5 },
});
