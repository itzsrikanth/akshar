// Offline chapter bodies keyed by canonical (bookId, editionId, chapterId).
// Uses a separate document directory from v1 `chapters/` so slug collisions
// across books cannot overwrite files, and old downloads stay untouched.
//
// Directory construction is lazy: Expo's web FileSystem stub lacks
// validatePath(), so a top-level `new Directory(Paths.document, …)` crashes
// Metro/app boot when this module is imported via the v2 barrel.
import { Directory, File } from 'expo-file-system';

import { isLocalDataResetting } from '../local-reset-state';
import {
  childDirectory,
  childFile,
  documentSubdir,
  memoryClearPrefix,
  memoryDelete,
  memoryHas,
  memoryList,
  memoryRead,
  memoryWrite,
} from '../chapter-fs';
import { downloadLexiconInBackground } from '../lexicon';
import {
  type ChapterIdentity,
  assertChapterIdentity,
  canonicalChapterKey,
  parseCanonicalChapterKey,
} from './identity';
import { type V2Chapter, validateV2Chapter } from './types';

const DIR_NAME = 'chapters-v2';
const MEMORY_PREFIX = 'chapters-v2';

/** On-disk envelope — older installs may still have a bare V2Chapter JSON. */
type StoredV2Download = { contentHash: string; chapter: V2Chapter };

let downloadsDir: Directory | null | undefined;

function getDownloadsDir(): Directory | null {
  if (downloadsDir === undefined) downloadsDir = documentSubdir(DIR_NAME);
  return downloadsDir;
}

function fileFor(identity: ChapterIdentity): File | null {
  const root = getDownloadsDir();
  if (!root) return null;
  const { bookId, editionId, chapterId } = assertChapterIdentity(identity);
  const bookDir = childDirectory(root, bookId);
  const editionDir = childDirectory(bookDir, editionId);
  return childFile(editionDir, `${chapterId}.json`);
}

function memoryPath(identity: ChapterIdentity): string {
  const { bookId, editionId, chapterId } = assertChapterIdentity(identity);
  return `${MEMORY_PREFIX}/${bookId}/${editionId}/${chapterId}.json`;
}

function ensureParent(identity: ChapterIdentity): Directory | null {
  const root = getDownloadsDir();
  if (!root) return null;
  const { bookId, editionId } = assertChapterIdentity(identity);
  if (!root.exists) root.create({ intermediates: true, idempotent: true });
  const bookDir = childDirectory(root, bookId);
  if (!bookDir.exists) bookDir.create({ intermediates: true, idempotent: true });
  const editionDir = childDirectory(bookDir, editionId);
  if (!editionDir.exists) editionDir.create({ intermediates: true, idempotent: true });
  return editionDir;
}

function isStoredV2Download(value: unknown): value is StoredV2Download {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.contentHash === 'string' && record.chapter != null && typeof record.chapter === 'object';
}

function readStored(identity: ChapterIdentity): { contentHash: string | null; chapter: V2Chapter } | null {
  const file = fileFor(identity);
  let raw: string | null = null;
  if (file) {
    if (!file.exists) return null;
    raw = file.textSync();
  } else {
    raw = memoryRead(memoryPath(identity));
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isStoredV2Download(parsed)) {
      return {
        contentHash: parsed.contentHash,
        chapter: validateV2Chapter(parsed.chapter, identity),
      };
    }
    return {
      contentHash: null,
      chapter: validateV2Chapter(parsed as V2Chapter, identity),
    };
  } catch {
    return null;
  }
}

function listKeysFromDisk(): string[] {
  const root = getDownloadsDir();
  if (root) {
    if (!root.exists) return [];
    const keys: string[] = [];
    for (const bookEntry of root.list()) {
      if (!(bookEntry instanceof Directory)) continue;
      for (const editionEntry of bookEntry.list()) {
        if (!(editionEntry instanceof Directory)) continue;
        for (const file of editionEntry.list()) {
          if (!(file instanceof File) || !file.name.endsWith('.json') || file.name.endsWith('.tmp.json')) continue;
          keys.push(`${bookEntry.name}/${editionEntry.name}/${file.name.replace(/\.json$/, '')}`);
        }
      }
    }
    return keys.sort();
  }

  return memoryList(MEMORY_PREFIX)
    .filter((rel) => rel.endsWith('.json') && !rel.endsWith('.tmp.json'))
    .map((rel) => rel.replace(/\.json$/, ''))
    .sort();
}

let snapshot: string[] | null = null;
const listeners = new Set<() => void>();

function invalidate(): void {
  snapshot = null;
  listeners.forEach((listener) => listener());
}

export function subscribeToV2Downloads(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDownloadedV2KeysSnapshot(): string[] {
  if (snapshot === null) snapshot = listKeysFromDisk();
  return snapshot;
}

export function isV2Downloaded(identity: ChapterIdentity): boolean {
  const file = fileFor(identity);
  if (file) return file.exists;
  return memoryHas(memoryPath(identity));
}

/**
 * Persist a validated chapter. Writes via a temporary sibling file, then
 * replaces the target only after validation — keeps the previous good copy
 * if the new payload is rejected.
 */
export function downloadV2Chapter(identity: ChapterIdentity, chapter: V2Chapter, contentHash?: string): void {
  if (isLocalDataResetting()) throw new Error('Local data is being reset. Restart the app before downloading.');
  const validated = validateV2Chapter(chapter, identity);
  const payload: StoredV2Download | V2Chapter =
    contentHash && contentHash.length > 0 ? { contentHash, chapter: validated } : validated;
  const raw = JSON.stringify(payload);

  const editionDir = ensureParent(identity);
  if (editionDir) {
    const { chapterId } = assertChapterIdentity(identity);
    const target = childFile(editionDir, `${chapterId}.json`);
    const temp = childFile(editionDir, `${chapterId}.tmp.json`);
    if (!temp.exists) temp.create({ overwrite: true });
    temp.write(raw);
    try {
      const parsed = JSON.parse(temp.textSync()) as unknown;
      const chapterBody = isStoredV2Download(parsed) ? parsed.chapter : (parsed as V2Chapter);
      validateV2Chapter(chapterBody, identity);
    } catch (error) {
      if (temp.exists) temp.delete();
      throw error;
    }
    if (target.exists) target.delete();
    if (!target.exists) target.create({ overwrite: true });
    target.write(temp.textSync());
    if (temp.exists) temp.delete();
  } else {
    memoryWrite(memoryPath(identity), raw);
  }
  downloadLexiconInBackground('kn');
  invalidate();
}

export function deleteV2Chapter(identity: ChapterIdentity): void {
  const file = fileFor(identity);
  if (file) {
    if (file.exists) file.delete();
  } else {
    memoryDelete(memoryPath(identity));
  }
  invalidate();
}

export function clearDownloadedV2Chapters(): void {
  if (!__DEV__) throw new Error('Clearing all v2 downloads is only available in development builds.');
  const dir = getDownloadsDir();
  if (dir?.exists) dir.delete();
  memoryClearPrefix(MEMORY_PREFIX);
  invalidate();
}

export function getDownloadedV2Chapter(identity: ChapterIdentity): V2Chapter | null {
  return readStored(identity)?.chapter ?? null;
}

export function getDownloadedV2ChapterHash(identity: ChapterIdentity): string | null {
  return readStored(identity)?.contentHash ?? null;
}

export function downloadedKeyToIdentity(key: string): ChapterIdentity {
  return parseCanonicalChapterKey(key);
}

export function identityToDownloadedKey(identity: ChapterIdentity): string {
  return canonicalChapterKey(identity);
}
