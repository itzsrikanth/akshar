import { CONTENT_BASE_URL } from './config';
import { CdnContentRepository, type ContentRepository } from './content-repository';

// The one place a concrete implementation gets constructed — screens import
// `contentRepository` from here, never `CdnContentRepository` directly (see
// docs/tech-implementation.md's "No-backend architecture" section). Adding
// a real backend later means adding `BackendContentRepository` and changing
// this one line; nothing else moves.
export const contentRepository: ContentRepository = new CdnContentRepository(CONTENT_BASE_URL);

// Dev-only escape hatch (see services/dev-settings.ts + app/dev-settings.tsx)
// — kept as a function, rather than exporting the concrete class, so normal
// screens only ever see the ContentRepository interface.
export function setContentBaseUrlForDev(url: string): void {
  (contentRepository as CdnContentRepository).setBaseUrl(url);
}

// Used by a manual pull-to-refresh (see catalog-store.ts's forceCatalogRefresh)
// — getCatalog()/getChapter() otherwise cache their first resolved fetch for
// the rest of the app session, so a refresh needs to drop that first.
export function invalidateContentCache(): void {
  (contentRepository as CdnContentRepository).clearCache();
}

export type { Catalog, CatalogChapter, Chapter, ChapterSegment, ContentRepository } from './content-repository';
