import { View, Text, StyleSheet, Animated, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INTER } from "@/theme/companies";
import { CloseButton } from "@/components/common/CloseButton";
import { useToastLifecycle } from "@/hooks/useToastLifecycle";
import { TOAST_DEFAULT_DURATION_MS, TOAST_EDGE_OFFSET, type ToastTone } from "@/constants/toast";
import { TOAST_TONES } from "./tones";
import { ToastCountdownBar } from "./ToastCountdownBar";

const MAX_WIDTH = 440;
const SLIDE_DISTANCE = 20;
const BAR_HEIGHT = 3;

export type ToastProps = {
  message: string;
  tone: ToastTone;
  /** How long it stays, in ms, not counting the time it spends paused. */
  duration?: number;
  /** After it has gone, whether by itself or dismissed. */
  onClose?: () => void;
};

/**
 * One toast at the bottom of the screen, above everything: a pastel fill of
 * its tone with saturated text, and the time left as a tinted line along the
 * bottom edge. It waits while a pointer hovers it or a finger holds it.
 */
export function Toast({ message, tone, duration = TOAST_DEFAULT_DURATION_MS, onClose }: ToastProps) {
  const insets = useSafeAreaInsets();
  const lifecycle = useToastLifecycle({ duration, onClose });
  const { icon, accent, soft, softBorder, softText } = TOAST_TONES[tone];
  const translateY = lifecycle.presence.interpolate({
    inputRange: [0, 1],
    outputRange: [SLIDE_DISTANCE, 0],
  });

  return (
    <Portal>
      <View style={[styles.frame, { bottom: insets.bottom + TOAST_EDGE_OFFSET }]} pointerEvents="box-none">
        <Animated.View
          style={[styles.wrapper, { opacity: lifecycle.opacity, transform: [{ translateY }] }]}
          accessibilityRole="alert"
        >
          <Pressable
            onHoverIn={lifecycle.pause}
            onHoverOut={lifecycle.resume}
            onPressIn={lifecycle.pause}
            onPressOut={lifecycle.resume}
            style={[styles.card, { backgroundColor: soft, borderColor: softBorder }]}
          >
            <Ionicons name={icon} size={20} color={accent} />
            <Text style={[styles.message, { color: softText }]}>{message}</Text>
            <CloseButton size="sm" onPress={lifecycle.close} accessibilityLabel="Dismiss" />
            <ToastCountdownBar
              countdown={lifecycle.countdown}
              color={accent}
              height={BAR_HEIGHT}
              style={styles.bar}
            />
          </Pressable>
        </Animated.View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "absolute",
    left: TOAST_EDGE_OFFSET,
    right: TOAST_EDGE_OFFSET,
    alignItems: "center",
    zIndex: 1000,
  },
  wrapper: {
    width: "100%",
    maxWidth: MAX_WIDTH,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 14,
    paddingBottom: 14 + BAR_HEIGHT,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 14px 32px -18px rgba(0,0,0,.25)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  message: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    opacity: 0.45,
  },
});
