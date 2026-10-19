import { useMemo } from "react";
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type ToastCountdownBarProps = {
  /** 1 → 0 over the toast's time on screen. */
  countdown: Animated.Value;
  color: string;
  height?: number;
  /** Colour of the part already used up; transparent leaves no track. */
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** A line that shrinks to the left as the toast's time runs out. */
export function ToastCountdownBar({
  countdown,
  color,
  height = 3,
  trackColor = "transparent",
  style,
}: ToastCountdownBarProps) {
  // Width rather than scaleX: a scale squeezes rounded ends, a width keeps them.
  const width = useMemo(
    () => countdown.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
    [countdown],
  );

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.fill, { width, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
