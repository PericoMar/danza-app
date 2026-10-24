import { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";
import { prefersReducedMotion } from "@/utils/motion";

const EXIT_MS = 200;

type UseToastLifecycleOptions = {
  /** How long the toast stays, not counting the time it spends paused. */
  duration: number;
  /** Called once the exit animation has finished. */
  onClose?: () => void;
};

/** Why a toast is holding its clock. It runs again once every reason has gone. */
export type ToastHold = "hover" | "press" | "focus" | "screen-reader";

/** What a toast design drives its animations and controls from. */
export type ToastLifecycle = {
  /** 0 → 1 on the way in, back to 0 on the way out. Native driver. */
  presence: Animated.Value;
  /** `presence` clamped to 0–1, for opacity, so a spring never overshoots it. */
  opacity: Animated.AnimatedInterpolation<number>;
  /** 1 → 0 over the toast's time on screen. JS driver, so it can drive widths and SVG. */
  countdown: Animated.Value;
  close: () => void;
  /** Stops the clock, e.g. while the pointer is over the toast. */
  pause: (hold: ToastHold) => void;
  resume: (hold: ToastHold) => void;
};

/**
 * Entrance, countdown and exit of one toast. The clock pauses while it's
 * hovered, held or focused, so a toast never vanishes while someone is
 * reading it or reaching for its buttons.
 */
export function useToastLifecycle({ duration, onClose }: UseToastLifecycleOptions): ToastLifecycle {
  const isStill = prefersReducedMotion();
  const presence = useRef(new Animated.Value(isStill ? 1 : 0)).current;
  const countdown = useRef(new Animated.Value(1)).current;
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClosingRef = useRef(false);
  const holdsRef = useRef(new Set<ToastHold>());
  // A toast replaced mid-exit must not report closing over its successor.
  const isMountedRef = useRef(true);
  // The caller often passes a fresh arrow each render; the latest one wins.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const close = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    clearTimer();
    countdown.stopAnimation();
    if (isStill) {
      onCloseRef.current?.();
      return;
    }
    Animated.timing(presence, {
      toValue: 0,
      duration: EXIT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      if (isMountedRef.current) onCloseRef.current?.();
    });
  }, [countdown, isStill, presence]);

  const run = useCallback(() => {
    startedAtRef.current = Date.now();
    Animated.timing(countdown, {
      toValue: 0,
      duration: remainingRef.current,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    timerRef.current = setTimeout(close, remainingRef.current);
  }, [close, countdown]);

  const pause = useCallback((hold: ToastHold) => {
    holdsRef.current.add(hold);
    if (isClosingRef.current || !timerRef.current) return;
    clearTimer();
    countdown.stopAnimation();
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
  }, [countdown]);

  const resume = useCallback((hold: ToastHold) => {
    holdsRef.current.delete(hold);
    if (isClosingRef.current || timerRef.current || holdsRef.current.size > 0) return;
    run();
  }, [run]);

  useEffect(() => {
    // Set here and not only in useRef: StrictMode runs the cleanup once in dev.
    isMountedRef.current = true;
    if (!isStill) {
      Animated.spring(presence, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }
    run();
    return () => {
      isMountedRef.current = false;
      clearTimer();
    };
    // Mount only: a toast runs its clock once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacity = useMemo(
    () => presence.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }),
    [presence],
  );

  return { presence, opacity, countdown, close, pause, resume };
}
