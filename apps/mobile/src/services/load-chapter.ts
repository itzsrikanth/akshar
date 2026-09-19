import { contentRepository } from '@/services';
import type { Catalog, Chapter } from './content-repository';
import {
  downloadChapter,
  getDownloadedChapter,
  getDownloadedChapterHash,
  getDownloadedSlugsSnapshot,
  slugFromPath,
} from './downloads';

/**
 * Offline-first load with revision check: if a download exists and its stored
 * contentHash matches the catalog, return it; otherwise fetch, replace the
 * download when one existed, and return the network copy. On network failure,
 * keep the last-known-good download.
 */
export async function loadChapter(path: string): Promise<Chapter> {
  const slug = slugFromPath(path);
  const downloaded = getDownloadedChapter(slug);
  const storedHash = getDownloadedChapterHash(slug);

  let catalogHash: string | undefined;
  try {
    const catalog = await contentRepository.getCatalog();
    catalogHash = catalog.chapters.find((c) => c.path === path)?.contentHash;
  } catch {
    catalogHash = undefined;
  }

  if (downloaded && catalogHash && storedHash === catalogHash) {
    return downloaded;
  }

  try {
    const fresh = await contentRepository.getChapter(path);
    if (downloaded || getDownloadedChapter(slug)) {
      downloadChapter(slug, fresh, catalogHash);
    }
    return fresh;
  } catch (error) {
    if (downloaded) return downloaded;
    throw error;
  }
}

/**
 * After a catalog refresh, replace any downloaded chapter whose stored hash
 * does not match the catalog (including legacy files with no hash).
 */
export async function refreshStaleDownloads(catalog: Catalog): Promise<{ updated: number; failed: number; skipped: number }> {
  const slugs = getDownloadedSlugsSnapshot();
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const entry = catalog.chapters.find((c) => c.slug === slug || slugFromPath(c.path) === slug);
    if (!entry) {
      skipped += 1;
      continue;
    }
    const storedHash = getDownloadedChapterHash(slug);
    if (storedHash === entry.contentHash) {
      skipped += 1;
      continue;
    }
    try {
      const fresh = await contentRepository.getChapter(entry.path);
      downloadChapter(slug, fresh, entry.contentHash);
      updated += 1;
    } catch {
      failed += 1;
    }
  }

  return { updated, failed, skipped };
}
