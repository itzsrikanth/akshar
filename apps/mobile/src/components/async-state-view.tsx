import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/** Shared loading/error UI for anything backed by useAsyncResource (useChapter, useCatalog, ...). */
export function AsyncStateView({ state }: { state: { status: 'loading' } | { status: 'error'; message: string } }) {
  return (
    <View style={styles.container}>
      {state.status === 'loading' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Loading…
        </ThemedText>
      ) : (
        <>
          <ThemedText type="default">Couldn't load this.</ThemedText>
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
