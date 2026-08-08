import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Scope } from './scope';

// Single saved scope for now — one parent, one child (see
// docs/product-brief.md's non-goals). Multi-profile (docs/roadmap.md's
// multi-kid item) would key this by profile id instead of a fixed string.
const STORAGE_KEY = 'akshar:scope';

export async function loadSavedScope(): Promise<Scope | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Scope) : null;
  } catch {
    // Corrupt or inaccessible storage shouldn't crash the app — just means
    // no saved scope, same as a first launch.
    return null;
  }
}

export async function saveScope(scope: Scope): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
}
