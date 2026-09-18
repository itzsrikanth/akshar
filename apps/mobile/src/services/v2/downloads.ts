// Offline chapter bodies keyed by canonical (bookId, editionId, chapterId).
// Uses a separate document directory from v1 `chapters/` so slug collisions
// across books cannot overwrite files, and old downloads stay untouched.
import { Directory, File, Paths } from 'expo-file-system';

import { isLocalDataResetting } from '../local-reset-state';
import {
  type ChapterIdentity,
  assertChapterIdentity,
  canonicalChapterKey,
  parseCanonicalChapterKey,
} from './identity';
import { type V2Chapter, validateV2Chapter } from './types';

const downloadsDir = new Directory(Paths.document, 'chapters-v2');

function fileFor(identity: ChapterIdentity): File {
  const { bookId, editionId, chapterId } = assertChapterIdentity(identity);
  const bookDir = new Directory(downloadsDir, bookId);
  const editionDir = new Directory(bookDir, editionId);
  return new File(editionDir, `${chapterId}.json`);
}

function ensureParent(identity: ChapterIdentity): void {
  const { bookId, editionId } = assertChapterIdentity(identity);
  if (!downloadsDir.exists) downloadsDir.create({ intermediates: true, idempotent: true });
  const bookDir = new Directory(downloadsDir, bookId);
  if (!bookDir.exists) bookDir.create({ intermediates: true, idempotent: true });
  const editionDir = new Directory(bookDir, editionId);
  if (!editionDir.exists) editionDir.create({ intermediates: true, idempotent: true });
}

function listKeysFromDisk(): string[] {
  if (!downloadsDir.exists) return [];
  const keys: string[] = [];
  for (const bookEntry of downloadsDir.list()) {
    if (!(bookEntry instanceof Directory)) continue;
    for (const editionEntry of bookEntry.list()) {
      if (!(editionEntry instanceof Directory)) continue;
      for (const file of editionEntry.list()) {
        if (!(file instanceof File) || !file.name.endsWith('.json')) continue;
        keys.push(`${bookEntry.name}/${editionEntry.name}/${file.name.replace(/\.json$/, '')}`);
      }
    }
  }
  return keys.sort();
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
  return fileFor(identity).exists;
}

/**
 * Persist a validated chapter. Writes via a temporary sibling file, then
 * replaces the target only after validation — keeps the previous good copy
 * if the new payload is rejected.
 */
export function downloadV2Chapter(identity: ChapterIdentity, chapter: V2Chapter): void {
  if (isLocalDataResetting()) throw new Error('Local data is being reset. Restart the app before downloading.');
  const validated = validateV2Chapter(chapter, identity);
  ensureParent(identity);
  const target = fileFor(identity);
  const { bookId, editionId, chapterId } = assertChapterIdentity(identity);
  const editionDir = new Directory(new Directory(downloadsDir, bookId), editionId);
  const temp = new File(editionDir, `${chapterId}.tmp.json`);
  if (!temp.exists) temp.create({ overwrite: true });
  temp.write(JSON.stringify(validated));
  try {
    const parsed = JSON.parse(temp.textSync()) as V2Chapter;
    validateV2Chapter(parsed, identity);
  } catch (error) {
    if (temp.exists) temp.delete();
    throw error;
  }
  if (target.exists) target.delete();
  // expo-file-system File has no rename; write final then remove temp.
  if (!target.exists) target.create({ overwrite: true });
  target.write(temp.textSync());
  if (temp.exists) temp.delete();
  invalidate();
}

export function deleteV2Chapter(identity: ChapterIdentity): void {
  const file = fileFor(identity);
  if (file.exists) file.delete();
  invalidate();
}

export function clearDownloadedV2Chapters(): void {
  if (!__DEV__) throw new Error('Clearing all v2 downloads is only available in development builds.');
  if (downloadsDir.exists) downloadsDir.delete();
  invalidate();
}

export function getDownloadedV2Chapter(identity: ChapterIdentity): V2Chapter | null {
  const file = fileFor(identity);
  if (!file.exists) return null;
  try {
    return validateV2Chapter(JSON.parse(file.textSync()) as V2Chapter, identity);
  } catch {
    // Corrupt download must not poison the session — treat as missing.
    return null;
  }
}

export function downloadedKeyToIdentity(key: string): ChapterIdentity {
  return parseCanonicalChapterKey(key);
}

export function identityToDownloadedKey(identity: ChapterIdentity): string {
  return canonicalChapterKey(identity);
}
