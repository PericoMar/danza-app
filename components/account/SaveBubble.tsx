import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";
import { SAVE_BUBBLE_BOTTOM_OFFSET } from "@/constants/layout";
import { SAVE_BUBBLE_ENTER_MS, SAVE_BUBBLE_EXIT_MS } from "@/constants/profile";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { SAVE_STATUS, type SaveStatus } from "@/types/profile";
import { AccountButton } from "./AccountButton";

type SaveBubbleProps = {
  status: SaveStatus;
  canSave: boolean;
  onSave: () => void;
  onDiscard: () => void;
  /** Phone widths: the bubble spans the screen (minus gutters) and uses shorter copy. */
  isCompact: boolean;
};

/** Every status the bubble can show — it is hidden while the form is clean. */
type VisibleStatus = Exclude<SaveStatus, typeof SAVE_STATUS.CLEAN>;

type StatusLook = {
  label: string;
  compactLabel: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
};

const STATUS_LOOK: Record<VisibleStatus, StatusLook> = {
  [SAVE_STATUS.DIRTY]: { label: "Unsaved changes", compactLabel: "Unsaved", color: Colors.text },
  [SAVE_STATUS.SAVING]: { label: "Saving…", compactLabel: "Saving…", color: Colors.grey2 },
  [SAVE_STATUS.SAVED]: {
    label: "All changes saved",
    compactLabel: "All changes saved",
    icon: "checkmark-circle",
    color: Colors.successText,
  },
  [SAVE_STATUS.ERROR]: {
    label: "Couldn't save. Try again.",
    compactLabel: "Not saved",
    icon: "alert-circle",
    color: Colors.dangerText,
  },
};

const USE_NATIVE_DRIVER = Platform.OS !== "web";

/**
 * Floating save status + actions pinned to the bottom of the screen, so they
 * stay in view while the form scrolls. Slides in when the form has changes,
 * turns green for a moment after a successful save, then sinks away slowly.
 *
 * Render it as a sibling *after* the ScrollView inside a `flex: 1` screen; give
 * the scroll content `SAVE_BUBBLE_CLEARANCE` (+ bottom inset) of bottom padding
 * so nothing ends up hidden underneath it. Hidden while the native keyboard is
 * open so it never covers the field being edited.
 */
export function SaveBubble({ status, canSave, onSave, onDiscard, isCompact }: SaveBubbleProps) {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const isVisible = status !== SAVE_STATUS.CLEAN;

  // Keep painting the last visible status while the exit animation runs.
  const lastVisible = useRef<VisibleStatus>(SAVE_STATUS.DIRTY);
  if (status !== SAVE_STATUS.CLEAN) lastVisible.current = status;
  const shown = lastVisible.current;

  const [isMounted, setIsMounted] = useState(isVisible);
  const presence = useRef(new Animated.Value(0)).current;
  const bump = useRef(new Animated.Value(1)).current;
  const check = useRef(new Animated.Value(1)).current;

  // Quick slide-up on the way in, a slower sink-and-fade on the way out.
  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
      Animated.timing(presence, {
        toValue: 1,
        duration: SAVE_BUBBLE_ENTER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    } else {
      Animated.timing(presence, {
        toValue: 0,
        duration: SAVE_BUBBLE_EXIT_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (finished) setIsMounted(false);
      });
    }
  }, [isVisible, presence]);

  // A pop when the outcome changes while on screen (saved, failed, edited again);
  // the saved state also springs its tick in.
  const previousStatus = useRef(status);
  useEffect(() => {
    const from = previousStatus.current;
    previousStatus.current = status;
    if (from === status || from === SAVE_STATUS.CLEAN || !isVisible || status === SAVE_STATUS.SAVING) {
      return;
    }
    const isSaved = status === SAVE_STATUS.SAVED;
    Animated.sequence([
      Animated.timing(bump, {
        toValue: isSaved ? 1.06 : 1.04,
        duration: 120,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(bump, { toValue: 1, friction: 5, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
    if (isSaved) {
      check.setValue(0);
      Animated.spring(check, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    }
  }, [status, isVisible, bump, check]);

  // Visible → render right away; just hidden → stay mounted until the exit finishes.
  if (keyboardVisible || (!isVisible && !isMounted)) return null;

  const look = STATUS_LOOK[shown];
  const isSaved = shown === SAVE_STATUS.SAVED;
  const isSaving = shown === SAVE_STATUS.SAVING;

  return (
    <View
      style={[
        styles.anchor,
        isCompact && styles.anchorCompact,
        !isVisible && styles.anchorLeaving,
        { bottom: SAVE_BUBBLE_BOTTOM_OFFSET + insets.bottom },
      ]}
    >
      <Animated.View
        accessibilityRole="toolbar"
        style={[
          styles.bubble,
          isCompact && styles.bubbleCompact,
          isSaved && styles.bubbleSaved,
          {
            opacity: presence,
            transform: [
              { translateY: presence.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) },
              { scale: bump },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.status,
            isCompact && !isSaved && styles.statusCompact,
            isSaved && styles.statusSaved,
          ]}
        >
          {look.icon ? (
            <Animated.View style={isSaved ? { transform: [{ scale: check }] } : undefined}>
              <Ionicons name={look.icon} size={isSaved ? 18 : 16} color={look.color} />
            </Animated.View>
          ) : (
            <View style={styles.dot} />
          )}
          <Text
            style={[styles.statusText, isSaved && styles.statusTextSaved, { color: look.color }]}
            numberOfLines={1}
            accessibilityLiveRegion="polite"
          >
            {isCompact ? look.compactLabel : look.label}
          </Text>
        </View>

        {isSaved ? null : (
          <>
            <AccountButton
              variant="ghost"
              size="sm"
              label="Discard"
              onPress={onDiscard}
              disabled={isSaving}
            />
            <AccountButton
              size="sm"
              label={isCompact ? "Save" : "Save changes"}
              icon={isCompact ? undefined : "checkmark"}
              onPress={onSave}
              disabled={!canSave && !isSaving}
              loading={isSaving}
            />
          </>
        )}
      </Animated.View>
    </View>
  );
}

// Buttons are 42 tall + 7px padding each side + 1px border: keep that height
// when the saved state shows text only, so the bubble doesn't jump.
const BUBBLE_MIN_HEIGHT = 58;

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    // Taps outside the bubble fall through to the page underneath.
    pointerEvents: "box-none",
  },
  anchorCompact: {
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  // Mid-exit: no longer interactive.
  anchorLeaving: {
    pointerEvents: "none",
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: BUBBLE_MIN_HEIGHT,
    padding: 7,
    paddingLeft: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    ...Platform.select({
      web: {
        backgroundColor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 18px 40px -14px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.05)",
        transitionProperty: "background-color, border-color",
        transitionDuration: "250ms",
      } as object,
      default: {
        backgroundColor: Colors.white,
        shadowColor: "#000",
        shadowOpacity: 0.16,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      },
    }),
  },
  bubbleCompact: {
    gap: 6,
    paddingLeft: 14,
  },
  // Success: the design system's pastel fill + saturated green text.
  bubbleSaved: {
    alignSelf: "center",
    paddingLeft: 22,
    paddingRight: 22,
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    marginRight: 8,
  },
  statusCompact: {
    flex: 1,
    minWidth: 0,
    marginRight: 2,
  },
  statusSaved: {
    marginRight: 0,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 4.5,
    backgroundColor: Colors.text,
  },
  statusText: {
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 13.5,
  },
  statusTextSaved: {
    fontSize: 14,
    fontWeight: "600",
  },
});
