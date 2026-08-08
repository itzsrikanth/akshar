import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ChapterState } from '@/hooks/use-chapter';

/** Shared loading/error UI for any screen driven by useChapter — everything but the 'ready' case. */
export function ChapterLoadState({ state }: { state: Exclude<ChapterState, { status: 'ready' }> }) {
  return (
    <View style={styles.container}>
      {state.status === 'loading' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Loading chapter…
        </ThemedText>
      ) : (
        <>
          <ThemedText type="default">Couldn't load this chapter.</ThemedText>
          <ThemedText type="small" themeColor="textDisabled" style={styles.mt2}>
            {state.message}
          </ThemedText>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  mt2: { marginTop: Spacing.two },
});
