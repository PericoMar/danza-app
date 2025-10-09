import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function UpTrendIcon() {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(800),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const scale = bob.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
      <Ionicons name="chevron-up-outline" size={26} color="#22C55E" />
    </Animated.View>
  );
}
