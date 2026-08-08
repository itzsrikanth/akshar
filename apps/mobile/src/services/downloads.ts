// Real per-chapter offline storage using SDK 57's File/Directory API (the
// old FileSystem.*Async functions moved to 'expo-file-system/legacy' — see
// AGENTS.md's "Expo HAS CHANGED" note). This is separate from
// CdnContentRepository's in-memory fetch cache, which clears on restart:
// files written here persist across app launches, which is what makes
// "downloaded" in Library/Explore true instead of a hardcoded placeholder.
import { Directory, File, Paths } from 'expo-file-system';

import type { Chapter } from './content-repository';

const downloadsDir = new Directory(Paths.document, 'chapters');

function fileFor(slug: string): File {
  return new File(downloadsDir, `${slug}.json`);
}

export function isDownloaded(slug: string): boolean {
  return fileFor(slug).exists;
}

export function listDownloadedSlugs(): string[] {
  if (!downloadsDir.exists) return [];
  return downloadsDir
    .list()
    .filter((entry): entry is File => entry instanceof File && entry.name.endsWith('.json'))
    .map((file) => file.name.replace(/\.json$/, ''));
}

export function downloadChapter(slug: string, chapter: Chapter): void {
  if (!downloadsDir.exists) downloadsDir.create({ intermediates: true, idempotent: true });
  const file = fileFor(slug);
  if (!file.exists) file.create({ overwrite: true });
  file.write(JSON.stringify(chapter));
}

export function deleteChapter(slug: string): void {
  const file = fileFor(slug);
  if (file.exists) file.delete();
}

export function getDownloadedChapter(slug: string): Chapter | null {
  const file = fileFor(slug);
  if (!file.exists) return null;
  return JSON.parse(file.textSync()) as Chapter;
}

/** A chapter's `path` (e.g. ".../ch01-bannada-tagadina.json") always ends in `<slug>.json`. */
export function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.json$/, '');
}
