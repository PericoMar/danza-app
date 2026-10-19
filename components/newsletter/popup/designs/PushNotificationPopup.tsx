import { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Animated,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INTER } from "@/theme/companies";
import { MOBILE_BREAKPOINT } from "@/constants/layout";
import { NewsletterPopupCloseReason } from "@/constants/newsletterPopup";
import { usePopupPresence } from "@/hooks/usePopupPresence";
import { NL } from "../../styles";
import { EmailSuggestion } from "../../EmailSuggestion";
import { ValidatingNotice } from "../../ValidatingNotice";
import { PopupConsent } from "../PopupConsent";
import { PopupError } from "../PopupError";
import { CloseButton } from "@/components/common/CloseButton";
import { POPUP_EMAIL_INPUT_PROPS, POPUP_EMAIL_PLACEHOLDER } from "../emailInput";
import type { NewsletterPopupViewProps } from "../types";

const APP_ICON = require("@/assets/images/icon.png");

const BANNER_WIDTH = 380;
const EDGE_COMPACT = 8;
const EDGE_WIDE = 16;
// Clears the 72px site navbar (components/common/siteStyles.ts) with a gap.
const TOP_WIDE = 84;
const ENTRANCE_OFFSET = -120;
const ENTRANCE_SCALE = 0.96;
// A swipe has to be clearly vertical before it takes over from a tap.
const SWIPE_CLAIM_PX = 8;
const SWIPE_DISMISS_PX = -40;
const SWIPE_DISMISS_VELOCITY = -0.8;
// Dragging down only gives a little, like a real notification.
const DOWNWARD_RESISTANCE = 0.2;
const CONTROL_HEIGHT = 42;

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

const glass = Platform.select({
  web: {
    backgroundColor: "rgba(255,255,255,0.86)",
    backdropFilter: "saturate(180%) blur(20px)",
    WebkitBackdropFilter: "saturate(180%) blur(20px)",
    boxShadow: "0 18px 40px -18px rgba(0,0,0,.35)",
  } as any,
  default: {
    backgroundColor: "rgba(250,250,252,0.98)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
});

/**
 * The popup as a system notification: it drops in from the top, swipes away
 * like one, and only opens into a form when tapped.
 */
export function PushNotificationPopup({
  form,
  onClose,
  onOpenPrivacyPolicy,
  onCreateAccount,
  autoCloseAfterSuccessMs,
}: NewsletterPopupViewProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= MOBILE_BREAKPOINT;
  const isGuest = !form.lockedEmail;
  const [isExpanded, setIsExpanded] = useState(false);
  const { progress, opacity, close } = usePopupPresence({
    onClose,
    isSubscribed: form.isSubscribed,
    autoCloseAfterSuccessMs,
  });

  const dragY = useRef(new Animated.Value(0)).current;
  const translateY = useMemo(
    () =>
      Animated.add(
        progress.interpolate({ inputRange: [0, 1], outputRange: [ENTRANCE_OFFSET, 0] }),
        dragY,
      ),
    [dragY, progress],
  );
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [ENTRANCE_SCALE, 1] });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Only on moves, never on touch start, so taps reach the buttons and input.
        onMoveShouldSetPanResponder: (_e, { dx, dy }) =>
          Math.abs(dy) > SWIPE_CLAIM_PX && Math.abs(dy) > Math.abs(dx),
        onPanResponderMove: (_e, { dy }) => {
          dragY.setValue(dy < 0 ? dy : dy * DOWNWARD_RESISTANCE);
        },
        onPanResponderRelease: (_e, { dy, vy }) => {
          if (dy < SWIPE_DISMISS_PX || vy < SWIPE_DISMISS_VELOCITY) {
            close();
            return;
          }
          Animated.spring(dragY, { toValue: 0, friction: 7, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, { toValue: 0, friction: 7, useNativeDriver: true }).start();
        },
      }),
    [close, dragY],
  );

  const placement = isWide
    ? { top: TOP_WIDE, right: EDGE_WIDE, width: BANNER_WIDTH }
    : { top: insets.top + EDGE_COMPACT, left: EDGE_COMPACT, right: EDGE_COMPACT };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Scale and drag live on a borderless wrapper; the bordered glass sits inside. */}
      <Animated.View
        style={[styles.frame, placement, { opacity, transform: [{ translateY }, { scale }] }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.banner, glass]}>
          <CloseButton
            onPress={() =>
              close(form.isSubscribed ? NewsletterPopupCloseReason.DONE : undefined)
            }
            style={styles.closeButton}
          />

          {form.isSubscribed ? (
            <View>
              <View style={styles.successRow}>
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={14} color={NL.bg} />
                </View>
                <View style={styles.textColumn}>
                  <Text style={styles.title}>Alerts on</Text>
                  <Text style={styles.body}>First one lands this Sunday.</Text>
                </View>
                {isGuest && (
                  <Pressable
                    onPress={() => {
                      close(NewsletterPopupCloseReason.DONE);
                      onCreateAccount();
                    }}
                    accessibilityRole="button"
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.smallPill,
                      webPointer,
                      hovered && styles.hovered,
                    ]}
                  >
                    <Text style={styles.smallPillText}>Create account</Text>
                  </Pressable>
                )}
              </View>
              {form.isValidating && <ValidatingNotice />}
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => setIsExpanded(true)}
                disabled={isExpanded}
                accessibilityRole="button"
                accessibilityLabel="Turn on audition alerts"
                accessibilityState={{ expanded: isExpanded }}
                style={[styles.row, !isExpanded && webPointer]}
              >
                <Image source={APP_ICON} style={styles.appIcon} />
                <View style={styles.textColumn}>
                  <View style={styles.headerRow}>
                    <Text style={styles.appName}>DANZA</Text>
                    <Text style={styles.time}>now</Text>
                  </View>
                  <Text style={styles.title}>Never miss an audition</Text>
                  <Text style={styles.body}>
                    Every new open call in your inbox each Sunday. Tap to turn on alerts.
                  </Text>
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.expanded}>
                  {isGuest ? (
                    <View style={styles.inputRow}>
                      <TextInput
                        {...POPUP_EMAIL_INPUT_PROPS}
                        style={styles.input}
                        placeholder={POPUP_EMAIL_PLACEHOLDER}
                        placeholderTextColor={NL.muted}
                        value={form.email}
                        onChangeText={form.setEmail}
                        onSubmitEditing={form.submit}
                        editable={!form.isSubmitting}
                        autoFocus
                      />
                      <TurnOnButton
                        onPress={form.submit}
                        isSubmitting={form.isSubmitting}
                      />
                    </View>
                  ) : (
                    <>
                      <Text style={styles.lockedEmail} numberOfLines={1}>
                        Alerts to{" "}
                        <Text style={styles.lockedEmailStrong}>{form.lockedEmail}</Text>
                      </Text>
                      <TurnOnButton
                        onPress={form.submit}
                        isSubmitting={form.isSubmitting}
                        isFullWidth
                      />
                    </>
                  )}

                  {!!form.emailSuggestion && (
                    <EmailSuggestion
                      suggestion={form.emailSuggestion}
                      onAccept={form.acceptEmailSuggestion}
                      variant="light"
                    />
                  )}
                  <PopupError message={form.error} />
                  <PopupConsent form={form} onOpenPrivacyPolicy={onOpenPrivacyPolicy} />
                </View>
              )}
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

type TurnOnButtonProps = {
  onPress: () => void;
  isSubmitting: boolean;
  isFullWidth?: boolean;
};

function TurnOnButton({ onPress, isSubmitting, isFullWidth = false }: TurnOnButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isSubmitting}
      accessibilityRole="button"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.turnOn,
        isFullWidth && styles.turnOnFullWidth,
        webPointer,
        hovered && styles.hovered,
        pressed && styles.pressed,
        isSubmitting && styles.disabled,
      ]}
    >
      {isSubmitting ? (
        <ActivityIndicator size="small" color={NL.bg} />
      ) : (
        <Text style={styles.turnOnText}>Turn on</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "absolute",
  },
  banner: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 14,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  // ─── Collapsed ───
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // Keeps "now" clear of the close button.
    paddingRight: 30,
    marginBottom: 2,
  },
  appName: {
    fontFamily: INTER,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    color: NL.muted,
  },
  time: {
    fontFamily: INTER,
    fontSize: 11,
    color: NL.muted,
  },
  title: {
    fontFamily: INTER,
    fontSize: 14.5,
    fontWeight: "700",
    color: NL.ink,
  },
  body: {
    fontFamily: INTER,
    fontSize: 13.5,
    lineHeight: 19,
    color: NL.inkSoft,
    marginTop: 1,
  },

  // ─── Expanded ───
  expanded: {
    marginTop: 14,
    gap: 10,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: CONTROL_HEIGHT,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 14,
    fontFamily: INTER,
    fontSize: 14.5,
    color: NL.ink,
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  lockedEmail: {
    fontFamily: INTER,
    fontSize: 12.5,
    color: NL.muted,
  },
  lockedEmailStrong: {
    fontWeight: "700",
    color: NL.ink,
  },
  turnOn: {
    height: CONTROL_HEIGHT,
    borderRadius: 12,
    backgroundColor: NL.ink,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 92,
  },
  turnOnFullWidth: {
    alignSelf: "stretch",
  },
  turnOnText: {
    fontFamily: INTER,
    fontSize: 14,
    fontWeight: "700",
    color: NL.bg,
  },

  // ─── Success ───
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 30,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  smallPill: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  smallPillText: {
    fontFamily: INTER,
    fontSize: 12.5,
    fontWeight: "700",
    color: NL.bg,
  },

  // ─── States ───
  hovered: {
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.6,
  },
});
