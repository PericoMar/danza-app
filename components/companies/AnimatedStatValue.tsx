import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, TextStyle } from 'react-native';

interface AnimatedStatValueProps {
  value: number;
  /** Text appended after the animated number, e.g. "+" */
  suffix?: string;
  duration?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Counts up from 0 to `value` once, when the component mounts (or when `value`
 * changes). Works on web and native via Animated + a JS listener.
 */
export default function AnimatedStatValue({
  value,
  suffix = '',
  duration = 1100,
  style,
}: AnimatedStatValueProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    setDisplay(0);
    const id = anim.addListener(({ value: v }) => {
      setDisplay(Math.round(v));
    });
    const animation = Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      anim.removeListener(id);
    };
  }, [value, duration, anim]);

  return (
    <Animated.Text style={style} accessibilityLabel={`${value}${suffix}`}>
      {display}
      {suffix}
    </Animated.Text>
  );
}
