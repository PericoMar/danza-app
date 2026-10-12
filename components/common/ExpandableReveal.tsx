// components/common/ExpandableReveal.tsx
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const REVEAL_DURATION_MS = 340;
const DEFAULT_FADE_HEIGHT = 32;

/**
 * 0 → 1 progress that follows `expanded`. Share it between `ExpandableReveal`
 * and any companion animation (e.g. a rotating chevron) so they move together.
 */
export function useRevealProgress(expanded: boolean): Animated.Value {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: REVEAL_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // animates layout height
    }).start();
  }, [expanded, progress]);
  return progress;
}

type ExpandableRevealProps = {
  progress: Animated.Value;
  /** Visible height while collapsed. */
  collapsedHeight: number;
  /** 6-digit hex the clipped edge fades into while collapsed; omit for a hard edge. */
  fadeTo?: string;
  /** Height of that fade, in px. */
  fadeHeight?: number;
  children: React.ReactNode;
};

/**
 * Shows the first `collapsedHeight` px of its children and smoothly grows to
 * their full measured height as `progress` goes 0 → 1. Works on web and native.
 */
export default function ExpandableReveal({
  progress,
  collapsedHeight,
  fadeTo,
  fadeHeight = DEFAULT_FADE_HEIGHT,
  children,
}: ExpandableRevealProps) {
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setContentHeight((prev) => (prev === h ? prev : h));
  };

  const fullHeight = contentHeight ?? collapsedHeight;
  const startHeight = Math.min(collapsedHeight, fullHeight);
  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startHeight, fullHeight],
  });
  const showFade = !!fadeTo && fullHeight > startHeight;

  return (
    <Animated.View style={[styles.clip, { height }]}>
      <View onLayout={onContentLayout}>{children}</View>
      {showFade && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fade,
            {
              height: fadeHeight,
              opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            },
          ]}
        >
          <LinearGradient colors={[`${fadeTo}00`, fadeTo]} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
