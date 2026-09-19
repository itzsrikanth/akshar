import { useSyncExternalStore } from 'react';

import { getV2CatalogSnapshot, subscribeToV2Catalog } from '@/services/v2/catalog-store';
import type { V2Catalog } from '@/services/v2';

export type V2CatalogState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; catalog: V2Catalog };

export function useV2Catalog(): V2CatalogState {
  const snapshot = useSyncExternalStore(subscribeToV2Catalog, getV2CatalogSnapshot);
  if (snapshot.catalog) return { status: 'ready', catalog: snapshot.catalog };
  if (snapshot.error) return { status: 'error', message: snapshot.error };
  return { status: 'loading' };
}
