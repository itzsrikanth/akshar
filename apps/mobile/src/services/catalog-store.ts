// Shared, cache-first catalog store — the single source of truth every
// useCatalog() call reads from (see hooks/use-catalog.ts), rather than each
// screen independently fetching. A cached catalog (if any) is shown
// immediately at boot; a real network round trip only blocks the splash
// screen on the very first launch, before any cache exists. Home/Explore/
// Library all update together when the catalog changes, the same
// cross-screen-consistency reasoning as services/downloads.ts.
import { contentRepository } from '@/services';
import type { Catalog } from '@/services/content-repository';

import { loadCachedCatalog, saveCachedCatalog } from './catalog-cache';

type CatalogSnapshot = { catalog: Catalog | null; error: string | null };

let snapshot: CatalogSnapshot = { catalog: null, error: null };
const listeners = new Set<() => void>();

function setSnapshot(next: Partial<CatalogSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribeToCatalog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCatalogSnapshot(): CatalogSnapshot {
  return snapshot;
}

async function refreshCatalog(): Promise<void> {
  try {
    const fresh = await contentRepository.getCatalog();
    // Only replace + persist when the content actually changed — avoids an
    // unnecessary re-render of every screen reading the catalog on every
    // single launch, and an unnecessary AsyncStorage write.
    if (!snapshot.catalog || fresh.generatedAt !== snapshot.catalog.generatedAt) {
      await saveCachedCatalog(fresh);
      setSnapshot({ catalog: fresh, error: null });
    } else if (snapshot.error) {
      setSnapshot({ error: null });
    }
  } catch (err) {
    // A cached catalog is still valid to keep showing — a transient
    // network error shouldn't blank out a working offline experience.
    if (!snapshot.catalog) {
      setSnapshot({ error: err instanceof Error ? err.message : String(err) });
    }
  }
}

/** Called once at boot, from app/_layout.tsx, after dev settings apply. */
export async function primeCatalog(): Promise<void> {
  const cached = await loadCachedCatalog();
  if (cached) {
    setSnapshot({ catalog: cached, error: null });
    refreshCatalog(); // in the background — doesn't block the splash gate
    return;
  }
  await refreshCatalog();
}

/**
 * Dev-only: force a refetch bypassing the generatedAt-unchanged skip above,
 * so switching content source in app/dev-settings.tsx reflects immediately
 * even if the two sources happen to report the same generatedAt.
 */
export async function forceCatalogRefresh(): Promise<void> {
  try {
    const fresh = await contentRepository.getCatalog();
    await saveCachedCatalog(fresh);
    setSnapshot({ catalog: fresh, error: null });
  } catch (err) {
    setSnapshot({ error: err instanceof Error ? err.message : String(err) });
  }
}
