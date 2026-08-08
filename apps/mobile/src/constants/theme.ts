/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#60646C',
    textDisabled: '#A0A4AC',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    border: '#D8D9DE',
    // Akshar brand accent — warm terracotta, distinct from Expo's stock blue.
    tint: '#B5541A',
    // Soft accent surface (e.g. selected/active chips) — same hue family as tint.
    tintMuted: '#FCEADD',
    // Text/icon color for content placed directly on a `tint`-filled surface
    // (e.g. a primary button's label). Not just `background` reused — dark
    // mode's lighter tint fails white-text contrast, so this needs its own
    // per-theme value.
    onTint: '#ffffff',
    success: '#2E7D32',
    warning: '#B8860B',
    error: '#C62828',
    info: '#1565C0',
  },
  dark: {
    text: '#ffffff',
    textSecondary: '#B0B4BA',
    textDisabled: '#6B6F76',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    border: '#3A3D42',
    tint: '#E8935F',
    tintMuted: '#3A2A1E',
    onTint: '#241005',
    success: '#66BB6A',
    warning: '#E0A84D',
    error: '#EF5350',
    info: '#64B5F6',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Fixed-size type scale. `reading` is deliberately not a scaled-up `body` —
// Kannada/Devanagari/Tamil/Telugu carry matras and diacritics above and below
// the baseline that a Latin-tuned line-height clips, so it gets extra headroom.
export const Typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subtitle: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  reading: { fontSize: 18, lineHeight: 29, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
} as const;

export const Radius = {
  small: 6,
  medium: 12,
  large: 20,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
