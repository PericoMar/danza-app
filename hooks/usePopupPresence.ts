import { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";
import { prefersReducedMotion } from "@/utils/motion";
import { NewsletterPopupCloseReason } from "@/constants/newsletterPopup";

const EXIT_MS = 200;

type UsePopupPresenceOptions = {
  /** Called once the exit animation has finished. */
  onClose: (reason: NewsletterPopupCloseReason) => void;
  isSubscribed: boolean;
  /** Close by itself this long after subscribing; null stays open. */
  autoCloseAfterSuccessMs: number | null;
};

/**
 * Entrance and exit of a popup design, as one 0 → 1 `progress` each design maps
 * onto its own movement (a scale, a slide from below, a drop from the top…).
 * `close` plays the exit first, so nothing vanishes mid-frame.
 */
export function usePopupPresence({
  onClose,
  isSubscribed,
  autoCloseAfterSuccessMs,
}: UsePopupPresenceOptions) {
  const isStill = prefersReducedMotion();
  const progress = useRef(new Animated.Value(isStill ? 1 : 0)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (isStill) return;
    Animated.spring(progress, {
      toValue: 1,
      friction: 9,
      tension: 55,
      useNativeDriver: true,
    }).start();
  }, [isStill, progress]);

  const close = useCallback(
    (reason: NewsletterPopupCloseReason = NewsletterPopupCloseReason.DISMISSED) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;
      if (isStill) {
        onClose(reason);
        return;
      }
      Animated.timing(progress, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => onClose(reason));
    },
    [isStill, onClose, progress],
  );

  useEffect(() => {
    if (!isSubscribed || autoCloseAfterSuccessMs === null) return;
    const id = setTimeout(() => close(NewsletterPopupCloseReason.DONE), autoCloseAfterSuccessMs);
    return () => clearTimeout(id);
  }, [autoCloseAfterSuccessMs, close, isSubscribed]);

  /** Opacity that never overshoots, whatever the spring does. */
  const opacity = useMemo(
    () => progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }),
    [progress],
  );

  return { progress, opacity, close };
}
