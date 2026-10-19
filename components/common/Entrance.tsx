import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

// A quick rise into place: the content fades in while it climbs a few pixels
// and grows to full size. On web it also comes into focus (native has no CSS
// filter, and the native driver couldn't animate one anyway).
const DURATION_MS = 280;
const RISE_PX = 14;
const START_SCALE = 0.97;
const START_BLUR = 'blur(6px)';
const END_BLUR = 'blur(0px)';
// Fast out, long settle: most of the travel happens in the first few frames.
const EASING = Easing.bezier(0.16, 1, 0.3, 1);

type EntranceProps = {
  /** Wait before playing, to stagger the items of a list. */
  delay?: number;
  /** The entrance plays on mount, and again whenever this changes. */
  replayKey?: string | number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Plays a short entrance animation on its children. Still with reduced motion. */
export default function Entrance({ delay = 0, replayKey, style, children }: EntranceProps) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  // Read when a replay starts, not a reason to start one: a list hands new
  // delays to items that didn't move, and those must stay put.
  const delayRef = useRef(delay);
  delayRef.current = delay;
  // The blur only exists while playing. Left at blur(0px) it would keep every
  // card of a long list on its own paint layer.
  const [blurring, setBlurring] = useState(!reducedMotion);

  // A layout effect, so a replay hides the new content before the browser
  // paints it rather than flashing it for a frame and then fading it in.
  useLayoutEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    setBlurring(true);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      delay: delayRef.current,
      easing: EASING,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setBlurring(false);
    });
    return () => animation.stop();
  }, [replayKey, reducedMotion, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [RISE_PX, 0] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [START_SCALE, 1] }) },
          ],
        },
        Platform.OS === 'web' && blurring
          ? ({
              filter: progress.interpolate({ inputRange: [0, 1], outputRange: [START_BLUR, END_BLUR] }),
            } as any)
          : null,
      ]}
    >
      {children}
    </Animated.View>
  );
}
