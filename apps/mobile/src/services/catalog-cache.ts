import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Catalog } from './content-repository';

// Persists the catalog across cold starts, keyed off Catalog.generatedAt
// (see services/catalog-store.ts) — content is public/non-sensitive, and
// small enough (metadata only, no chapter bodies) that a single JSON blob
// is fine; no per-chapter keys needed the way downloads.ts does for actual
// chapter content.
const STORAGE_KEY = 'akshar:catalog-cache';

export async function loadCachedCatalog(): Promise<Catalog | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Catalog) : null;
  } catch {
    // Corrupt or inaccessible storage shouldn't crash the app — just means
    // no cache, same as a first launch.
    return null;
  }
}

export async function saveCachedCatalog(catalog: Catalog): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
}
