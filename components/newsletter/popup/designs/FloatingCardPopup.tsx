import { useEffect, useRef, useState } from "react";
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
  KeyboardAvoidingView,
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

const CARD_WIDTH = 380;
const EDGE_WIDE = 24;
const EDGE_COMPACT = 12;
const ENTRANCE_OFFSET = 24;
const STEP_FADE_MS = 180;

const Step = {
  PITCH: "pitch",
  EMAIL: "email",
} as const;
type Step = (typeof Step)[keyof typeof Step];

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

/**
 * A small card in the corner that never blocks the page. It pitches first and
 * only asks for the address once the visitor says yes.
 */
export function FloatingCardPopup({
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
  const [step, setStep] = useState<Step>(Step.PITCH);
  const { progress, opacity, close } = usePopupPresence({
    onClose,
    isSubscribed: form.isSubscribed,
    autoCloseAfterSuccessMs,
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [ENTRANCE_OFFSET, 0],
  });

  // Each change of step (and the success state) fades its content in.
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentKey = form.isSubscribed ? "success" : step;
  const isFirstContent = useRef(true);
  useEffect(() => {
    if (isFirstContent.current) {
      isFirstContent.current = false;
      return;
    }
    contentOpacity.setValue(0);
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: STEP_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [contentKey, contentOpacity]);

  const handleGetAlerts = () => {
    // A signed-in address is already known, so there is nothing left to ask.
    if (isGuest) setStep(Step.EMAIL);
    else form.submit();
  };

  const placement = isWide
    ? { right: EDGE_WIDE, bottom: EDGE_WIDE, width: CARD_WIDTH }
    : { left: EDGE_COMPACT, right: EDGE_COMPACT, bottom: EDGE_COMPACT + insets.bottom };

  return (
    <KeyboardAvoidingView
      style={StyleSheet.absoluteFill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      pointerEvents="box-none"
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View
          style={[styles.frame, placement, { opacity, transform: [{ translateY }] }]}
        >
          <View style={styles.card}>
            <Animated.View style={{ opacity: contentOpacity }}>
              {form.isSubscribed ? (
                <View>
                  <View style={styles.successRow}>
                    <View style={styles.successMark}>
                      <Ionicons name="checkmark" size={15} color={NL.bg} />
                    </View>
                    <View style={styles.textColumn}>
                      <Text style={styles.title}>You're in.</Text>
                      <Text style={styles.body}>First email lands this Sunday.</Text>
                    </View>
                    <CloseButton
                      onPress={() => close(NewsletterPopupCloseReason.DONE)}
                    />
                  </View>
                  {form.isValidating && <ValidatingNotice />}
                  {isGuest && (
                    <Pressable
                      onPress={() => {
                        close(NewsletterPopupCloseReason.DONE);
                        onCreateAccount();
                      }}
                      accessibilityRole="button"
                      style={({ hovered }: { hovered?: boolean }) => [
                        styles.createAccount,
                        webPointer,
                        hovered && styles.hovered,
                      ]}
                    >
                      <Text style={styles.createAccountText}>Create an account →</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <View>
                  <View style={styles.pitchRow}>
                    <View style={styles.iconTile}>
                      <Ionicons name="notifications-outline" size={19} color={NL.bg} />
                    </View>
                    <View style={styles.textColumn}>
                      <Text style={styles.title}>Audition alerts</Text>
                      <Text style={styles.body}>
                        Every Sunday, the week's new auditions in your inbox.
                      </Text>
                      {!isGuest && (
                        <Text style={styles.lockedEmail} numberOfLines={1}>
                          Alerts go to{" "}
                          <Text style={styles.lockedEmailStrong}>{form.lockedEmail}</Text>
                        </Text>
                      )}
                    </View>
                    <CloseButton onPress={() => close()} />
                  </View>

                  {step === Step.PITCH ? (
                    <View style={styles.pitchActions}>
                      <Pressable
                        onPress={handleGetAlerts}
                        disabled={form.isSubmitting}
                        accessibilityRole="button"
                        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                          styles.primaryButton,
                          webPointer,
                          hovered && styles.hovered,
                          pressed && styles.pressed,
                          form.isSubmitting && styles.disabled,
                        ]}
                      >
                        {form.isSubmitting ? (
                          <ActivityIndicator size="small" color={NL.bg} />
                        ) : (
                          <Text style={styles.primaryButtonText}>Get alerts</Text>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => close()}
                        accessibilityRole="button"
                        style={({ hovered }: { hovered?: boolean }) => [
                          styles.ghostButton,
                          webPointer,
                          hovered && styles.hovered,
                        ]}
                      >
                        <Text style={styles.ghostButtonText}>Not now</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.emailStep}>
                      <View style={styles.field}>
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
                        <Pressable
                          onPress={form.submit}
                          disabled={form.isSubmitting}
                          accessibilityRole="button"
                          accessibilityLabel="Subscribe"
                          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                            styles.arrowButton,
                            webPointer,
                            hovered && styles.hovered,
                            pressed && styles.pressed,
                            form.isSubmitting && styles.disabled,
                          ]}
                        >
                          {form.isSubmitting ? (
                            <ActivityIndicator size="small" color={NL.bg} />
                          ) : (
                            <Ionicons name="arrow-forward" size={17} color={NL.bg} />
                          )}
                        </Pressable>
                      </View>
                      {!!form.emailSuggestion && (
                        <EmailSuggestion
                          suggestion={form.emailSuggestion}
                          onAccept={form.acceptEmailSuggestion}
                          variant="light"
                        />
                      )}
                      <PopupConsent
                        form={form}
                        onOpenPrivacyPolicy={onOpenPrivacyPolicy}
                        tone="light"
                      />
                    </View>
                  )}

                  {/* Signed-in users submit from the pitch, so the error shows there too. */}
                  {!!form.error && (
                    <View style={styles.errorSlot}>
                      <PopupError message={form.error} />
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "absolute",
  },
  card: {
    backgroundColor: NL.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NL.hairline,
    padding: 18,
    ...Platform.select({
      web: {
        boxShadow: "0 24px 48px -24px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.04)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 10,
      },
    }),
  },

  // ─── Pitch ───
  pitchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontFamily: INTER,
    fontSize: 15,
    fontWeight: "700",
    color: NL.ink,
  },
  body: {
    fontFamily: INTER,
    fontSize: 13,
    lineHeight: 18,
    color: NL.muted,
  },
  lockedEmail: {
    fontFamily: INTER,
    fontSize: 12.5,
    color: NL.muted,
    marginTop: 4,
  },
  lockedEmailStrong: {
    fontWeight: "700",
    color: NL.ink,
  },
  pitchActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    // Lines the buttons up with the copy, past the 40px icon and its gap.
    paddingLeft: 52,
  },
  primaryButton: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 112,
  },
  primaryButtonText: {
    fontFamily: INTER,
    fontSize: 14,
    fontWeight: "700",
    color: NL.bg,
  },
  ghostButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    fontFamily: INTER,
    fontSize: 13,
    color: NL.muted,
  },

  // ─── Email step ───
  emailStep: {
    marginTop: 16,
    gap: 10,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: NL.fieldBorder,
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: INTER,
    fontSize: 15,
    color: NL.ink,
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  errorSlot: {
    marginTop: 12,
  },

  // ─── Success ───
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  successMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: NL.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  createAccount: {
    alignSelf: "flex-start",
    marginTop: 12,
    marginLeft: 40,
    paddingVertical: 4,
  },
  createAccountText: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: "700",
    color: NL.ink,
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
