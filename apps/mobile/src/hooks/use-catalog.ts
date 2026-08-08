import { useSyncExternalStore } from 'react';

import { getCatalogSnapshot, subscribeToCatalog } from '@/services/catalog-store';
import type { Catalog } from '@/services/content-repository';

export type CatalogState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; catalog: Catalog };

// Reads the shared store (services/catalog-store.ts) rather than fetching
// itself — the catalog is primed once at boot (app/_layout.tsx) and shared
// by every screen, cache-first across launches.
export function useCatalog(): CatalogState {
  const { catalog, error } = useSyncExternalStore(subscribeToCatalog, getCatalogSnapshot);
  if (catalog) return { status: 'ready', catalog };
  if (error) return { status: 'error', message: error };
  return { status: 'loading' };
}
