import { useRef, useEffect } from "react";
import { Animated, Easing } from "react-native";
import { hasSubscribed, type SubscriptionStatus } from "@/types/newsletter";

type AnimatedValues = {
  /** Spring-in for the confirmation check mark (0 → 1). */
  markScale: Animated.Value;
  titleOpacity: Animated.Value;
  titleTranslateY: Animated.Value;
  subtitleOpacity: Animated.Value;
  panelOpacity: Animated.Value;
  panelTranslateY: Animated.Value;
};

export function useSubscribedAnimation(status: SubscriptionStatus): AnimatedValues {
  const markScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(16)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const panelTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Runs for "validating" too: the screen is the same success screen,
    // only with a notice on it.
    if (!hasSubscribed(status)) return;

    markScale.setValue(0);
    titleOpacity.setValue(0);
    titleTranslateY.setValue(16);
    subtitleOpacity.setValue(0);
    panelOpacity.setValue(0);
    panelTranslateY.setValue(20);

    Animated.sequence([
      Animated.spring(markScale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(panelOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [status]);

  return {
    markScale,
    titleOpacity,
    titleTranslateY,
    subtitleOpacity,
    panelOpacity,
    panelTranslateY,
  };
}
