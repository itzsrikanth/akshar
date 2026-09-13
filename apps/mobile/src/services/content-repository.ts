// Shapes match api/contents.json and a compiled per-chapter JSON exactly —
// see AGENTS.md and scripts/build_json.py at the repo root. Kept here
// rather than imported from a schema package so this file has no build-time
// dependency on the content repo's own tooling.

import { normalizeCatalog } from './catalog-compatibility';

export type CatalogChapter = {
  board: string;
  state: string;
  medium: string;
  grade: number;
  subject: string;
  chapter: number;
  slug: string;
  title: string;
  titleTranslations?: Record<string, string>;
  titleTransliterations?: Record<string, string>;
  path: string;
  contentHash: string;
  translations: string[];
  transliterations: string[];
};

export type Catalog = {
  schemaVersion: string;
  /** ISO timestamp — only bumps when scripts/build_json.py's output actually changes (see the script). */
  generatedAt: string;
  chapters: CatalogChapter[];
};

export type ChapterSegment = {
  id: string;
  type: string;
  text: string;
  section?: string;
  stanza?: number;
  exercise?: string;
  ref?: string;
  speaker?: string;
  translations?: Record<string, string>;
  transliterations?: Record<string, string>;
};

export type Chapter = {
  schemaVersion: string;
  meta: {
    board: string;
    state: string;
    medium: string;
    grade: number;
    subject: string;
    chapter: number;
    slug: string;
    title: string;
    source_url: string;
    license: string;
    original_publisher: string;
  };
  labels?: Record<string, Record<string, string>>;
  segments: ChapterSegment[];
};

export interface ContentRepository {
  getCatalog(): Promise<Catalog>;
  /** `path` matches a `CatalogChapter.path`, e.g. "KSEEB/Karnataka/English/Grade5/Kannada/ch01-bannada-tagadina.json" */
  getChapter(path: string): Promise<Chapter>;
}

/**
 * Reads straight from the content repo's compiled `api/` JSON — over
 * jsDelivr in production, over a local dev server in development (see
 * `config.ts`). No download/offline layer yet (docs/tech-implementation.md
 * covers that as a later phase) — every call is a live fetch.
 */
export class CdnContentRepository implements ContentRepository {
  private chapterCache = new Map<string, Promise<Chapter>>();
  private catalogCache?: Promise<Catalog>;

  constructor(private baseUrl: string) {}

  /** Dev-only escape hatch (see services/dev-settings.ts) — swaps the source and drops in-memory caches so nothing stale lingers from the old one. */
  setBaseUrl(url: string): void {
    if (url === this.baseUrl) return;
    this.baseUrl = url;
    this.clearCache();
  }

  /** Drops the in-memory catalog/chapter caches so the next call re-fetches — used by a manual pull-to-refresh (see catalog-store.ts's forceCatalogRefresh). Doesn't touch the CDN itself, so a jsDelivr edge that hasn't picked up a recent push yet can still return stale content. */
  clearCache(): void {
    this.chapterCache.clear();
    this.catalogCache = undefined;
  }

  // jsDelivr sends Cache-Control: max-age=604800 (7 days) — sized for its own CDN edges
  // (s-maxage=43200 there), but the same header makes the OS's HTTP cache serve a week-old
  // response transparently, invisible to and unaffected by our own cache invalidation
  // (setBaseUrl/clearCache, pull-to-refresh) and by purging jsDelivr's edge cache — neither
  // touches what's already sitting in the device's local HTTP cache. We already do
  // session-scoped caching ourselves (chapterCache/catalogCache), so there's no need for a
  // second, much longer-lived cache underneath it working against content freshness.
  //
  // `versionKey`, when available (a chapter's contentHash — see scripts/build_json.py),
  // is a far better fix than blanket-busting every request: it only changes when that
  // chapter's actual content changes, so the resulting URL is safe to cache aggressively —
  // both jsDelivr's edge and the device benefit from real caching, and a real content change
  // still produces a real cache miss automatically, no purge needed. Without one (api/
  // contents.json has no hash of its own — it changes whenever any chapter does), fall back
  // to timestamp-busting + no-store, same as before.
  private async fetchJson<T>(path: string, versionKey?: string): Promise<T> {
    const query = versionKey ? `v=${versionKey}` : `_cb=${Date.now()}`;
    const url = `${this.baseUrl}/${path}${path.includes('?') ? '&' : '?'}${query}`;
    const res = await fetch(url, versionKey ? undefined : { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`ContentRepository: ${path} failed (${res.status})`);
    }
    return res.json() as Promise<T>;
  }

  getCatalog(): Promise<Catalog> {
    if (!this.catalogCache) {
      this.catalogCache = this.fetchJson<Catalog>('api/contents.json').then(normalizeCatalog);
      // Don't cache a rejected fetch — a transient network error shouldn't
      // permanently poison the catalog for the rest of the session.
      this.catalogCache.catch(() => {
        this.catalogCache = undefined;
      });
    }
    return this.catalogCache;
  }

  getChapter(path: string): Promise<Chapter> {
    let cached = this.chapterCache.get(path);
    if (!cached) {
      cached = this.resolveContentHash(path).then((versionKey) => this.fetchJson<Chapter>(`api/${path}`, versionKey));
      this.chapterCache.set(path, cached);
      // Don't cache a rejected fetch — a transient network error shouldn't
      // permanently poison this path for the rest of the session.
      cached.catch(() => this.chapterCache.delete(path));
    }
    return cached;
  }

  /** Looks up a chapter's contentHash from the catalog for version-keyed caching (see
   *  fetchJson) — falls back to undefined (timestamp-busting) if the catalog fetch itself
   *  fails or the path isn't found there, rather than blocking the chapter fetch on it. */
  private async resolveContentHash(path: string): Promise<string | undefined> {
    try {
      const catalog = await this.getCatalog();
      return catalog.chapters.find((c) => c.path === path)?.contentHash;
    } catch {
      return undefined;
    }
  }
}
