// components/common/CardStack.tsx
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/theme/colors";
import { prefersReducedMotion } from "@/utils/motion";

// Card heights drive layout (stack height, the secondary card's clip), and
// layout can't run on the native driver, so every animation here uses JS.
const USE_NATIVE_DRIVER = false;

// Gesture
/** Horizontal travel before the stack takes the gesture away from the page scroll. */
const DRAG_CLAIM_PX = 10;
/** Release past this distance — or flick faster than SWIPE_VELOCITY (px/ms) — to switch cards. */
const SWIPE_DISTANCE = 90;
const SWIPE_VELOCITY = 0.45;
/** Tilt of the front card at a SWIPE_DISTANCE drag. */
const DRAG_TILT_DEG = 3;

// Switch animation: the front card slides aside ("out") while the secondary
// rises into its place, then the old front settles underneath ("in").
const OUT_MS = 300;
const IN_MS = 360;
const ASIDE_WIDTH_RATIO = 0.5;
const ASIDE_TILT_DEG = 5;
const ASIDE_SCALE = 0.97;
/** The card settling underneath rises this far into place. */
const SETTLE_RISE_PX = 24;

// The secondary card sits underneath the front one: its top tucked under the
// front card's bottom edge, a preview of it showing below.
const SECONDARY_TUCK = 16;
const SECONDARY_PEEK = 150;
const SECONDARY_SCALE = 0.95;
/** Clip height that leaves exactly SECONDARY_PEEK visible once scaled. */
const SECONDARY_HEIGHT = (SECONDARY_TUCK + SECONDARY_PEEK) / SECONDARY_SCALE;
const SECONDARY_FADE = 64;
/** Web blurs the whole card; native lays a BlurView over it (no CSS filter there). */
const SECONDARY_BLUR_PX = 0.6;
const SECONDARY_BLUR_INTENSITY = 8;
/** On hover, or while the front card is dragged, the secondary sharpens and grows a touch. */
const SECONDARY_LIFTED_BLUR = 0.3;
const SECONDARY_LIFT_SCALE = 0.01;
const HOVER_MS = 160;

const deg = (n: number) => `${n}deg`;

type Shuffle = { dir: 1 | -1; phase: "out" | "in" };
type Role = "front" | "secondary" | "hidden" | "leaving" | "promoting" | "revealing";
type Animatable = Animated.AnimatedInterpolation<number> | Animated.AnimatedMultiplication<number> | number;
type Pose = {
  z: number;
  /** Clip height; undefined = as tall as the card's content. */
  height?: Animatable;
  style: any;
  /** 0 = sharp, 1 = the secondary's blur. Null skips the blur layer. */
  blur: Animatable | null;
  /** Opacity of the fade at the bottom of the secondary's preview. */
  fade: Animatable | null;
};

type CardStackProps<T> = {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  /** Look of every card: background, border, radius, shadow. */
  cardStyle?: StyleProp<ViewStyle>;
  /** Accessible name of an item, for the "show next" control. */
  itemLabel?: (item: T) => string;
};

/**
 * A deck of cards: the first item in front, the next one underneath it with
 * a preview showing below. Drag the front card sideways or click the one
 * underneath to bring it forward. One item renders as a single plain card.
 */
export default function CardStack<T>({
  items,
  keyExtractor,
  renderItem,
  cardStyle,
  itemLabel,
}: CardStackProps<T>) {
  const count = items.length;
  const [front, setFront] = useState(0);
  const [shuffle, setShuffle] = useState<Shuffle | null>(null);
  const [width, setWidth] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [dragging, setDragging] = useState(false);

  const dragX = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const hover = useRef(new Animated.Value(0)).current;
  const stackHeight = useRef(new Animated.Value(0)).current;
  const busyRef = useRef(false);

  const keys = items.map(keyExtractor);
  const multi = count > 1;
  const frontIndex = count ? front % count : 0;
  const frontKey = keys[frontIndex];
  const secondaryKey = keys[(frontIndex + 1) % Math.max(count, 1)];
  const frontHeight = frontKey ? heights[frontKey] : undefined;
  const secondaryHeight = (multi && heights[secondaryKey]) || 0;
  const ready = frontHeight != null;
  const peek = multi ? SECONDARY_PEEK : 0;

  const live = useRef({ count });
  live.current = { count };

  const advance = useCallback((dir: 1 | -1) => {
    if (busyRef.current || live.current.count < 2) return;
    busyRef.current = true;
    setShuffle({ dir, phase: "out" });
  }, []);

  const settleDrag = useCallback(() => {
    Animated.spring(dragX, { toValue: 0, bounciness: 6, useNativeDriver: USE_NATIVE_DRIVER }).start();
  }, [dragX]);

  // Runs before paint so the next frame already shows the new phase's pose.
  useLayoutEffect(() => {
    if (!shuffle) {
      progress.setValue(0);
      return;
    }
    const reduced = prefersReducedMotion();
    if (shuffle.phase === "out") {
      const duration = reduced ? 0 : OUT_MS;
      const easing = Easing.out(Easing.cubic);
      const timing = (value: Animated.Value, toValue: number) =>
        Animated.timing(value, { toValue, duration, easing, useNativeDriver: USE_NATIVE_DRIVER });
      Animated.parallel([
        timing(progress, 0.5),
        timing(dragX, 0),
        timing(hover, 0),
        timing(stackHeight, secondaryHeight + peek),
      ]).start(() => setShuffle((s) => (s ? { ...s, phase: "in" } : s)));
    } else {
      Animated.timing(progress, {
        toValue: 1,
        duration: reduced ? 0 : IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(() => {
        setFront((f) => (f + 1) % Math.max(live.current.count, 1));
        setShuffle(null);
        busyRef.current = false;
      });
    }
  }, [shuffle?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // At rest the stack is as tall as the front card plus the secondary's preview.
  useLayoutEffect(() => {
    if (!shuffle && frontHeight != null) stackHeight.setValue(frontHeight + peek);
  }, [frontHeight, peek, shuffle, stackHeight]);

  const onCardLayout = (key: string) => (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }));
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) =>
          !busyRef.current &&
          live.current.count > 1 &&
          Math.abs(g.dx) > DRAG_CLAIM_PX &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () => {
          setDragging(true);
          clearWebSelection();
        },
        onPanResponderMove: (_, g) => dragX.setValue(g.dx),
        onPanResponderRelease: (_, g) => {
          setDragging(false);
          const flung = Math.abs(g.vx) > SWIPE_VELOCITY && Math.sign(g.vx) === Math.sign(g.dx);
          if (Math.abs(g.dx) > SWIPE_DISTANCE || flung) advance(g.dx > 0 ? 1 : -1);
          else settleDrag();
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          settleDrag();
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [advance, dragX, settleDrag],
  );

  const setHover = (to: 0 | 1) =>
    Animated.timing(hover, { toValue: to, duration: HOVER_MS, useNativeDriver: USE_NATIVE_DRIVER }).start();

  if (count === 0) return null;

  // ─── Poses ────────────────────────────────────────────────────────────────
  // "out" covers progress 0 → 0.5 and "in" 0.5 → 1. The leaving card is
  // invisible at 0.5, so it jumps from the side to below the stack unseen.
  const at = (output: number[]) =>
    progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: output });
  const at4 = (output: number[]) =>
    progress.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: output });
  const at4Deg = (output: number[]) =>
    progress.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: output.map(deg) });

  const dragAmount = dragX.interpolate({
    inputRange: [-SWIPE_DISTANCE, 0, SWIPE_DISTANCE],
    outputRange: [1, 0, 1],
    extrapolate: "clamp",
  });
  const lift = Animated.add(hover, dragAmount).interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const liftBlur = lift.interpolate({ inputRange: [0, 1], outputRange: [1, SECONDARY_LIFTED_BLUR] });
  const liftScale = lift.interpolate({ inputRange: [0, 1], outputRange: [0, SECONDARY_LIFT_SCALE] });
  // Cards pivot on their top edge: dragged right, the bottom swings further right.
  const dragTilt = dragX.interpolate({
    inputRange: [-2 * SWIPE_DISTANCE, 2 * SWIPE_DISTANCE],
    outputRange: [deg(2 * DRAG_TILT_DEG), deg(-2 * DRAG_TILT_DEG)],
    extrapolate: "clamp",
  });
  const dir = shuffle?.dir ?? -1;
  const asideX = dir * width * ASIDE_WIDTH_RATIO;
  const tuckedY = (frontHeight ?? 0) - SECONDARY_TUCK;
  // Where the card underneath ends up once the secondary has become the front.
  const nextTuckedY = secondaryHeight - SECONDARY_TUCK;

  const roleOf = (rank: number): Role => {
    if (!shuffle) return rank === 0 ? "front" : rank === 1 ? "secondary" : "hidden";
    if (rank === 0) return "leaving";
    if (rank === 1) return "promoting";
    return rank === 2 ? "revealing" : "hidden";
  };

  const poseOf = (role: Role): Pose => {
    switch (role) {
      case "front":
        return {
          z: 3,
          blur: null,
          fade: null,
          style: { transform: [{ translateX: dragX }, { rotate: dragTilt }] },
        };
      case "secondary":
        return {
          z: 2,
          height: SECONDARY_HEIGHT,
          blur: liftBlur,
          fade: 1,
          style: {
            transform: [{ translateY: tuckedY }, { scale: Animated.add(SECONDARY_SCALE, liftScale) }],
          },
        };
      case "hidden":
        return {
          z: 0,
          height: SECONDARY_HEIGHT,
          blur: 1,
          fade: 1,
          style: { opacity: 0, transform: [{ translateY: tuckedY }, { scale: SECONDARY_SCALE }] },
        };
      case "promoting":
        return {
          z: 3,
          height: at([SECONDARY_HEIGHT, secondaryHeight, secondaryHeight]),
          blur: Animated.multiply(at([1, 0, 0]), liftBlur),
          fade: at([1, 0, 0]),
          style: {
            transform: [
              { translateY: at([tuckedY, 0, 0]) },
              { scale: Animated.add(at([SECONDARY_SCALE, 1, 1]), liftScale) },
            ],
          },
        };
      case "leaving":
        return {
          // Above everything while it slides out, then underneath as it settles.
          z: shuffle?.phase === "out" ? 4 : 1,
          height: at4([frontHeight ?? 0, frontHeight ?? 0, SECONDARY_HEIGHT, SECONDARY_HEIGHT]),
          blur: at4([0, 1, 1, 1]),
          fade: at4([0, 0, 1, 1]),
          style: {
            opacity: at4([1, 0, 0, count > 2 ? 0 : 1]),
            transform: [
              { translateX: Animated.add(dragX, at4([0, asideX, 0, 0])) },
              { translateY: at4([0, 0, nextTuckedY + SETTLE_RISE_PX, nextTuckedY]) },
              { rotate: dragTilt },
              { rotate: at4Deg([0, -dir * ASIDE_TILT_DEG, 0, 0]) },
              { scale: at4([1, ASIDE_SCALE, SECONDARY_SCALE, SECONDARY_SCALE]) },
            ],
          },
        };
      case "revealing":
        return {
          z: 2,
          height: SECONDARY_HEIGHT,
          blur: 1,
          fade: 1,
          style: {
            opacity: at4([0, 0, 0, 1]),
            transform: [
              { translateY: at4([tuckedY, tuckedY, nextTuckedY + SETTLE_RISE_PX, nextTuckedY]) },
              { scale: SECONDARY_SCALE },
            ],
          },
        };
    }
  };

  const flatCard = StyleSheet.flatten(cardStyle) ?? {};
  const radius = typeof flatCard.borderRadius === "number" ? flatCard.borderRadius : 0;
  const border = typeof flatCard.borderWidth === "number" ? flatCard.borderWidth : 0;
  const clipRadius = { borderRadius: Math.max(radius - border, 0) };
  const activeDot = shuffle?.phase === "in" ? (frontIndex + 1) % count : frontIndex;

  return (
    <View>
      <Animated.View
        style={[styles.stack, ready && { height: stackHeight }]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {items.map((item, i) => {
          const key = keys[i];
          const rank = (i - frontIndex + count) % count;
          const role = roleOf(rank);
          const pose = poseOf(role);
          const isFront = role === "front";
          // Until the front card is measured it lays out in flow and the rest wait.
          const inFlow = isFront && !ready;
          if (!ready && !isFront) return null;

          return (
            <Animated.View
              key={key}
              style={[
                inFlow ? styles.slotInFlow : styles.slot,
                cardStyle,
                pose.style,
                pose.height != null && { height: pose.height },
                { zIndex: pose.z },
                pose.blur != null && Platform.OS === "web" && { filter: blurFilter(pose.blur) },
                isFront && multi && webGrab,
                isFront && dragging && webDragging,
              ]}
              {...(isFront && multi ? pan.panHandlers : null)}
            >
              <View style={[styles.clip, clipRadius]}>
                <InertWhen inert={!isFront} onLayout={onCardLayout(key)}>
                  {renderItem(item)}
                </InertWhen>
                {pose.fade != null && (
                  <Animated.View pointerEvents="none" style={[styles.fade, { opacity: pose.fade }]}>
                    <LinearGradient
                      colors={[`${Colors.white}00`, Colors.white]}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                )}
                {pose.blur != null && Platform.OS !== "web" && (
                  <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: pose.blur }]}>
                    <BlurView tint="light" intensity={SECONDARY_BLUR_INTENSITY} style={StyleSheet.absoluteFill} />
                  </Animated.View>
                )}
              </View>

              {role === "secondary" && (
                <Pressable
                  onPress={() => advance(-1)}
                  onHoverIn={() => setHover(1)}
                  onHoverOut={() => setHover(0)}
                  style={[StyleSheet.absoluteFill, webPointer]}
                  accessibilityRole="button"
                  accessibilityLabel={itemLabel ? `Show next: ${itemLabel(item)}` : "Show next card"}
                />
              )}
            </Animated.View>
          );
        })}
      </Animated.View>

      {multi && (
        <View style={styles.dots} accessible accessibilityLabel={`${activeDot + 1} of ${count}`}>
          {keys.map((key, i) => (
            <View key={key} style={[styles.dot, i === activeDot && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Wraps a card that is not in front: no taps, no keyboard focus and hidden
 * from screen readers (web uses the `inert` attribute, which RN can't pass).
 */
function InertWhen({
  inert,
  onLayout,
  children,
}: {
  inert: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;
    if (inert) node.setAttribute("inert", "");
    else node.removeAttribute("inert");
  }, [inert]);

  return (
    <View
      ref={ref}
      onLayout={onLayout}
      pointerEvents={inert ? "none" : "auto"}
      accessibilityElementsHidden={inert}
      importantForAccessibility={inert ? "no-hide-descendants" : "auto"}
    >
      {children}
    </View>
  );
}

function blurFilter(blur: Animatable) {
  if (typeof blur === "number") return `blur(${blur * SECONDARY_BLUR_PX}px)`;
  return blur.interpolate({
    inputRange: [0, 1],
    outputRange: ["blur(0px)", `blur(${SECONDARY_BLUR_PX}px)`],
  });
}

function clearWebSelection() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.getSelection?.()?.removeAllRanges();
  }
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;
const webGrab = Platform.OS === "web" ? ({ cursor: "grab", touchAction: "pan-y" } as any) : null;
const webDragging =
  Platform.OS === "web" ? ({ cursor: "grabbing", userSelect: "none" } as any) : null;

const styles = StyleSheet.create({
  stack: {
    position: "relative",
  },
  slotInFlow: {
    position: "relative",
    transformOrigin: "top",
  },
  slot: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    transformOrigin: "top",
  },
  clip: {
    flex: 1,
    overflow: "hidden",
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SECONDARY_FADE,
  },
  dots: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.ruleStrong,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.text,
  },
});
