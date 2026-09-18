import AsyncStorage from '@react-native-async-storage/async-storage';

import { isLocalDataResetting } from '../local-reset-state';
import { type V2Catalog, isV2Catalog, validateV2Catalog } from './types';

// Separate from v1 `akshar:catalog-cache` — never overwrite legacy caches.
const STORAGE_KEY = 'akshar:v2:catalog-cache:default';

export async function loadCachedV2Catalog(): Promise<V2Catalog | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isV2Catalog(parsed)) return null;
    return validateV2Catalog(parsed);
  } catch {
    return null;
  }
}

export async function saveCachedV2Catalog(catalog: V2Catalog): Promise<void> {
  if (isLocalDataResetting()) return;
  const validated = validateV2Catalog(catalog);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
}
