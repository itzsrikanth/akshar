import AsyncStorage from '@react-native-async-storage/async-storage';

import { isLocalDataResetting } from '../local-reset-state';

// Separate from v1 onboarding — completing v1 must not imply v2 setup, and
// completing v2 setup must not silently import or clear v1 downloads/history.
const STORAGE_KEY = 'akshar:v2:setup-completed:default';

export async function hasCompletedV2Setup(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setV2SetupCompleted(): Promise<void> {
  if (isLocalDataResetting()) return;
  await AsyncStorage.setItem(STORAGE_KEY, 'true');
}
