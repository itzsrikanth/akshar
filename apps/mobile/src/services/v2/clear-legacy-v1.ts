import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearDownloadedChaptersForMigration } from '../downloads';

/**
 * Explicit cleanup of legacy v1 offline artifacts only. Does not touch v2
 * downloads/history/selection, reading preferences, font size, or onboarding
 * flags — those stay until the user resets more broadly (dev reset).
 */
export async function clearLegacyV1LocalData(): Promise<void> {
  clearDownloadedChaptersForMigration();
  await AsyncStorage.multiRemove([
    'akshar:reading-history:default',
    'akshar:catalog-cache',
    'akshar:scope:default',
  ]);
}
