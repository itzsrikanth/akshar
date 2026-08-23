import { useSyncExternalStore } from 'react';

import {
  FONT_SCALE_LABELS,
  FONT_SCALE_STEPS,
  getFontScaleIndexSnapshot,
  setFontScaleStep,
  subscribeToFontScale,
} from '@/services/font-scale-store';

export { FONT_SCALE_STEPS };

/**
 * Reading text size, read from the shared store (services/font-scale-store.ts) — primed once at
 * boot (app/_layout.tsx) and shared app-wide, same pattern as hooks/use-catalog.ts. Only
 * components that need the interactive control (FontSizeStepper) call this directly — everything
 * else just marks its ThemedText `scalable` (ThemedText calls this hook internally).
 */
export function useFontScale() {
  const index = useSyncExternalStore(subscribeToFontScale, getFontScaleIndexSnapshot);

  return {
    scale: FONT_SCALE_STEPS[index],
    label: FONT_SCALE_LABELS[index],
    increase: () => setFontScaleStep(index + 1),
    decrease: () => setFontScaleStep(index - 1),
    canIncrease: index < FONT_SCALE_STEPS.length - 1,
    canDecrease: index > 0,
  };
}
