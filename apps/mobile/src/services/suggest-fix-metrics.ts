import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SuggestLayer } from '@/services/suggest-fix';

const STORAGE_KEY = 'akshar.suggestFix.metrics.v1';

export type SuggestFixEventType = 'sheet_opened' | 'layer_chosen' | 'github_opened' | 'cancelled';

export type SuggestFixMetrics = {
  sheetOpened: number;
  layerChosen: Record<SuggestLayer, number>;
  githubOpened: Record<SuggestLayer, number>;
  cancelled: number;
};

const EMPTY: SuggestFixMetrics = {
  sheetOpened: 0,
  layerChosen: { translation: 0, source: 0, gloss: 0, other: 0 },
  githubOpened: { translation: 0, source: 0, gloss: 0, other: 0 },
  cancelled: 0,
};

function normalize(raw: unknown): SuggestFixMetrics {
  if (!raw || typeof raw !== 'object') return { ...EMPTY, layerChosen: { ...EMPTY.layerChosen }, githubOpened: { ...EMPTY.githubOpened } };
  const record = raw as Partial<SuggestFixMetrics>;
  return {
    sheetOpened: typeof record.sheetOpened === 'number' ? record.sheetOpened : 0,
    cancelled: typeof record.cancelled === 'number' ? record.cancelled : 0,
    layerChosen: {
      translation: record.layerChosen?.translation ?? 0,
      source: record.layerChosen?.source ?? 0,
      gloss: record.layerChosen?.gloss ?? 0,
      other: record.layerChosen?.other ?? 0,
    },
    githubOpened: {
      translation: record.githubOpened?.translation ?? 0,
      source: record.githubOpened?.source ?? 0,
      gloss: record.githubOpened?.gloss ?? 0,
      other: record.githubOpened?.other ?? 0,
    },
  };
}

/** Local-only counters for Stage 1 → Stage 2 gate (no analytics backend). */
export function recordSuggestFixEvent(event: {
  type: SuggestFixEventType;
  layer?: SuggestLayer;
}): void {
  void (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const metrics = normalize(raw ? JSON.parse(raw) : null);
      if (event.type === 'sheet_opened') {
        metrics.sheetOpened += 1;
      } else if (event.type === 'cancelled') {
        metrics.cancelled += 1;
      } else if (event.layer && event.type === 'layer_chosen') {
        metrics.layerChosen[event.layer] += 1;
      } else if (event.layer && event.type === 'github_opened') {
        metrics.githubOpened[event.layer] += 1;
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
    } catch {
      // Metrics must never block the suggest flow.
    }
  })();
}

export async function getSuggestFixMetrics(): Promise<SuggestFixMetrics> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return normalize(raw ? JSON.parse(raw) : null);
  } catch {
    return normalize(null);
  }
}

/** Completion rate: github opens / sheet opens (0 when none opened). */
export function suggestFixCompletionRate(metrics: SuggestFixMetrics): number {
  if (metrics.sheetOpened <= 0) return 0;
  const opens =
    metrics.githubOpened.translation +
    metrics.githubOpened.source +
    metrics.githubOpened.gloss +
    metrics.githubOpened.other;
  return opens / metrics.sheetOpened;
}
