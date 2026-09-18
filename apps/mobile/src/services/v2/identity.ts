/** Canonical publication identity for api/v2 payloads and local storage keys. */

export const V2_SCHEMA_VERSION = '2.0';

export type ChapterIdentity = {
  bookId: string;
  editionId: string;
  chapterId: string;
};

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidIdentityPart(value: string): boolean {
  return ID_PATTERN.test(value);
}

export function assertChapterIdentity(identity: ChapterIdentity): ChapterIdentity {
  const { bookId, editionId, chapterId } = identity;
  if (!isValidIdentityPart(bookId) || !isValidIdentityPart(editionId) || !isValidIdentityPart(chapterId)) {
    throw new Error(`Invalid chapter identity: ${bookId}/${editionId}/${chapterId}`);
  }
  return identity;
}

/** Collision-safe key for downloads, history, and progress — not a URL. */
export function canonicalChapterKey(identity: ChapterIdentity): string {
  const { bookId, editionId, chapterId } = assertChapterIdentity(identity);
  return `${bookId}/${editionId}/${chapterId}`;
}

export function parseCanonicalChapterKey(key: string): ChapterIdentity {
  const parts = key.split('/');
  if (parts.length !== 3) {
    throw new Error(`Invalid canonical chapter key: ${key}`);
  }
  return assertChapterIdentity({ bookId: parts[0], editionId: parts[1], chapterId: parts[2] });
}

/** Relative path under api/v2/ for a chapter payload. */
export function v2ChapterApiPath(identity: ChapterIdentity): string {
  const { bookId, editionId, chapterId } = assertChapterIdentity(identity);
  return `books/${bookId}/editions/${editionId}/chapters/${chapterId}.json`;
}

export function identitiesEqual(a: ChapterIdentity, b: ChapterIdentity): boolean {
  return a.bookId === b.bookId && a.editionId === b.editionId && a.chapterId === b.chapterId;
}
