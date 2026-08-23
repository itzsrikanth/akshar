// Shared reactive store for the reading text size — same shape as catalog-store.ts, and for the
// same reason: ThemedText resolves its own scale internally (see hooks/use-font-scale.ts) so
// every content line doesn't need to be threaded a prop, but that means a chapter page can
// mount dozens of ThemedText instances at once. Reading through one shared, in-memory value via
// useSyncExternalStore is a cheap sync read for all of them; each doing its own independent
// AsyncStorage read (and focus-effect subscription) would not be.
import { loadFontScale, saveFontScale } from './font-scale-storage';

/** Fixed bounds, not just visual steps — see setFontScaleStep below. */
export const FONT_SCALE_STEPS = [0.85, 1, 1.15, 1.3, 1.5] as const;
export const FONT_SCALE_LABELS = ['Small', 'Default', 'Large', 'X-Large', 'Maximum'] as const;

const DEFAULT_INDEX = FONT_SCALE_STEPS.indexOf(1);

function nearestStepIndex(scale: number): number {
  let closest = DEFAULT_INDEX;
  let closestDiff = Infinity;
  FONT_SCALE_STEPS.forEach((step, i) => {
    const diff = Math.abs(step - scale);
    if (diff < closestDiff) {
      closest = i;
      closestDiff = diff;
    }
  });
  return closest;
}

let index = DEFAULT_INDEX;
const listeners = new Set<() => void>();

function setIndex(next: number): void {
  if (next === index) return;
  index = next;
  listeners.forEach((listener) => listener());
}

export function subscribeToFontScale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFontScaleIndexSnapshot(): number {
  return index;
}

/** Fixed bounds, not just visual steps — clamps rather than wrapping past either end. */
export function setFontScaleStep(next: number): void {
  const clamped = Math.max(0, Math.min(FONT_SCALE_STEPS.length - 1, next));
  setIndex(clamped);
  saveFontScale(FONT_SCALE_STEPS[clamped]);
}

/** Called once at boot, from app/_layout.tsx — loads the persisted value into the shared store. */
export async function primeFontScale(): Promise<void> {
  const saved = await loadFontScale();
  if (saved !== null) setIndex(nearestStepIndex(saved));
}
