import { useEffect, useState } from 'react';

import { contentRepository } from '@/services';
import type { Chapter } from '@/services/content-repository';

export type ChapterState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; chapter: Chapter };

export function useChapter(path: string): ChapterState {
  const [state, setState] = useState<ChapterState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    contentRepository
      .getChapter(path)
      .then((chapter) => {
        if (!cancelled) setState({ status: 'ready', chapter });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
