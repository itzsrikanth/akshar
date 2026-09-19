import { getDownloadedV2Chapter, getDownloadedV2ChapterHash, downloadV2Chapter, getDownloadedV2KeysSnapshot, downloadedKeyToIdentity } from './downloads';
import { v2ContentRepository } from './content-repository';
import type { ChapterIdentity } from './identity';
import type { V2Catalog, V2Chapter } from './types';

/**
 * Offline-first load with revision check against the v2 catalog contentHash.
 * On network/validation failure, keeps the previous good copy when present.
 */
export async function loadV2Chapter(identity: ChapterIdentity): Promise<V2Chapter> {
  const downloaded = getDownloadedV2Chapter(identity);
  const storedHash = getDownloadedV2ChapterHash(identity);

  let catalogHash: string | undefined;
  try {
    const catalog = await v2ContentRepository.getCatalog();
    catalogHash = catalog.chapters.find(
      (c) =>
        c.bookId === identity.bookId &&
        c.editionId === identity.editionId &&
        c.chapterId === identity.chapterId,
    )?.contentHash;
  } catch {
    catalogHash = undefined;
  }

  if (downloaded && catalogHash && storedHash === catalogHash) {
    return downloaded;
  }

  try {
    const fresh = await v2ContentRepository.getChapter(identity);
    if (downloaded || getDownloadedV2Chapter(identity)) {
      downloadV2Chapter(identity, fresh, catalogHash);
    }
    return fresh;
  } catch (error) {
    if (downloaded) return downloaded;
    throw error;
  }
}

/**
 * Refresh a downloaded chapter when online. On network/validation failure,
 * keeps the previous good copy on disk and returns it when present.
 */
export async function refreshDownloadedV2Chapter(identity: ChapterIdentity, contentHash?: string): Promise<V2Chapter> {
  const previous = getDownloadedV2Chapter(identity);
  try {
    const fresh = await v2ContentRepository.getChapter(identity);
    let hash = contentHash;
    if (!hash) {
      try {
        const catalog = await v2ContentRepository.getCatalog();
        hash = catalog.chapters.find(
          (c) =>
            c.bookId === identity.bookId &&
            c.editionId === identity.editionId &&
            c.chapterId === identity.chapterId,
        )?.contentHash;
      } catch {
        hash = undefined;
      }
    }
    downloadV2Chapter(identity, fresh, hash);
    return fresh;
  } catch (error) {
    if (previous) return previous;
    throw error;
  }
}

/**
 * After a catalog refresh, replace downloaded chapters whose stored hash
 * does not match (including legacy files with no hash).
 */
export async function refreshStaleV2Downloads(catalog: V2Catalog): Promise<{ updated: number; failed: number; skipped: number }> {
  const keys = getDownloadedV2KeysSnapshot();
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const key of keys) {
    const identity = downloadedKeyToIdentity(key);
    const entry = catalog.chapters.find(
      (c) =>
        c.bookId === identity.bookId &&
        c.editionId === identity.editionId &&
        c.chapterId === identity.chapterId,
    );
    if (!entry) {
      skipped += 1;
      continue;
    }
    const storedHash = getDownloadedV2ChapterHash(identity);
    if (storedHash === entry.contentHash) {
      skipped += 1;
      continue;
    }
    try {
      await refreshDownloadedV2Chapter(identity, entry.contentHash);
      updated += 1;
    } catch {
      failed += 1;
    }
  }

  return { updated, failed, skipped };
}
