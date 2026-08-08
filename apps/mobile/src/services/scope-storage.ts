import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Scope } from './scope';

// Single saved scope for now — one parent, one child (see
// docs/product-brief.md's non-goals) — but namespaced by a fixed 'default'
// profile id at zero extra cost today, per docs/roadmap.md's multi-kid
// item: a real profile switcher later means new profile ids, not a
// migration off a global, unkeyed storage key.
const STORAGE_KEY = 'akshar:scope:default';

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
