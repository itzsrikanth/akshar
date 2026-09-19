import { useCallback, useState, useSyncExternalStore } from 'react';

import {
  type ChapterIdentity,
  canonicalChapterKey,
  deleteV2Chapter,
  downloadV2Chapter,
  getDownloadedV2KeysSnapshot,
  subscribeToV2Downloads,
  v2ContentRepository,
} from '@/services/v2';

export function useV2Downloads() {
  const keys = useSyncExternalStore(subscribeToV2Downloads, getDownloadedV2KeysSnapshot);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  const download = useCallback(async (identity: ChapterIdentity) => {
    const key = canonicalChapterKey(identity);
    setPending((p) => new Set(p).add(key));
    try {
      const chapter = await v2ContentRepository.getChapter(identity);
      const catalog = await v2ContentRepository.getCatalog();
      const contentHash = catalog.chapters.find(
        (c) =>
          c.bookId === identity.bookId &&
          c.editionId === identity.editionId &&
          c.chapterId === identity.chapterId,
      )?.contentHash;
      downloadV2Chapter(identity, chapter, contentHash);
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(key);
        return next;
      });
    }
  }, []);

  const remove = useCallback((identity: ChapterIdentity) => {
    deleteV2Chapter(identity);
  }, []);

  return {
    downloadedKeys: keys,
    isDownloaded: (identity: ChapterIdentity) => keys.includes(canonicalChapterKey(identity)),
    isPending: (identity: ChapterIdentity) => pending.has(canonicalChapterKey(identity)),
    download,
    remove,
  };
}
