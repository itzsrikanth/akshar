// Shapes match api/contents.json and a compiled per-chapter JSON exactly —
// see AGENTS.md and scripts/build_json.py at the repo root. Kept here
// rather than imported from a schema package so this file has no build-time
// dependency on the content repo's own tooling.

export type CatalogChapter = {
  board: string;
  state: string;
  medium: string;
  grade: number;
  subject: string;
  chapter: number;
  slug: string;
  title: string;
  path: string;
  contentHash: string;
  translations: string[];
  transliterations: string[];
};

export type Catalog = {
  schemaVersion: string;
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

  private async fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}/${path}`);
    if (!res.ok) {
      throw new Error(`ContentRepository: ${path} failed (${res.status})`);
    }
    return res.json() as Promise<T>;
  }

  getCatalog(): Promise<Catalog> {
    if (!this.catalogCache) {
      this.catalogCache = this.fetchJson<Catalog>('api/contents.json');
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
      cached = this.fetchJson<Chapter>(`api/${path}`);
      this.chapterCache.set(path, cached);
      // Don't cache a rejected fetch — a transient network error shouldn't
      // permanently poison this path for the rest of the session.
      cached.catch(() => this.chapterCache.delete(path));
    }
    return cached;
  }
}
