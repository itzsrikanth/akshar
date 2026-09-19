import { loadV2Chapter } from '@/services/v2';
import type { ChapterIdentity, V2Chapter } from '@/services/v2';

import { useAsyncResource } from './use-async-resource';

export type V2ChapterState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; chapter: V2Chapter };

/** Offline-first chapter loader for api/v2 identities. Pass `null` when inactive. */
export function useV2Chapter(identity: ChapterIdentity | null): V2ChapterState {
  const key = identity ? `${identity.bookId}/${identity.editionId}/${identity.chapterId}` : '';
  const state = useAsyncResource(key, () => {
    if (!identity) return Promise.reject(new Error('skipped'));
    return loadV2Chapter(identity);
  });
  if (!identity) return { status: 'loading' };
  return state.status === 'ready' ? { status: 'ready', chapter: state.data } : state;
}
