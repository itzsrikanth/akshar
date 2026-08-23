import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor, Typography } from '@/constants/theme';
import { useFontScale } from '@/hooks/use-font-scale';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'reading' | 'code';
  themeColor?: ThemeColor;
  /** Opt in only at actual textbook content (SegmentLine, exercise question/answer/definition
   *  text) — never at UI chrome (buttons, section labels, nav). See hooks/use-font-scale.ts. */
  scalable?: boolean;
};

// Base sizes for the types that ever get marked `scalable` — a fixed lookup rather than reading
// back from the StyleSheet below, since RN's compiled style objects aren't introspectable.
const BASE_SIZES: Partial<Record<NonNullable<ThemedTextProps['type']>, { fontSize: number; lineHeight: number }>> = {
  default: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  reading: { fontSize: Typography.reading.fontSize, lineHeight: Typography.reading.lineHeight },
};

export function ThemedText({ style, type = 'default', themeColor, scalable = false, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { scale } = useFontScale();
  const base = scalable ? BASE_SIZES[type] : undefined;

  return (
    <Text
      style={[
        { color: theme[themeColor ?? (type === 'linkPrimary' ? 'tint' : 'text')] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'reading' && styles.reading,
        type === 'code' && styles.code,
        base && { fontSize: base.fontSize * scale, lineHeight: base.lineHeight * scale },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
  },
  reading: {
    fontSize: Typography.reading.fontSize,
    lineHeight: Typography.reading.lineHeight,
    fontWeight: Typography.reading.fontWeight,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
