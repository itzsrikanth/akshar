export {
  V2_SCHEMA_VERSION,
  type ChapterIdentity,
  assertChapterIdentity,
  canonicalChapterKey,
  identitiesEqual,
  isValidIdentityPart,
  parseCanonicalChapterKey,
  v2ChapterApiPath,
} from './identity';

export {
  type V2Adoption,
  type V2Book,
  type V2Catalog,
  type V2CatalogChapter,
  type V2Chapter,
  type V2Edition,
  type V2LanguageRole,
  type V2Selection,
  catalogChapterIdentity,
  isV2Catalog,
  validateV2Catalog,
  validateV2Chapter,
} from './types';

export {
  type V2ContentRepository,
  V2CdnContentRepository,
  invalidateV2ContentCache,
  setV2ContentBaseUrlForDev,
  v2ContentRepository,
} from './content-repository';

export { loadCachedV2Catalog, saveCachedV2Catalog } from './catalog-cache';

export {
  type AdoptionOption,
  adoptionDisplayLabel,
  chaptersForAdoption,
  findAdoptionOption,
  listAdoptionOptions,
  selectionFromAdoption,
} from './discovery';

export { hasCompletedV2Setup, setV2SetupCompleted } from './setup-state';

export {
  forceV2CatalogRefresh,
  getV2CatalogSnapshot,
  primeV2Catalog,
  subscribeToV2Catalog,
} from './catalog-store';

export {
  type V2ChapterHistoryEntry,
  historyEntryIdentity,
  historyEntryKey,
  loadV2ReadingHistory,
  recordV2ChapterOpened,
} from './reading-history';

export { loadV2Selection, saveV2Selection } from './selection-storage';

export {
  clearDownloadedV2Chapters,
  deleteV2Chapter,
  downloadV2Chapter,
  downloadedKeyToIdentity,
  getDownloadedV2Chapter,
  getDownloadedV2KeysSnapshot,
  identityToDownloadedKey,
  isV2Downloaded,
  subscribeToV2Downloads,
} from './downloads';

export { loadV2Chapter, refreshDownloadedV2Chapter } from './use-chapter-support';
