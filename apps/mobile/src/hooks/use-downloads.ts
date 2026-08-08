import { useCallback, useState } from 'react';

import { contentRepository } from '@/services';
import { deleteChapter, downloadChapter, listDownloadedSlugs } from '@/services/downloads';

// The File/Directory API is synchronous (see services/downloads.ts), so the
// initial list is read straight from disk with no loading state to manage.
export function useDownloads() {
  const [slugs, setSlugs] = useState<string[]>(() => listDownloadedSlugs());
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  const refresh = useCallback(() => setSlugs(listDownloadedSlugs()), []);

  const download = useCallback(async (path: string, slug: string) => {
    setPending((p) => new Set(p).add(slug));
    try {
      const chapter = await contentRepository.getChapter(path);
      downloadChapter(slug, chapter);
      refresh();
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(slug);
        return next;
      });
    }
  }, [refresh]);

  const remove = useCallback(
    (slug: string) => {
      deleteChapter(slug);
      refresh();
    },
    [refresh],
  );

  return {
    downloadedSlugs: slugs,
    isDownloaded: (slug: string) => slugs.includes(slug),
    isPending: (slug: string) => pending.has(slug),
    download,
    remove,
  };
}
