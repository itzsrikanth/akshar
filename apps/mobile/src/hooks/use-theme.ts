/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

// `Colors.dark` is fully defined and ready — intentionally not wired up while
// v1 ships a single theme, to keep design/QA scope tight. To enable dark mode:
// restore OS-scheme detection, e.g.
//   import { useColorScheme } from '@/hooks/use-color-scheme';
//   const scheme = useColorScheme();
//   return Colors[scheme === 'unspecified' ? 'light' : scheme];
export function useTheme() {
  return Colors.light;
}
