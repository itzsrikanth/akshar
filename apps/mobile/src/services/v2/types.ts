import type { ChapterSegment } from '../content-repository';
import type { ChapterIdentity } from './identity';
import { V2_SCHEMA_VERSION, identitiesEqual, isValidIdentityPart } from './identity';

export type V2LanguageRole = 'first-language' | 'second-language' | 'third-language';

export type V2Book = {
  id: string;
  title: string;
  publisher: { id: string; name: string };
  subjectLanguage: string;
  series?: { id: string; name: string };
  volume?: string;
  part?: number;
};

export type V2EditionChapterRef = {
  id: string;
  number: number;
  title?: string;
  held?: boolean;
};

export type V2Edition = {
  id: string;
  bookId: string;
  label: string;
  printedGrade: number;
  languageRole: V2LanguageRole;
  license: string;
  academicYears?: string[];
  chapters: V2EditionChapterRef[];
};

export type V2Adoption = {
  id: string;
  bookId: string;
  editionId: string;
  learnerGrade: number;
  subjectLanguage: string;
  languageRole: V2LanguageRole;
  schoolMedium?: string;
  region?: string;
  curriculum?: string;
  evidence?: string;
};

export type V2CatalogChapter = {
  bookId: string;
  editionId: string;
  chapterId: string;
  number: number;
  title: string;
  titleTranslations?: Record<string, string>;
  titleTransliterations?: Record<string, string>;
  path: string;
  contentHash: string;
  translations: string[];
  transliterations: string[];
};

export type V2Catalog = {
  schemaVersion: string;
  generatedAt: string;
  books: V2Book[];
  editions: V2Edition[];
  adoptions: V2Adoption[];
  chapters: V2CatalogChapter[];
};

export type V2Chapter = {
  schemaVersion: string;
  identity: ChapterIdentity & { number: number };
  meta: Record<string, unknown>;
  labels?: Record<string, Record<string, string>>;
  segments: ChapterSegment[];
};

/** Learner selection under the v2 model — separate from legacy board/medium/grade Scope. */
export type V2Selection = {
  adoptionId: string;
  bookId: string;
  editionId: string;
};

export function isV2Catalog(value: unknown): value is V2Catalog {
  if (!value || typeof value !== 'object') return false;
  const catalog = value as V2Catalog;
  return (
    catalog.schemaVersion === V2_SCHEMA_VERSION &&
    typeof catalog.generatedAt === 'string' &&
    Array.isArray(catalog.books) &&
    Array.isArray(catalog.editions) &&
    Array.isArray(catalog.adoptions) &&
    Array.isArray(catalog.chapters)
  );
}

export function validateV2Catalog(catalog: V2Catalog): V2Catalog {
  if (!isV2Catalog(catalog)) {
    throw new Error(`Unsupported v2 catalog schemaVersion: ${(catalog as V2Catalog)?.schemaVersion}`);
  }
  for (const chapter of catalog.chapters) {
    if (
      !isValidIdentityPart(chapter.bookId) ||
      !isValidIdentityPart(chapter.editionId) ||
      !isValidIdentityPart(chapter.chapterId) ||
      typeof chapter.contentHash !== 'string' ||
      !chapter.contentHash
    ) {
      throw new Error(`Invalid v2 catalog chapter entry: ${chapter.bookId}/${chapter.editionId}/${chapter.chapterId}`);
    }
  }
  return catalog;
}

export function validateV2Chapter(chapter: V2Chapter, expected: ChapterIdentity): V2Chapter {
  if (chapter.schemaVersion !== V2_SCHEMA_VERSION) {
    throw new Error(`Unsupported v2 chapter schemaVersion: ${chapter.schemaVersion}`);
  }
  if (!chapter.identity || !identitiesEqual(chapter.identity, expected)) {
    throw new Error(
      `Chapter identity mismatch: expected ${expected.bookId}/${expected.editionId}/${expected.chapterId}`,
    );
  }
  if (!Array.isArray(chapter.segments) || chapter.segments.length === 0) {
    throw new Error('v2 chapter has no segments');
  }
  return chapter;
}

export function catalogChapterIdentity(chapter: V2CatalogChapter): ChapterIdentity {
  return { bookId: chapter.bookId, editionId: chapter.editionId, chapterId: chapter.chapterId };
}
