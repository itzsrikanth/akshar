import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { loadReadingHistory, type ChapterHistoryEntry } from '@/services/reading-history';

// Reloads on focus, not just on mount — Home/Library stay mounted across
// tab switches (React Navigation), so a chapter opened in Reader wouldn't
// otherwise show up on the way back without this (same class of bug fixed
// for downloads via useSyncExternalStore in services/downloads.ts; history
// writes go through AsyncStorage, which is async-only, so a focus-refetch
// is the simpler fit here rather than a synchronous shared-store).
function useReadingHistory(): ChapterHistoryEntry[] {
  const [history, setHistory] = useState<ChapterHistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadReadingHistory().then(setHistory);
    }, []),
  );

  return history;
}

/** Most-recently-opened chapter, or null if nothing's been opened yet. */
export function useLastOpenedChapter(): ChapterHistoryEntry | null {
  return useReadingHistory()[0] ?? null;
}

/** Full history, keyed for a quick "has this chapter been opened" lookup (Library). */
export function useReadingHistoryMap(): Map<string, ChapterHistoryEntry> {
  return new Map(useReadingHistory().map((e) => [e.path, e]));
}
