import type { Chapter } from '@/services/content-repository';
import { normalizeChapter } from '@/services/catalog-compatibility';
import { loadChapter } from '@/services/load-chapter';

import { useAsyncResource } from './use-async-resource';

export type ChapterState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; chapter: Chapter };

// Offline-first with contentHash revalidation — see services/load-chapter.ts.
// Pass `null` when the screen is in v2-identity mode so this hook stays
// mounted without fetching a legacy path.
export function useChapter(path: string | null): ChapterState {
  const state = useAsyncResource(path ?? '', () => {
    if (!path) return Promise.reject(new Error('skipped'));
    return loadChapter(path);
  });
  if (!path) return { status: 'loading' };
  return state.status === 'ready' ? { status: 'ready', chapter: normalizeChapter(state.data, path) } : state;
}
