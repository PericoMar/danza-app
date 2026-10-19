import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { PRESS_SCALE, PRESS_SPRING } from '@/constants/motion';

/**
 * Tactile press feedback: spread `onPressIn`/`onPressOut` onto a Pressable and
 * `style` onto an `Animated.View` wrapping it. The wrapper owns the scale so
 * the Pressable's own `transform` stays free for hover styles.
 */
export function usePressScale(disabled = false, pressedScale = PRESS_SCALE) {
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = useCallback(
    (toValue: number) => {
      Animated.spring(scale, { toValue, useNativeDriver: true, ...PRESS_SPRING }).start();
    },
    [scale],
  );

  const onPressIn = useCallback(() => {
    if (!disabled) springTo(pressedScale);
  }, [disabled, pressedScale, springTo]);

  // Always springs back, so a control disabled mid-press doesn't stay shrunk.
  const onPressOut = useCallback(() => springTo(1), [springTo]);

  return { style: { transform: [{ scale }] }, onPressIn, onPressOut };
}
