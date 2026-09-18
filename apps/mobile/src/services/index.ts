import { CONTENT_BASE_URL } from './config';
import { CdnContentRepository, type ContentRepository } from './content-repository';
import { invalidateV2ContentCache, setV2ContentBaseUrlForDev } from './v2';

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
  setV2ContentBaseUrlForDev(url);
}

// Used by a manual pull-to-refresh (see catalog-store.ts's forceCatalogRefresh)
// — getCatalog()/getChapter() otherwise cache their first resolved fetch for
// the rest of the app session, so a refresh needs to drop that first.
export function invalidateContentCache(): void {
  (contentRepository as CdnContentRepository).clearCache();
  invalidateV2ContentCache();
}

export type { Catalog, CatalogChapter, Chapter, ChapterSegment, ContentRepository } from './content-repository';

// v2 publication-identity layer (api/v2). Live UI still uses v1 above until
// the setup/reselection flow lands; these exports are the storage/network
// contracts for that cutover.
export {
  V2_SCHEMA_VERSION,
  type ChapterIdentity,
  type V2Catalog,
  type V2CatalogChapter,
  type V2Chapter,
  type V2Selection,
  canonicalChapterKey,
  loadV2Chapter,
  loadV2Selection,
  saveV2Selection,
  v2ContentRepository,
} from './v2';
export { invalidateV2ContentCache, setV2ContentBaseUrlForDev } from './v2';
