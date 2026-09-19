import { invalidateV2ContentCache, v2ContentRepository } from './content-repository';
import { loadCachedV2Catalog, saveCachedV2Catalog } from './catalog-cache';
import type { V2Catalog } from './types';

type V2CatalogSnapshot = { catalog: V2Catalog | null; error: string | null };

let snapshot: V2CatalogSnapshot = { catalog: null, error: null };
const listeners = new Set<() => void>();

function setSnapshot(next: Partial<V2CatalogSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribeToV2Catalog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getV2CatalogSnapshot(): V2CatalogSnapshot {
  return snapshot;
}

async function refreshV2Catalog(): Promise<void> {
  try {
    const fresh = await v2ContentRepository.getCatalog();
    if (!snapshot.catalog || fresh.generatedAt !== snapshot.catalog.generatedAt) {
      await saveCachedV2Catalog(fresh);
      setSnapshot({ catalog: fresh, error: null });
    } else if (snapshot.error) {
      setSnapshot({ error: null });
    }
  } catch (err) {
    if (!snapshot.catalog) {
      setSnapshot({ error: err instanceof Error ? err.message : String(err) });
    }
  }
}

export async function primeV2Catalog(): Promise<void> {
  const cached = await loadCachedV2Catalog();
  if (cached) {
    setSnapshot({ catalog: cached, error: null });
    refreshV2Catalog();
    return;
  }
  await refreshV2Catalog();
}

export async function forceV2CatalogRefresh(): Promise<void> {
  try {
    invalidateV2ContentCache();
    const fresh = await v2ContentRepository.getCatalog();
    await saveCachedV2Catalog(fresh);
    setSnapshot({ catalog: fresh, error: null });
  } catch (err) {
    setSnapshot({ error: err instanceof Error ? err.message : String(err) });
  }
}
