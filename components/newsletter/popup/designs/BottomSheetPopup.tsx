import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  PanResponder,
  ActivityIndicator,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INTER } from "@/theme/companies";
import { Colors } from "@/theme/colors";
import { MOBILE_BREAKPOINT } from "@/constants/layout";
import { NewsletterPopupCloseReason } from "@/constants/newsletterPopup";
import { usePopupPresence } from "@/hooks/usePopupPresence";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { prefersReducedMotion } from "@/utils/motion";
import { NL } from "../../styles";
import { EmailSuggestion } from "../../EmailSuggestion";
import { ValidatingNotice } from "../../ValidatingNotice";
import { PopupConsent } from "../PopupConsent";
import { PopupError } from "../PopupError";
import { CloseButton } from "@/components/common/CloseButton";
import { POPUP_EMAIL_INPUT_PROPS, POPUP_EMAIL_PLACEHOLDER } from "../emailInput";
import type { NewsletterPopupViewProps } from "../types";

// Until the sheet has been measured it slides in from this far down.
const FALLBACK_SHEET_HEIGHT = 600;
const SHEET_MAX_WIDTH = 520;
const SHEET_PADDING_BOTTOM = 28;
// Breathing room kept above the sheet when it's as tall as the screen.
const SHEET_TOP_GAP = 24;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1.2;
// Dragging up only gives a little, so the sheet feels anchored to the bottom.
const RUBBER_BAND_FACTOR = 0.25;
const RUBBER_BAND_MAX = 16;

const BENEFITS = [
  "New open calls, every Sunday",
  "Deadlines before they pass",
  "Free · unsubscribe in one click",
] as const;

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

/** A native-feeling sheet from the bottom edge, draggable down to dismiss. */
export function BottomSheetPopup({
  form,
  onClose,
  onOpenPrivacyPolicy,
  onCreateAccount,
  autoCloseAfterSuccessMs,
}: NewsletterPopupViewProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= MOBILE_BREAKPOINT;
  const isGuest = !form.lockedEmail;
  // With the keyboard up there's no room for the benefits: keep the field visible.
  const isKeyboardVisible = useKeyboardVisible();
  const [sheetHeight, setSheetHeight] = useState(FALLBACK_SHEET_HEIGHT);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const { progress, opacity, close } = usePopupPresence({
    onClose,
    isSubscribed: form.isSubscribed,
    autoCloseAfterSuccessMs,
  });

  const dragY = useRef(new Animated.Value(0)).current;
  const closeRef = useRef(close);
  closeRef.current = close;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          dragY.setValue(
            g.dy >= 0 ? g.dy : Math.max(g.dy * RUBBER_BAND_FACTOR, -RUBBER_BAND_MAX),
          );
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
            closeRef.current();
            return;
          }
          Animated.spring(dragY, { toValue: 0, friction: 8, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, { toValue: 0, friction: 8, useNativeDriver: true }).start();
        },
      }),
    [dragY],
  );

  // Clamped so the entrance spring never lifts the sheet off the bottom edge.
  const translateY = useMemo(
    () =>
      Animated.add(
        progress.interpolate({
          inputRange: [0, 1],
          outputRange: [sheetHeight, 0],
          extrapolate: "clamp",
        }),
        dragY,
      ),
    [dragY, progress, sheetHeight],
  );

  return (
    <>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => close()}
          accessibilityRole="button"
          accessibilityLabel="Close newsletter popup"
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.anchor}
      >
        <Animated.View
          style={[styles.sheetFrame, isWide && styles.sheetFrameWide, { transform: [{ translateY }] }]}
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height || FALLBACK_SHEET_HEIGHT)}
        >
          <View
            style={[
              styles.sheet,
              {
                paddingBottom: SHEET_PADDING_BOTTOM + insets.bottom,
                maxHeight: height - insets.top - SHEET_TOP_GAP,
              },
            ]}
            accessibilityViewIsModal
          >
            <CloseButton onPress={() => close()} style={styles.closeButton} />

            <View {...panResponder.panHandlers} style={styles.dragArea}>
              <View style={styles.grabber} />
              {form.isSubscribed ? (
                <SuccessMark />
              ) : (
                <>
                  <View style={styles.tile}>
                    <Ionicons name="notifications" size={26} color={NL.bg} />
                  </View>
                  <Text style={styles.title}>Get audition alerts</Text>
                  <Text style={styles.body}>
                    Every Sunday: the week's new open calls, with deadlines and dates.
                    One email, nothing else.
                  </Text>
                </>
              )}
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {form.isSubscribed ? (
                <View style={styles.success}>
                  <Text style={styles.title}>Alerts on.</Text>
                  <Text style={styles.body}>
                    First email lands this Sunday at{" "}
                    <Text style={styles.emailHighlight}>{form.subscribedEmail}</Text>.
                  </Text>
                  {form.isValidating && <ValidatingNotice isCentered />}
                  {isGuest && (
                    <Pressable
                      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                        styles.button,
                        styles.successButton,
                        webPointer,
                        hovered && styles.buttonHovered,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => {
                        close(NewsletterPopupCloseReason.DONE);
                        onCreateAccount();
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={styles.buttonText}>Create an account</Text>
                      <Ionicons name="arrow-forward" size={16} color={NL.bg} />
                    </Pressable>
                  )}
                </View>
              ) : (
                <>
                  {!isKeyboardVisible && (
                    <View style={styles.benefits}>
                      {BENEFITS.map((benefit) => (
                        <View key={benefit} style={styles.benefitRow}>
                          <Ionicons name="checkmark" size={16} color={NL.ink} />
                          <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.form}>
                    {isGuest ? (
                      <TextInput
                        {...POPUP_EMAIL_INPUT_PROPS}
                        style={[styles.input, isInputFocused && styles.inputFocused]}
                        placeholder={POPUP_EMAIL_PLACEHOLDER}
                        placeholderTextColor={NL.muted}
                        value={form.email}
                        onChangeText={form.setEmail}
                        onSubmitEditing={form.submit}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        editable={!form.isSubmitting}
                      />
                    ) : (
                      <View style={styles.lockedRow}>
                        <Ionicons name="mail-outline" size={16} color={NL.muted} />
                        <Text style={styles.lockedText} numberOfLines={1}>
                          Alerts go to <Text style={styles.emailHighlight}>{form.lockedEmail}</Text>
                        </Text>
                      </View>
                    )}

                    <Pressable
                      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                        styles.button,
                        webPointer,
                        hovered && styles.buttonHovered,
                        pressed && styles.buttonPressed,
                        form.isSubmitting && styles.buttonDisabled,
                      ]}
                      onPress={form.submit}
                      disabled={form.isSubmitting}
                      accessibilityRole="button"
                      accessibilityState={{ busy: form.isSubmitting }}
                    >
                      {form.isSubmitting ? (
                        <ActivityIndicator size="small" color={NL.bg} />
                      ) : (
                        <Text style={styles.buttonText}>Turn on alerts</Text>
                      )}
                    </Pressable>

                    {!!form.emailSuggestion && (
                      <EmailSuggestion
                        suggestion={form.emailSuggestion}
                        onAccept={form.acceptEmailSuggestion}
                        variant="light"
                      />
                    )}

                    <PopupError message={form.error} />

                    <PopupConsent form={form} onOpenPrivacyPolicy={onOpenPrivacyPolicy} isCentered />

                    <Pressable
                      style={[styles.notNow, webPointer]}
                      onPress={() => close()}
                      accessibilityRole="button"
                    >
                      <Text style={styles.notNowText}>Not now</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
}

/** The check that springs in once subscribed. */
function SuccessMark() {
  const isStill = prefersReducedMotion();
  const scale = useRef(new Animated.Value(isStill ? 1 : 0)).current;

  useEffect(() => {
    if (isStill) return;
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [isStill, scale]);

  return (
    <Animated.View style={[styles.successMark, { transform: [{ scale }] }]}>
      <Ionicons name="checkmark" size={28} color={NL.bg} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.32)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      } as object,
    }),
  },
  anchor: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    pointerEvents: "box-none",
  },
  sheetFrame: {
    width: "100%",
  },
  sheetFrameWide: {
    maxWidth: SHEET_MAX_WIDTH,
  },
  sheet: {
    backgroundColor: NL.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 14,
    ...Platform.select({
      web: {
        boxShadow: "0 -20px 50px -20px rgba(0,0,0,.25)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 16,
      },
    }),
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  dragArea: {
    alignItems: "center",
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: NL.fieldBorder,
    marginBottom: 22,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: INTER,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: NL.ink,
    textAlign: "center",
  },
  body: {
    fontFamily: INTER,
    fontSize: 15,
    lineHeight: 22,
    color: NL.muted,
    textAlign: "center",
    maxWidth: 380,
    marginTop: 8,
  },
  emailHighlight: {
    fontWeight: "600",
    color: NL.ink,
  },
  // flexGrow 0 lets the scroll area wrap its content and only scroll once the
  // sheet reaches its max height.
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    alignItems: "center",
  },
  benefits: {
    alignSelf: "center",
    gap: 10,
    marginTop: 20,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    fontFamily: INTER,
    fontSize: 14,
    color: NL.inkSoft,
  },
  form: {
    width: "100%",
    marginTop: 24,
    gap: 12,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.chromeSoft,
    // A transparent border reserves the space the focus ring takes, so the
    // field doesn't jump when it gets focus.
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 18,
    fontFamily: INTER,
    fontSize: 16,
    color: NL.ink,
    ...Platform.select({ web: { outlineStyle: "none" } as object }),
  },
  inputFocused: {
    backgroundColor: NL.bg,
    borderColor: NL.ink,
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
  },
  lockedText: {
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 14,
    color: NL.muted,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: NL.ink,
    ...Platform.select({ web: { transition: "opacity 0.15s, transform 0.1s" } as object }),
  },
  buttonHovered: {
    opacity: 0.9,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: INTER,
    fontSize: 15.5,
    fontWeight: "700",
    color: NL.bg,
  },
  notNow: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  notNowText: {
    fontFamily: INTER,
    fontSize: 14,
    color: NL.muted,
  },

  // ─── Success ───
  successMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  success: {
    width: "100%",
    alignItems: "center",
  },
  successButton: {
    alignSelf: "stretch",
    marginTop: 24,
  },
});
