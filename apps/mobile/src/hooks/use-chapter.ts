import { contentRepository } from '@/services';
import type { Chapter } from '@/services/content-repository';

import { useAsyncResource } from './use-async-resource';

export type ChapterState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; chapter: Chapter };

export function useChapter(path: string): ChapterState {
  const state = useAsyncResource(path, () => contentRepository.getChapter(path));
  return state.status === 'ready' ? { status: 'ready', chapter: state.data } : state;
}
