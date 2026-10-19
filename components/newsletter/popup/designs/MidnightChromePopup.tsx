import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ChromeSurface from "@/components/companies/ChromeSurface";
import GradientText from "@/components/common/GradientText";
import { INTER } from "@/theme/companies";
import { SMALL_SCREEN_BREAKPOINT } from "@/constants/layout";
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

const CARD_RADIUS = 24;
const CONTROL_RADIUS = 14;
const CONTROL_HEIGHT = 54;
const MEDALLION_SIZE = 52;
// Solid colour behind the silver headline, for when the gradient can't paint.
const SILVER_FALLBACK = "#c9ccd2";

const WHITE_SOFT = "rgba(255,255,255,0.6)";
const WHITE_FAINT = "rgba(255,255,255,0.5)";
const GLASS_FILL = "rgba(255,255,255,0.06)";
const GLASS_BORDER = "rgba(255,255,255,0.14)";
const GLASS_BORDER_FOCUSED = "rgba(255,255,255,0.35)";
const PLACEHOLDER = "rgba(255,255,255,0.35)";

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

/** Dark brushed-metal card with chrome details: the app's premium look. */
export function MidnightChromePopup({
  form,
  onClose,
  onOpenPrivacyPolicy,
  onCreateAccount,
  autoCloseAfterSuccessMs,
}: NewsletterPopupViewProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < SMALL_SCREEN_BREAKPOINT;
  const isGuest = !form.lockedEmail;
  const [isFocused, setIsFocused] = useState(false);
  const { progress, opacity, close } = usePopupPresence({
    onClose,
    isSubscribed: form.isSubscribed,
    autoCloseAfterSuccessMs,
  });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const headlineStyle = [styles.headline, isSmallScreen && styles.headlineSmall];

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

      <View style={styles.centeredContainer}>
        {/* Movement on a borderless wrapper: iOS doesn't resize a bordered view's
            background along with its scale. */}
        <Animated.View style={[styles.frame, { opacity, transform: [{ translateY }, { scale }] }]}>
          <ChromeSurface
            variant="dark"
            ring
            borderRadius={CARD_RADIUS}
            style={[styles.card, isSmallScreen && styles.cardSmall]}
          >
            <CloseButton tone="dark" onPress={() => close()} style={styles.closeButton} />

            {form.isSubscribed ? (
              <View>
                <SuccessMedallion />
                <GradientText style={headlineStyle}>You're in.</GradientText>
                <Text style={styles.body}>
                  Alerts go to <Text style={styles.emailHighlight}>{form.subscribedEmail}</Text>.
                </Text>
                {form.isValidating && <ValidatingNotice variant="dark" />}
                {isGuest && (
                  <View style={styles.successAction}>
                    <ChromeButton
                      label="Create an account"
                      onPress={() => {
                        close(NewsletterPopupCloseReason.DONE);
                        onCreateAccount();
                      }}
                    />
                  </View>
                )}
              </View>
            ) : (
              <>
                <Medallion>
                  <Ionicons name="notifications" size={22} color={NL.ink} />
                </Medallion>

                <View style={styles.header}>
                  <Text style={[headlineStyle, styles.headlineWhite]} accessibilityRole="header">
                    Never miss
                  </Text>
                  <GradientText style={headlineStyle}>an audition.</GradientText>
                  <Text style={styles.body}>
                    One email every Sunday with all the week's new auditions. Free, and gone
                    in one click.
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={[styles.glassRow, isFocused && styles.glassRowFocused]}>
                    <Ionicons
                      name={isGuest ? "mail-outline" : "mail"}
                      size={18}
                      color={isGuest ? WHITE_FAINT : NL.bg}
                    />
                    {isGuest ? (
                      <TextInput
                        {...POPUP_EMAIL_INPUT_PROPS}
                        style={styles.input}
                        placeholder={POPUP_EMAIL_PLACEHOLDER}
                        placeholderTextColor={PLACEHOLDER}
                        value={form.email}
                        onChangeText={form.setEmail}
                        onSubmitEditing={form.submit}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        editable={!form.isSubmitting}
                      />
                    ) : (
                      <Text style={styles.lockedEmail} numberOfLines={1}>
                        {form.lockedEmail}
                      </Text>
                    )}
                  </View>

                  {!!form.emailSuggestion && (
                    <EmailSuggestion
                      suggestion={form.emailSuggestion}
                      onAccept={form.acceptEmailSuggestion}
                      variant="dark"
                    />
                  )}

                  <PopupError message={form.error} tone="dark" />

                  <ChromeButton
                    label="Turn on alerts"
                    onPress={form.submit}
                    isLoading={form.isSubmitting}
                    isFullWidth
                  />

                  <PopupConsent form={form} onOpenPrivacyPolicy={onOpenPrivacyPolicy} tone="dark" />

                  <Pressable
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.dismissButton,
                      webPointer,
                      hovered && styles.dismissButtonHovered,
                    ]}
                    onPress={() => close()}
                    accessibilityRole="button"
                  >
                    <Text style={styles.dismissButtonText}>Maybe later</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ChromeSurface>
        </Animated.View>
      </View>
    </>
  );
}

/** Round chrome badge that heads the card. */
function Medallion({ children }: { children: ReactNode }) {
  return (
    <ChromeSurface variant="chrome" borderRadius={MEDALLION_SIZE / 2} style={styles.medallion}>
      {children}
    </ChromeSurface>
  );
}

/** The medallion again, its check springing in once the subscription lands. */
function SuccessMedallion() {
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [checkScale]);

  return (
    <Medallion>
      <Animated.View style={{ transform: [{ scale: checkScale }] }}>
        <Ionicons name="checkmark" size={24} color={NL.ink} />
      </Animated.View>
    </Medallion>
  );
}

type ChromeButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  isFullWidth?: boolean;
};

/** Brushed-metal button. The press scale sits on the borderless Pressable. */
function ChromeButton({ label, onPress, isLoading = false, isFullWidth = false }: ChromeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: isLoading }}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        isFullWidth ? styles.buttonFull : styles.buttonInline,
        webPointer,
        hovered && !isLoading && styles.buttonHovered,
        pressed && !isLoading && styles.buttonPressed,
        isLoading && styles.buttonBusy,
      ]}
    >
      <ChromeSurface variant="chrome" borderRadius={CONTROL_RADIUS} style={styles.button}>
        {isLoading ? (
          <ActivityIndicator size="small" color={NL.ink} />
        ) : (
          <>
            <Text style={styles.buttonText}>{label}</Text>
            <Ionicons name="arrow-forward" size={17} color={NL.ink} />
          </>
        )}
      </ChromeSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      } as object,
    }),
  },
  centeredContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    pointerEvents: "box-none",
  },
  frame: {
    maxWidth: 440,
    width: "100%",
  },
  card: {
    padding: 36,
  },
  cardSmall: {
    padding: 24,
  },
  closeButton: {
    position: "absolute",
    top: 18,
    right: 18,
  },

  // ─── Header ───
  medallion: {
    width: MEDALLION_SIZE,
    height: MEDALLION_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  header: {
    paddingRight: 24,
  },
  headline: {
    fontFamily: INTER,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -1.2,
    color: SILVER_FALLBACK,
  },
  headlineSmall: {
    fontSize: 26,
    lineHeight: 30,
  },
  headlineWhite: {
    color: NL.bg,
  },
  body: {
    fontFamily: INTER,
    fontSize: 14.5,
    lineHeight: 21,
    color: WHITE_SOFT,
    marginTop: 12,
  },
  emailHighlight: {
    fontWeight: "700",
    color: NL.bg,
  },

  // ─── Form ───
  form: {
    marginTop: 26,
    gap: 14,
  },
  glassRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: CONTROL_HEIGHT,
    paddingHorizontal: 18,
    borderRadius: CONTROL_RADIUS,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_FILL,
    ...Platform.select({ web: { transition: "border-color 0.15s" } as object }),
  },
  glassRowFocused: {
    borderColor: GLASS_BORDER_FOCUSED,
  },
  input: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 15.5,
    color: NL.bg,
    ...Platform.select({ web: { outlineStyle: "none" } as object }),
  },
  lockedEmail: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 15.5,
    fontWeight: "600",
    color: NL.bg,
  },
  buttonFull: {
    alignSelf: "stretch",
  },
  buttonInline: {
    alignSelf: "flex-start",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: CONTROL_HEIGHT,
    paddingHorizontal: 26,
  },
  buttonHovered: {
    opacity: 0.92,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonBusy: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: INTER,
    fontSize: 15.5,
    fontWeight: "700",
    color: NL.ink,
  },
  dismissButton: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  dismissButtonHovered: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dismissButtonText: {
    fontFamily: INTER,
    fontSize: 13,
    color: WHITE_FAINT,
  },

  // ─── Success ───
  successAction: {
    marginTop: 24,
  },
});
