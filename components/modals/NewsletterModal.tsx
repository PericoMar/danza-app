// components/modals/NewsletterModal.tsx
import React, { useState, useEffect, useCallback } from "react";
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
import { Portal } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { INTER } from "@/theme/companies";
import { NL } from "@/components/newsletter/styles";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import { checkNewsletterSubscription } from "@/services/newsletter";

// Pages where the newsletter modal should not appear
const EXCLUDED_PATHS = ["/login", "/register", "/reset-password"];
import { SMALL_SCREEN_BREAKPOINT } from "@/constants/layout";

const STORAGE_KEY = "newsletter_dismissed";
const STORAGE_SUBSCRIBED_KEY = "newsletter_subscribed";
// Show popup between 5-10 seconds for optimal retention
const MIN_DELAY_MS = 5000;
const MAX_DELAY_MS = 10000;

const DAYS_WITHOUT_NEWSLETTER_MODAL = 7;

interface NewsletterModalProps {
  /** Force show for testing purposes */
  forceShow?: boolean;
}

export default function NewsletterModal({ forceShow }: NewsletterModalProps) {
  const { session, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const isLoggedIn = !!session;
  const userEmail = session?.user?.email ?? "";
  const isExcludedPath = EXCLUDED_PATHS.some((p) => pathname?.startsWith(p));

  const { width } = useWindowDimensions();
  const isSmallScreen = width < SMALL_SCREEN_BREAKPOINT;

  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Animation for smooth entrance
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  const showModal = useCallback(() => {
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const hideModal = useCallback(async (markDismissed = true) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });

    if (markDismissed) {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, Date.now().toString());
      } catch (e) {
        console.warn("Failed to save newsletter dismissed state", e);
      }
    }
  }, [fadeAnim, scaleAnim]);

  // Check if we should show the modal
  useEffect(() => {
    if (authLoading) return;
    if (isExcludedPath) return;
    if (forceShow) {
      showModal();
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const checkAndSchedule = async () => {
      try {
        // Check if already subscribed locally
        const subscribed = await AsyncStorage.getItem(STORAGE_SUBSCRIBED_KEY);
        if (subscribed === "true") return;

        // If logged in, verify against the server (covers cross-device subscriptions)
        if (userEmail) {
          const serverStatus = await checkNewsletterSubscription(userEmail);
          if (serverStatus === "subscribed") {
            await AsyncStorage.setItem(STORAGE_SUBSCRIBED_KEY, "true");
            return;
          }
        }

        // Check if dismissed recently (within 7 days)
        const dismissed = await AsyncStorage.getItem(STORAGE_KEY);
        if (dismissed) {
          const dismissedAt = parseInt(dismissed, 10);
          const twoDaysMs = DAYS_WITHOUT_NEWSLETTER_MODAL * 24 * 60 * 60 * 1000;
          if (Date.now() - dismissedAt < twoDaysMs) return;
        }

        // Random delay between 5-10 seconds
        const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
        timeoutId = setTimeout(showModal, delay);
      } catch (e) {
        console.warn("Failed to check newsletter state", e);
      }
    };

    checkAndSchedule();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [authLoading, forceShow, showModal, isExcludedPath, userEmail]);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!isLoggedIn && !email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!isLoggedIn && !isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!gdprConsent) {
      setError("Please accept the terms to continue");
      return;
    }

    setIsSubmitting(true);

    try {
      const subscribeEmail = isLoggedIn ? userEmail : email.trim();

      // Call newsletter API
      const DEV_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:3000"
          : "http://localhost:3000";
      const API_BASE_URL = __DEV__
        ? DEV_BASE
        : (process.env.EXPO_PUBLIC_API_BASE ?? "");

      console.log("[NewsletterModal] Subscribing:", { email: subscribeEmail, url: `${API_BASE_URL}/api/newsletter` });

      let response: Response;
      try {
        response = await fetch(`${API_BASE_URL}/api/newsletter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: subscribeEmail,
            source: "newsletter_modal",
          }),
        });
      } catch (networkError) {
        console.error("[NewsletterModal] Network error:", networkError);
        throw new Error("Network error. Please check your connection.");
      }

      if (!response.ok) {
        // Handle non-JSON error responses gracefully
        const text = await response.text();
        let errorMessage = `Server error (${response.status})`;
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || json.message || errorMessage;
        } catch {
          if (text && text.length < 200) {
            errorMessage = text;
          }
        }
        console.error("[NewsletterModal] Subscribe failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }

      console.log("[NewsletterModal] Subscribe success");

      // Mark as subscribed locally
      await AsyncStorage.setItem(STORAGE_SUBSCRIBED_KEY, "true");

      setSubmitSuccess(true);

      // Auto-close after success (longer delay if not logged in to allow registration)
      setTimeout(() => {
        hideModal(false);
      }, isLoggedIn ? 2000 : 5000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  const subscribedEmail = isLoggedIn ? userEmail : email.trim();

  return (
    <Portal>
      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        visible={showPrivacyPolicy}
        onAccept={() => {
          setGdprConsent(true);
          setShowPrivacyPolicy(false);
        }}
        onCancel={() => setShowPrivacyPolicy(false)}
      />

      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => hideModal()}
          accessibilityRole="button"
          accessibilityLabel="Close newsletter popup"
        />
      </Animated.View>

      {/* Modal */}
      <View style={styles.centeredContainer}>
        <Animated.View
          style={[
            styles.modal,
            isSmallScreen && styles.modalSmall,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close button */}
          <Pressable
            style={({ hovered }) => [
              styles.closeButton,
              Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
              hovered ? styles.closeButtonHovered : null,
            ]}
            onPress={() => hideModal()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={NL.muted} />
          </Pressable>

          {submitSuccess ? (
            // Success state
            <View style={styles.successContainer}>
              <View style={styles.successMark}>
                <Ionicons name="checkmark" size={16} color={NL.bg} />
              </View>
              <Text style={styles.successEyebrow}>Subscribed</Text>
              <Text
                style={[styles.successTitle, isSmallScreen && styles.titleSmall]}
              >
                You're in.
              </Text>
              <Text style={styles.successText}>
                You'll receive audition alerts at{" "}
                <Text style={styles.emailHighlight}>{subscribedEmail}</Text>
              </Text>
              {!isLoggedIn && (
                <Pressable
                  style={({ hovered }) => [
                    styles.registerButton,
                    Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
                    hovered ? styles.registerButtonHovered : null,
                  ]}
                  onPress={() => {
                    hideModal(false);
                    router.push(`/register?email=${encodeURIComponent(email.trim())}`);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.registerButtonText}>Create an account</Text>
                  <Ionicons name="arrow-forward" size={16} color={NL.bg} />
                </Pressable>
              )}
            </View>
          ) : (
            // Form state
            <>
              {/* Header */}
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

              {/* Form */}
              <View style={styles.form}>
                {!isLoggedIn ? (
                  // Guest view: email input
                  <View style={styles.inputPill}>
                    <Ionicons name="mail-outline" size={18} color={NL.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="name@email.com"
                      placeholderTextColor={NL.muted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                      accessibilityLabel="Email address"
                    />
                  </View>
                ) : (
                  // Logged in view: show email
                  <View style={styles.inputPill}>
                    <Ionicons name="mail" size={18} color={NL.ink} />
                    <Text style={styles.loggedInEmailText} numberOfLines={1}>
                      {userEmail}
                    </Text>
                  </View>
                )}

                {/* GDPR Consent Checkbox */}
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => !isSubmitting && setGdprConsent(!gdprConsent)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: gdprConsent }}
                >
                  <View style={[styles.checkbox, gdprConsent && styles.checkboxChecked]}>
                    {gdprConsent && <Ionicons name="checkmark" size={13} color={NL.bg} />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I agree to receive audition alerts and accept the{" "}
                    <Text
                      style={styles.link}
                      onPress={() => setShowPrivacyPolicy(true)}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </Pressable>

                {/* Error message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#b3261e" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Submit button */}
                <Pressable
                  style={({ pressed, hovered }) => [
                    styles.submitButton,
                    Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
                    hovered && styles.submitButtonHovered,
                    pressed && styles.submitButtonPressed,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={NL.bg} />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Subscribe now</Text>
                      <Ionicons name="arrow-forward" size={17} color={NL.bg} />
                    </>
                  )}
                </Pressable>

                {/* Secondary action */}
                <Pressable
                  style={styles.dismissButton}
                  onPress={() => hideModal()}
                  accessibilityRole="button"
                >
                  <Text style={styles.dismissButtonText}>Maybe later</Text>
                </Pressable>
              </View>

              {/* Social proof + trust note */}
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
                <Text style={styles.footNoteText}>
                  Free. No spam. Unsubscribe anytime.
                </Text>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Portal>
  );
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
  modal: {
    backgroundColor: NL.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NL.hairline,
    padding: 36,
    maxWidth: 440,
    width: "100%",
    ...Platform.select({
      web: {
        boxShadow:
          "0 1px 0 rgba(0,0,0,.03), 0 30px 60px -30px rgba(0,0,0,.35)",
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
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  closeButtonHovered: {
    backgroundColor: NL.hairline,
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: NL.fieldBorder,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: NL.ink,
    borderColor: NL.ink,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 12.5,
    lineHeight: 18,
    color: NL.muted,
  },
  link: {
    color: NL.ink,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fdecea",
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontFamily: INTER,
    fontSize: 13,
    color: "#b3261e",
    flex: 1,
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
