import AsyncStorage from '@react-native-async-storage/async-storage';

import { isLocalDataResetting } from '../local-reset-state';
import { type ChapterIdentity, canonicalChapterKey, parseCanonicalChapterKey } from './identity';

const STORAGE_KEY = 'akshar:v2:reading-history:default';
const MAX_ENTRIES = 20;

export type V2ChapterHistoryEntry = {
  bookId: string;
  editionId: string;
  chapterId: string;
  openedAt: string;
};

export async function loadV2ReadingHistory(): Promise<V2ChapterHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as V2ChapterHistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry) =>
        typeof entry?.bookId === 'string' &&
        typeof entry?.editionId === 'string' &&
        typeof entry?.chapterId === 'string' &&
        typeof entry?.openedAt === 'string',
    );
  } catch {
    return [];
  }
}

export async function recordV2ChapterOpened(identity: ChapterIdentity): Promise<void> {
  const { bookId, editionId, chapterId } = identity;
  const key = canonicalChapterKey(identity);
  const existing = await loadV2ReadingHistory();
  if (isLocalDataResetting()) return;
  const next = [
    { bookId, editionId, chapterId, openedAt: new Date().toISOString() },
    ...existing.filter((e) => canonicalChapterKey(e) !== key),
  ].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function historyEntryKey(entry: V2ChapterHistoryEntry): string {
  return canonicalChapterKey(entry);
}

export function historyEntryIdentity(entry: V2ChapterHistoryEntry): ChapterIdentity {
  return parseCanonicalChapterKey(historyEntryKey(entry));
}
