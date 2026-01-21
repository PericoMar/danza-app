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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Portal } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/app/_layout";
import { Colors } from "@/theme/colors";
import { SMALL_SCREEN_BREAKPOINT } from "@/constants/layout";

const STORAGE_KEY = "newsletter_dismissed";
const STORAGE_SUBSCRIBED_KEY = "newsletter_subscribed";
// Show popup between 5-10 seconds for optimal retention
const MIN_DELAY_MS = 5000;
const MAX_DELAY_MS = 10000;

const DAYS_WITHOUT_NEWSLETTER_MODAL = 2;

interface NewsletterModalProps {
  /** Force show for testing purposes */
  forceShow?: boolean;
}

export default function NewsletterModal({ forceShow }: NewsletterModalProps) {
  const { session, loading: authLoading } = useAuth();
  const isLoggedIn = !!session;
  const userEmail = session?.user?.email ?? "";

  const { width } = useWindowDimensions();
  const isSmallScreen = width < SMALL_SCREEN_BREAKPOINT;

  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (forceShow) {
      showModal();
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const checkAndSchedule = async () => {
      try {
        // Check if already subscribed
        const subscribed = await AsyncStorage.getItem(STORAGE_SUBSCRIBED_KEY);
        if (subscribed === "true") return;

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
  }, [authLoading, forceShow, showModal]);

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

      const response = await fetch(`${API_BASE_URL}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: subscribeEmail,
          source: "newsletter_modal",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Subscription failed");
      }

      // Mark as subscribed locally
      await AsyncStorage.setItem(STORAGE_SUBSCRIBED_KEY, "true");

      setSubmitSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        hideModal(false);
      }, 2000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Portal>
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
      <View style={styles.centeredContainer} pointerEvents="box-none">
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
            style={styles.closeButton}
            onPress={() => hideModal()}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={24} color={Colors.textMuted} />
          </Pressable>

          {submitSuccess ? (
            // Success state
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.purple} />
              </View>
              <Text style={styles.successTitle}>You're in! 🎉</Text>
              <Text style={styles.successText}>
                You'll receive audition alerts directly in your inbox.
              </Text>
            </View>
          ) : (
            // Form state
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="notifications" size={32} color={Colors.purple} />
                </View>
                <Text style={styles.title}>Never Miss an Audition</Text>
                <Text style={styles.subtitle}>
                  Get notified when new dance auditions are posted. Join 2,000+ dancers who stay ahead.
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {!isLoggedIn ? (
                  // Guest view: email input
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={Colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor={Colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                  </View>
                ) : (
                  // Logged in view: show email
                  <View style={styles.loggedInEmail}>
                    <Ionicons name="mail" size={20} color={Colors.purple} />
                    <Text style={styles.loggedInEmailText}>{userEmail}</Text>
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
                    {gdprConsent && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I agree to receive audition alerts and accept the{" "}
                    <Text style={styles.link}>Privacy Policy</Text>
                  </Text>
                </Pressable>

                {/* Error message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#e53935" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Submit button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && styles.submitButtonPressed,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                >
                  {isSubmitting ? (
                    <Text style={styles.submitButtonText}>Subscribing...</Text>
                  ) : (
                    <>
                      <Ionicons name="notifications-outline" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Get Audition Alerts</Text>
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

              {/* Social proof */}
              <View style={styles.socialProof}>
                <View style={styles.avatarStack}>
                  {["🩰", "💃", "🎭"].map((emoji, i) => (
                    <View key={i} style={[styles.avatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                      <Text style={styles.avatarEmoji}>{emoji}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.socialProofText}>
                  Join dancers from top companies worldwide
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  centeredContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    maxWidth: 420,
    width: "100%",
    ...Platform.select({
      web: {
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.25,
        shadowRadius: 50,
        elevation: 20,
      },
    }),
  },
  modalSmall: {
    padding: 24,
    borderRadius: 16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textLightDark,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },
  loggedInEmail: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  loggedInEmailText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textLightDark,
    lineHeight: 20,
  },
  link: {
    color: Colors.purple,
    textDecorationLine: "underline",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#c62828",
    flex: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.purple,
    borderRadius: 12,
    height: 52,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "transform 0.1s, background-color 0.2s",
      },
    }),
  },
  submitButtonPressed: {
    backgroundColor: Colors.purpleDark,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  dismissButton: {
    alignItems: "center",
    padding: 8,
  },
  dismissButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  socialProof: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceAlt,
    gap: 12,
  },
  avatarStack: {
    flexDirection: "row",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarEmoji: {
    fontSize: 16,
  },
  socialProofText: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
  // Success state
  successContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  successText: {
    fontSize: 15,
    color: Colors.textLightDark,
    textAlign: "center",
  },
});
