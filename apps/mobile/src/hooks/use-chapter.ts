import { contentRepository } from '@/services';
import type { Chapter } from '@/services/content-repository';
import { getDownloadedChapter, slugFromPath } from '@/services/downloads';

import { useAsyncResource } from './use-async-resource';

export type ChapterState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; chapter: Chapter };

// Downloaded copy first — this is what actually makes Library's "read
// offline" promise real, not just a badge (see services/downloads.ts).
export function useChapter(path: string): ChapterState {
  const state = useAsyncResource(path, () => {
    const downloaded = getDownloadedChapter(slugFromPath(path));
    return downloaded ? Promise.resolve(downloaded) : contentRepository.getChapter(path);
  });
  return state.status === 'ready' ? { status: 'ready', chapter: state.data } : state;
}
