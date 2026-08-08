import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

const PRESSED_STYLE: ViewStyle = { opacity: 0.6 };

/**
 * Drop-in replacement for Pressable that adds a subtle opacity dip on press
 * — plain Pressable gives no visual feedback at all on iOS unless styled.
 * One shared place to tune this (or add haptics later) instead of every
 * call site repeating a `({ pressed }) => [...]` style function.
 */
export function Touchable({ style, ...props }: PressableProps) {
  return (
    <Pressable
      {...props}
      style={(state) => [
        typeof style === 'function' ? style(state) : (style as StyleProp<ViewStyle>),
        state.pressed && PRESSED_STYLE,
      ]}
    />
  );
}
