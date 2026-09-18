import { loadV2Chapter } from '@/services/v2';
import type { ChapterIdentity, V2Chapter } from '@/services/v2';

import { useAsyncResource } from './use-async-resource';

export type V2ChapterState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; chapter: V2Chapter };

/** Offline-first chapter loader for api/v2 identities. Does not touch v1 slug downloads. */
export function useV2Chapter(identity: ChapterIdentity): V2ChapterState {
  const key = `${identity.bookId}/${identity.editionId}/${identity.chapterId}`;
  const state = useAsyncResource(key, () => loadV2Chapter(identity));
  return state.status === 'ready' ? { status: 'ready', chapter: state.data } : state;
}
