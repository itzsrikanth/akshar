import { contentRepository } from '@/services';
import type { Catalog } from '@/services/content-repository';

import { useAsyncResource } from './use-async-resource';

export type CatalogState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; catalog: Catalog };

export function useCatalog(): CatalogState {
  const state = useAsyncResource('catalog', () => contentRepository.getCatalog());
  return state.status === 'ready' ? { status: 'ready', catalog: state.data } : state;
}
