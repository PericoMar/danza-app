// components/landing/ui/UnlockingLockIcon.tsx
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";

type Props = { size?: number };

export default function UnlockingLockIcon({ size = 16 }: Props) {
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(prog, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(prog, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.delay(1500),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [prog]);

  const scale = prog.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const rotate = prog.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-8deg"] });
  const closedOpacity = prog.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const openOpacity = prog.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View style={{ transform: [{ scale }, { rotate }], width: size, height: size }}>
      <Animated.View style={{ position: "absolute", opacity: closedOpacity }}>
        <Ionicons name="lock-closed-outline" size={size} color={Colors.purpleSoft} />
      </Animated.View>
      <Animated.View style={{ position: "absolute", opacity: openOpacity }}>
        <Ionicons name="lock-open-outline" size={size} color={Colors.purpleSoft} />
      </Animated.View>
    </Animated.View>
  );
}
