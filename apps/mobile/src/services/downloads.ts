// Real per-chapter offline storage using SDK 57's File/Directory API (the
// old FileSystem.*Async functions moved to 'expo-file-system/legacy' — see
// AGENTS.md's "Expo HAS CHANGED" note). This is separate from
// CdnContentRepository's in-memory fetch cache, which clears on restart:
// files written here persist across app launches, which is what makes
// "downloaded" in Library/Explore true instead of a hardcoded placeholder.
import { Directory, File, Paths } from 'expo-file-system';

import type { Chapter } from './content-repository';
import { isLocalDataResetting } from './local-reset-state';

const downloadsDir = new Directory(Paths.document, 'chapters');

/** On-disk envelope — older installs may still have a bare Chapter JSON. */
type StoredDownload = { contentHash: string; chapter: Chapter };

function fileFor(slug: string): File {
  return new File(downloadsDir, `${slug}.json`);
}

function isStoredDownload(value: unknown): value is StoredDownload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.contentHash === 'string' && record.chapter != null && typeof record.chapter === 'object';
}

function readStored(slug: string): { contentHash: string | null; chapter: Chapter } | null {
  const file = fileFor(slug);
  if (!file.exists) return null;
  const parsed = JSON.parse(file.textSync()) as unknown;
  if (isStoredDownload(parsed)) {
    return { contentHash: parsed.contentHash, chapter: parsed.chapter };
  }
  // Legacy bare chapter JSON — no revision metadata; treat as unknown hash.
  return { contentHash: null, chapter: parsed as Chapter };
}

function listSlugsFromDisk(): string[] {
  if (!downloadsDir.exists) return [];
  return downloadsDir
    .list()
    .filter((entry): entry is File => entry instanceof File && entry.name.endsWith('.json'))
    .map((file) => file.name.replace(/\.json$/, ''));
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
  return fileFor(slug).exists;
}

export function downloadChapter(slug: string, chapter: Chapter, contentHash?: string): void {
  if (isLocalDataResetting()) throw new Error('Local data is being reset. Restart the app before downloading.');
  if (!downloadsDir.exists) downloadsDir.create({ intermediates: true, idempotent: true });
  const file = fileFor(slug);
  if (!file.exists) file.create({ overwrite: true });
  const payload: StoredDownload | Chapter =
    contentHash && contentHash.length > 0 ? { contentHash, chapter } : chapter;
  file.write(JSON.stringify(payload));
  invalidate();
}

export function deleteChapter(slug: string): void {
  const file = fileFor(slug);
  if (file.exists) file.delete();
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
  if (downloadsDir.exists) downloadsDir.delete();
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
