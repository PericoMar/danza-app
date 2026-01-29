import { useRef, useEffect } from "react";
import { Animated, Easing } from "react-native";
import type { SubscriptionStatus } from "@/types/newsletter";

type AnimatedValues = {
  checkmarkScale: Animated.Value;
  checkmarkRotate: Animated.Value;
  titleOpacity: Animated.Value;
  titleTranslateY: Animated.Value;
  subtitleOpacity: Animated.Value;
  benefitsOpacity: Animated.Value;
  benefitsTranslateY: Animated.Value;
  pulseAnim: Animated.Value;
};

export function useSubscribedAnimation(status: SubscriptionStatus): AnimatedValues {
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const benefitsOpacity = useRef(new Animated.Value(0)).current;
  const benefitsTranslateY = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== "subscribed") return;

    // Reset values
    checkmarkScale.setValue(0);
    checkmarkRotate.setValue(0);
    titleOpacity.setValue(0);
    titleTranslateY.setValue(20);
    subtitleOpacity.setValue(0);
    benefitsOpacity.setValue(0);
    benefitsTranslateY.setValue(30);

    // Staggered animations
    Animated.sequence([
      // Checkmark bounce in with rotation
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkRotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Title fade in
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Subtitle fade in
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      // Benefits slide up
      Animated.parallel([
        Animated.timing(benefitsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(benefitsTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous subtle pulse on the checkmark
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [status]);

  return {
    checkmarkScale,
    checkmarkRotate,
    titleOpacity,
    titleTranslateY,
    subtitleOpacity,
    benefitsOpacity,
    benefitsTranslateY,
    pulseAnim,
  };
}
