import AsyncStorage from '@react-native-async-storage/async-storage';

// Real "what has this user actually opened" signal — replaces the
// catalog.chapters[0] + fixed segment-count placeholders that used to stand
// in for "continue reading" / "segments read" on Home and Library. No
// segment-level tracking yet (that needs viewport/scroll tracking in Reader,
// a bigger lift — see docs/roadmap.md's ProgressRepository plan); this is
// deliberately just "chapter opened, when" until that's built.
const STORAGE_KEY = 'akshar:reading-history:default';

// Bounds unbounded growth across a long-lived install without needing a
// real eviction policy — Home only ever shows the most recent entry anyway.
const MAX_ENTRIES = 20;

export type ChapterHistoryEntry = { path: string; openedAt: string };

export async function loadReadingHistory(): Promise<ChapterHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChapterHistoryEntry[]) : [];
  } catch {
    // Corrupt or inaccessible storage shouldn't crash the app — just means
    // no history, same as a first launch.
    return [];
  }
}

export async function recordChapterOpened(path: string): Promise<void> {
  const existing = await loadReadingHistory();
  const next = [{ path, openedAt: new Date().toISOString() }, ...existing.filter((e) => e.path !== path)].slice(
    0,
    MAX_ENTRIES,
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/** "Just now" / "3h ago" / "5d ago" — coarse on purpose, this is a glance-level timestamp. */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
}
