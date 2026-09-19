import { contentRepository } from '@/services';
import type { Chapter } from '@/services/content-repository';
import { normalizeChapter } from '@/services/catalog-compatibility';
import { getDownloadedChapter, slugFromPath } from '@/services/downloads';

import { useAsyncResource } from './use-async-resource';

export type ChapterState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; chapter: Chapter };

// Downloaded copy first — this is what actually makes Library's "read
// offline" promise real, not just a badge (see services/downloads.ts).
// Pass `null` when the screen is in v2-identity mode so this hook stays
// mounted without fetching a legacy path.
export function useChapter(path: string | null): ChapterState {
  const state = useAsyncResource(path ?? '', () => {
    if (!path) return Promise.reject(new Error('skipped'));
    const downloaded = getDownloadedChapter(slugFromPath(path));
    return downloaded ? Promise.resolve(downloaded) : contentRepository.getChapter(path);
  });
  if (!path) return { status: 'loading' };
  return state.status === 'ready' ? { status: 'ready', chapter: normalizeChapter(state.data, path) } : state;
}
