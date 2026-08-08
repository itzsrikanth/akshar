import { CONTENT_BASE_URL } from './config';
import { CdnContentRepository, type ContentRepository } from './content-repository';

// The one place a concrete implementation gets constructed — screens import
// `contentRepository` from here, never `CdnContentRepository` directly (see
// docs/tech-implementation.md's "No-backend architecture" section). Adding
// a real backend later means adding `BackendContentRepository` and changing
// this one line; nothing else moves.
export const contentRepository: ContentRepository = new CdnContentRepository(CONTENT_BASE_URL);

export type { Catalog, CatalogChapter, Chapter, ChapterSegment, ContentRepository } from './content-repository';
