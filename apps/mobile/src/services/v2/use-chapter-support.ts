import { getDownloadedV2Chapter, downloadV2Chapter } from './downloads';
import { v2ContentRepository } from './content-repository';
import type { ChapterIdentity } from './identity';
import type { V2Chapter } from './types';

/**
 * Prefer the offline copy; otherwise fetch from api/v2. Does not migrate or
 * read v1 slug downloads.
 */
export async function loadV2Chapter(identity: ChapterIdentity): Promise<V2Chapter> {
  const downloaded = getDownloadedV2Chapter(identity);
  if (downloaded) return downloaded;
  return v2ContentRepository.getChapter(identity);
}

/**
 * Refresh a downloaded chapter when online. On network/validation failure,
 * keeps the previous good copy on disk and returns it when present.
 */
export async function refreshDownloadedV2Chapter(identity: ChapterIdentity): Promise<V2Chapter> {
  const previous = getDownloadedV2Chapter(identity);
  try {
    const fresh = await v2ContentRepository.getChapter(identity);
    downloadV2Chapter(identity, fresh);
    return fresh;
  } catch (error) {
    if (previous) return previous;
    throw error;
  }
}
