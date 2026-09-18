import { CONTENT_BASE_URL } from '../config';
import { loadCachedV2Catalog, saveCachedV2Catalog } from './catalog-cache';
import { type ChapterIdentity, v2ChapterApiPath } from './identity';
import {
  type V2Catalog,
  type V2Chapter,
  validateV2Catalog,
  validateV2Chapter,
} from './types';

export interface V2ContentRepository {
  getCatalog(): Promise<V2Catalog>;
  getChapter(identity: ChapterIdentity): Promise<V2Chapter>;
  clearCache(): void;
  setBaseUrl(url: string): void;
}

/**
 * Reads api/v2/ catalogs and chapter payloads. Validates schema/identity before
 * returning; persists a last-known-good catalog and falls back to it when
 * refresh fails. Does not read or write v1 caches.
 */
export class V2CdnContentRepository implements V2ContentRepository {
  private chapterCache = new Map<string, Promise<V2Chapter>>();
  private catalogCache?: Promise<V2Catalog>;

  constructor(private baseUrl: string) {}

  setBaseUrl(url: string): void {
    if (url === this.baseUrl) return;
    this.baseUrl = url;
    this.clearCache();
  }

  clearCache(): void {
    this.chapterCache.clear();
    this.catalogCache = undefined;
  }

  private async fetchJson<T>(path: string, versionKey?: string): Promise<T> {
    const query = versionKey ? `v=${versionKey}` : `_cb=${Date.now()}`;
    const url = `${this.baseUrl}/api/v2/${path}${path.includes('?') ? '&' : '?'}${query}`;
    const res = await fetch(url, versionKey ? undefined : { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`V2ContentRepository: ${path} failed (${res.status})`);
    }
    return res.json() as Promise<T>;
  }

  getCatalog(): Promise<V2Catalog> {
    if (!this.catalogCache) {
      this.catalogCache = this.loadCatalogWithFallback();
      this.catalogCache.catch(() => {
        this.catalogCache = undefined;
      });
    }
    return this.catalogCache;
  }

  private async loadCatalogWithFallback(): Promise<V2Catalog> {
    const previous = await loadCachedV2Catalog();
    try {
      const remote = validateV2Catalog(await this.fetchJson<V2Catalog>('contents.json'));
      await saveCachedV2Catalog(remote);
      return remote;
    } catch (error) {
      if (previous) return previous;
      throw error;
    }
  }

  getChapter(identity: ChapterIdentity): Promise<V2Chapter> {
    const key = `${identity.bookId}/${identity.editionId}/${identity.chapterId}`;
    let cached = this.chapterCache.get(key);
    if (!cached) {
      cached = this.resolveContentHash(identity).then(async (versionKey) => {
        const payload = await this.fetchJson<V2Chapter>(v2ChapterApiPath(identity), versionKey);
        return validateV2Chapter(payload, identity);
      });
      this.chapterCache.set(key, cached);
      cached.catch(() => this.chapterCache.delete(key));
    }
    return cached;
  }

  private async resolveContentHash(identity: ChapterIdentity): Promise<string | undefined> {
    try {
      const catalog = await this.getCatalog();
      return catalog.chapters.find(
        (c) =>
          c.bookId === identity.bookId &&
          c.editionId === identity.editionId &&
          c.chapterId === identity.chapterId,
      )?.contentHash;
    } catch {
      return undefined;
    }
  }
}

export const v2ContentRepository: V2ContentRepository = new V2CdnContentRepository(CONTENT_BASE_URL);

export function setV2ContentBaseUrlForDev(url: string): void {
  (v2ContentRepository as V2CdnContentRepository).setBaseUrl(url);
}

export function invalidateV2ContentCache(): void {
  (v2ContentRepository as V2CdnContentRepository).clearCache();
}
