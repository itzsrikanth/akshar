import { useCallback, useState, useSyncExternalStore } from 'react';

import { contentRepository } from '@/services';
import { deleteChapter, downloadChapter, getDownloadedSlugsSnapshot, subscribeToDownloads } from '@/services/downloads';

// Subscribes to the shared downloads store (services/downloads.ts) rather
// than keeping its own local list — Explore and Library each mount their
// own instance of this hook, and both need to see a download made in
// either one without waiting for a remount.
export function useDownloads() {
  const slugs = useSyncExternalStore(subscribeToDownloads, getDownloadedSlugsSnapshot);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  const download = useCallback(async (path: string, slug: string) => {
    setPending((p) => new Set(p).add(slug));
    try {
      const chapter = await contentRepository.getChapter(path);
      downloadChapter(slug, chapter);
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(slug);
        return next;
      });
    }
  }, []);

  const remove = useCallback((slug: string) => {
    deleteChapter(slug);
  }, []);

  return {
    downloadedSlugs: slugs,
    isDownloaded: (slug: string) => slugs.includes(slug),
    isPending: (slug: string) => pending.has(slug),
    download,
    remove,
  };
}
