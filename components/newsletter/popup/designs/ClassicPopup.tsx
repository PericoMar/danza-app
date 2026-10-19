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

/** The original design: a centered card over a dark backdrop. */
export function ClassicPopup({
  form,
  onClose,
  onOpenPrivacyPolicy,
  onCreateAccount,
  autoCloseAfterSuccessMs,
}: NewsletterPopupViewProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < SMALL_SCREEN_BREAKPOINT;
  const isGuest = !form.lockedEmail;
  const { progress, opacity, close } = usePopupPresence({
    onClose,
    isSubscribed: form.isSubscribed,
    autoCloseAfterSuccessMs,
  });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

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
        {/* The entrance scale lives on a borderless wrapper: on iOS a bordered
            view sizes its background from its scaled frame and never resizes
            it, which left the white card at 90% inside a full-size border. */}
        <Animated.View style={[styles.modalFrame, { opacity, transform: [{ scale }] }]}>
          <View style={[styles.modal, isSmallScreen && styles.modalSmall]}>
            <CloseButton onPress={() => close()} style={styles.closeButton} />

            {form.isSubscribed ? (
              <View style={styles.successContainer}>
                <View style={styles.successMark}>
                  <Ionicons name="checkmark" size={16} color={NL.bg} />
                </View>
                <Text style={styles.successEyebrow}>Subscribed</Text>
                <Text style={[styles.successTitle, isSmallScreen && styles.titleSmall]}>
                  You're in.
                </Text>
                <Text style={styles.successText}>
                  You'll receive audition alerts at{" "}
                  <Text style={styles.emailHighlight}>{form.subscribedEmail}</Text>
                </Text>
                {form.isValidating && <ValidatingNotice isCentered />}
                {isGuest && (
                  <Pressable
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.registerButton,
                      Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
                      hovered ? styles.registerButtonHovered : null,
                    ]}
                    onPress={() => {
                      close(NewsletterPopupCloseReason.DONE);
                      onCreateAccount();
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.registerButtonText}>Create an account</Text>
                    <Ionicons name="arrow-forward" size={16} color={NL.bg} />
                  </Pressable>
                )}
              </View>
            ) : (
              <>
                <View style={styles.header}>
                  <View style={styles.eyebrow}>
                    <View style={styles.eyebrowDot} />
                    <Text style={styles.eyebrowText}>Every Sunday</Text>
                  </View>
                  <Text style={[styles.title, isSmallScreen && styles.titleSmall]}>
                    Never miss an audition.
                  </Text>
                  <Text style={styles.subtitle}>
                    One email every Sunday with all the week's auditions — free,
                    no spam, cancel anytime.
                  </Text>
                </View>

                <View style={styles.form}>
                  {isGuest ? (
                    <View style={styles.inputPill}>
                      <Ionicons name="mail-outline" size={18} color={NL.muted} />
                      <TextInput
                        {...POPUP_EMAIL_INPUT_PROPS}
                        style={styles.input}
                        placeholder={POPUP_EMAIL_PLACEHOLDER}
                        placeholderTextColor={NL.muted}
                        value={form.email}
                        onChangeText={form.setEmail}
                        onSubmitEditing={form.submit}
                        editable={!form.isSubmitting}
                      />
                    </View>
                  ) : (
                    <View style={styles.inputPill}>
                      <Ionicons name="mail" size={18} color={NL.ink} />
                      <Text style={styles.loggedInEmailText} numberOfLines={1}>
                        {form.lockedEmail}
                      </Text>
                    </View>
                  )}

                  {!!form.emailSuggestion && (
                    <EmailSuggestion
                      suggestion={form.emailSuggestion}
                      onAccept={form.acceptEmailSuggestion}
                      variant="light"
                    />
                  )}

                  <PopupConsent form={form} onOpenPrivacyPolicy={onOpenPrivacyPolicy} />

                  <PopupError message={form.error} />

                  <Pressable
                    style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                      styles.submitButton,
                      Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
                      hovered && styles.submitButtonHovered,
                      pressed && styles.submitButtonPressed,
                      form.isSubmitting && styles.submitButtonDisabled,
                    ]}
                    onPress={form.submit}
                    disabled={form.isSubmitting}
                    accessibilityRole="button"
                  >
                    {form.isSubmitting ? (
                      <ActivityIndicator size="small" color={NL.bg} />
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>Subscribe now</Text>
                        <Ionicons name="arrow-forward" size={17} color={NL.bg} />
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.dismissButton}
                    onPress={() => close()}
                    accessibilityRole="button"
                  >
                    <Text style={styles.dismissButtonText}>Maybe later</Text>
                  </Pressable>
                </View>

                <View style={styles.footNote}>
                  <View style={styles.avatarStack}>
                    {["🩰", "💃", "🎭"].map((emoji, i) => (
                      <View key={i} style={[styles.avatar, i > 0 && styles.avatarOverlap]}>
                        <Text style={styles.avatarEmoji}>{emoji}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.footNoteText}>
                    Join dancers who never miss an opportunity
                  </Text>
                </View>

                <View style={styles.trustRow}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={NL.muted} />
                  <Text style={styles.footNoteText}>Free. No spam. Unsubscribe anytime.</Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  centeredContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    pointerEvents: "box-none",
  },
  modalFrame: {
    maxWidth: 440,
    width: "100%",
  },
  modal: {
    backgroundColor: NL.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NL.hairline,
    padding: 36,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 0 rgba(0,0,0,.03), 0 30px 60px -30px rgba(0,0,0,.35)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 12,
      },
    }),
  },
  modalSmall: {
    padding: 24,
    borderRadius: 16,
  },
  closeButton: {
    position: "absolute",
    top: 18,
    right: 18,
  },

  // ─── Header ───
  header: {
    paddingRight: 24,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: NL.ink,
  },
  eyebrowText: {
    fontFamily: INTER,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    color: NL.ink,
  },
  title: {
    fontFamily: INTER,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -1,
    color: NL.ink,
    marginBottom: 10,
  },
  titleSmall: {
    fontSize: 23,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: INTER,
    fontSize: 14.5,
    lineHeight: 21,
    color: NL.muted,
  },

  // ─── Form ───
  form: {
    marginTop: 26,
    gap: 14,
  },
  inputPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: NL.bg,
    borderWidth: 1,
    borderColor: NL.fieldBorder,
    borderRadius: 999,
    paddingHorizontal: 20,
    height: 54,
  },
  input: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 15.5,
    color: NL.ink,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },
  loggedInEmailText: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 15,
    fontWeight: "600",
    color: NL.ink,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: NL.ink,
    borderRadius: 999,
    height: 54,
    ...Platform.select({
      web: {
        transition: "opacity 0.15s, transform 0.1s",
      },
    }),
  },
  submitButtonHovered: {
    opacity: 0.9,
  },
  submitButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: INTER,
    fontSize: 15.5,
    fontWeight: "700",
    color: NL.bg,
  },
  dismissButton: {
    alignItems: "center",
    padding: 6,
  },
  dismissButtonText: {
    fontFamily: INTER,
    fontSize: 13,
    color: NL.muted,
  },

  // ─── Social proof + trust note ───
  footNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: NL.hairline,
  },
  avatarStack: {
    flexDirection: "row",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: NL.bg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: NL.fieldBorder,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarEmoji: {
    fontSize: 14,
  },
  footNoteText: {
    // A row child does not shrink by default, so without this the copy keeps
    // its one-line width and spills out of the modal on narrow screens.
    flexShrink: 1,
    fontFamily: INTER,
    fontSize: 12,
    color: NL.muted,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },

  // ─── Success state ───
  successContainer: {
    alignItems: "center",
    paddingVertical: 6,
  },
  successMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: NL.ink,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successEyebrow: {
    fontFamily: INTER,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    color: NL.ink,
    marginBottom: 10,
  },
  successTitle: {
    fontFamily: INTER,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -1,
    color: NL.ink,
    marginBottom: 8,
  },
  successText: {
    fontFamily: INTER,
    fontSize: 14.5,
    lineHeight: 21,
    color: NL.muted,
    textAlign: "center",
  },
  emailHighlight: {
    fontWeight: "700",
    color: NL.ink,
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: NL.ink,
    borderRadius: 999,
    height: 50,
    paddingHorizontal: 26,
    marginTop: 22,
  },
  registerButtonHovered: {
    opacity: 0.9,
  },
  registerButtonText: {
    fontFamily: INTER,
    fontSize: 14.5,
    fontWeight: "700",
    color: NL.bg,
  },
});
