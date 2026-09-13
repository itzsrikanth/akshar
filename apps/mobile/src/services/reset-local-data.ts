import AsyncStorage from '@react-native-async-storage/async-storage';
import { reloadAppAsync } from 'expo';

import { clearDownloadedChapters } from './downloads';
import { invalidateContentCache } from './index';
import { beginLocalDataReset } from './local-reset-state';

let pending: Promise<void> | null = null;

async function performReset(): Promise<void> {
  beginLocalDataReset();
  try {
    clearDownloadedChapters();
    await AsyncStorage.clear();
    invalidateContentCache();
  } catch {
    throw new Error('Some local data could not be cleared. Keep this screen open and retry the reset.');
  }
  try {
    await reloadAppAsync('Developer reset of local app data');
  } catch {
    throw new Error('Local data was cleared, but restarting failed. Reload from Metro or fully close and reopen Akshar.');
  }
}

export function resetLocalDataAndRestart(): Promise<void> {
  if (!__DEV__) return Promise.reject(new Error('Local data reset is only available in development builds.'));
  if (!pending) {
    pending = performReset().finally(() => {
      pending = null;
    });
  }
  return pending;
}
