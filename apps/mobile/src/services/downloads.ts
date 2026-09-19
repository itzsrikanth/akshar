// Real per-chapter offline storage using SDK 57's File/Directory API (the
// old FileSystem.*Async functions moved to 'expo-file-system/legacy' — see
// AGENTS.md's "Expo HAS CHANGED" note). This is separate from
// CdnContentRepository's in-memory fetch cache, which clears on restart:
// files written here persist across app launches, which is what makes
// "downloaded" in Library/Explore true instead of a hardcoded placeholder.
//
// Directory construction is lazy: Expo's web FileSystem stub lacks
// validatePath(), so a top-level `new Directory(Paths.document, …)` crashes
// Metro/app boot when this module is imported via the v2 barrel.
import type { Directory } from 'expo-file-system';
import { File } from 'expo-file-system';

import type { Chapter } from './content-repository';
import {
  childFile,
  documentSubdir,
  memoryClearPrefix,
  memoryDelete,
  memoryHas,
  memoryList,
  memoryRead,
  memoryWrite,
} from './chapter-fs';
import { downloadLexiconInBackground } from './lexicon';
import { isLocalDataResetting } from './local-reset-state';

const DIR_NAME = 'chapters';
const MEMORY_PREFIX = 'chapters';

/** On-disk envelope — older installs may still have a bare Chapter JSON. */
type StoredDownload = { contentHash: string; chapter: Chapter };

let downloadsDir: Directory | null | undefined;

function getDownloadsDir(): Directory | null {
  if (downloadsDir === undefined) downloadsDir = documentSubdir(DIR_NAME);
  return downloadsDir;
}

function fileFor(slug: string): File | null {
  const dir = getDownloadsDir();
  if (!dir) return null;
  return childFile(dir, `${slug}.json`);
}

function memoryPath(slug: string): string {
  return `${MEMORY_PREFIX}/${slug}.json`;
}

function isStoredDownload(value: unknown): value is StoredDownload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.contentHash === 'string' && record.chapter != null && typeof record.chapter === 'object';
}

function parseStored(raw: string): { contentHash: string | null; chapter: Chapter } | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isStoredDownload(parsed)) {
      return { contentHash: parsed.contentHash, chapter: parsed.chapter };
    }
    return { contentHash: null, chapter: parsed as Chapter };
  } catch {
    return null;
  }
}

function readStored(slug: string): { contentHash: string | null; chapter: Chapter } | null {
  const file = fileFor(slug);
  if (file) {
    if (!file.exists) return null;
    return parseStored(file.textSync());
  }
  const raw = memoryRead(memoryPath(slug));
  return raw ? parseStored(raw) : null;
}

function listSlugsFromDisk(): string[] {
  const dir = getDownloadsDir();
  if (dir) {
    if (!dir.exists) return [];
    return dir
      .list()
      .filter((entry): entry is File => entry instanceof File && entry.name.endsWith('.json'))
      .map((file) => file.name.replace(/\.json$/, ''));
  }
  return memoryList(MEMORY_PREFIX)
    .filter((rel) => rel.endsWith('.json') && !rel.includes('/'))
    .map((rel) => rel.replace(/\.json$/, ''));
}

// A single in-memory snapshot shared across every useDownloads() call —
// Explore and Library each mount their own hook instance, and React
// Navigation keeps both tabs mounted, so without a shared store a download
// made in one tab silently wouldn't appear in the other until it happened
// to remount. useSyncExternalStore (hooks/use-downloads.ts) needs a
// snapshot that's referentially stable between real changes, hence a cache
// invalidated on write rather than re-reading the directory every render.
let snapshot: string[] | null = null;
const listeners = new Set<() => void>();

function invalidate(): void {
  snapshot = null;
  listeners.forEach((listener) => listener());
}

export function subscribeToDownloads(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDownloadedSlugsSnapshot(): string[] {
  if (snapshot === null) snapshot = listSlugsFromDisk();
  return snapshot;
}

export function isDownloaded(slug: string): boolean {
  const file = fileFor(slug);
  if (file) return file.exists;
  return memoryHas(memoryPath(slug));
}

export function downloadChapter(slug: string, chapter: Chapter, contentHash?: string): void {
  if (isLocalDataResetting()) throw new Error('Local data is being reset. Restart the app before downloading.');
  const payload: StoredDownload | Chapter =
    contentHash && contentHash.length > 0 ? { contentHash, chapter } : chapter;
  const raw = JSON.stringify(payload);

  const dir = getDownloadsDir();
  if (dir) {
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const file = childFile(dir, `${slug}.json`);
    if (!file.exists) file.create({ overwrite: true });
    file.write(raw);
  } else {
    memoryWrite(memoryPath(slug), raw);
  }
  downloadLexiconInBackground('kn');
  invalidate();
}

export function deleteChapter(slug: string): void {
  const file = fileFor(slug);
  if (file) {
    if (file.exists) file.delete();
  } else {
    memoryDelete(memoryPath(slug));
  }
  invalidate();
}

export function clearDownloadedChapters(): void {
  if (!__DEV__) throw new Error('Clearing all downloads is only available in development builds.');
  removeDownloadsDirectory();
}

/** Explicit post-migration cleanup — allowed outside __DEV__. */
export function clearDownloadedChaptersForMigration(): void {
  removeDownloadsDirectory();
}

function removeDownloadsDirectory(): void {
  const dir = getDownloadsDir();
  if (dir?.exists) dir.delete();
  memoryClearPrefix(MEMORY_PREFIX);
  invalidate();
}

export function getDownloadedChapter(slug: string): Chapter | null {
  return readStored(slug)?.chapter ?? null;
}

/** Catalog revision stored with the download, or null for legacy bare files. */
export function getDownloadedChapterHash(slug: string): string | null {
  return readStored(slug)?.contentHash ?? null;
}

/** A chapter's `path` (e.g. ".../ch01-bannada-tagadina.json") always ends in `<slug>.json`. */
export function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.json$/, '');
}
