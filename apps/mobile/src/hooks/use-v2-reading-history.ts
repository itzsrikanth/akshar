import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  type V2ChapterHistoryEntry,
  canonicalChapterKey,
  loadV2ReadingHistory,
} from '@/services/v2';

function useV2ReadingHistory(): V2ChapterHistoryEntry[] {
  const [history, setHistory] = useState<V2ChapterHistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadV2ReadingHistory().then(setHistory);
    }, []),
  );

  return history;
}

export function useLastOpenedV2Chapter(): V2ChapterHistoryEntry | null {
  return useV2ReadingHistory()[0] ?? null;
}

export function useV2ReadingHistoryMap(): Map<string, V2ChapterHistoryEntry> {
  return new Map(
    [...useV2ReadingHistory()].reverse().map((entry) => [canonicalChapterKey(entry), entry]),
  );
}
