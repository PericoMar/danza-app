import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/app/_layout";
import Snackbar from "@/components/Snackbar";
import { Colors } from "@/theme/colors";

const MOBILE_BREAKPOINT = 600;

type SubscriptionStatus = "loading" | "subscribed" | "not_subscribed";

export default function NewsletterScreen() {
  const { session } = useAuth();
  const userEmail = session?.user?.email;
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const [status, setStatus] = useState<SubscriptionStatus>("loading");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    color?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
  } | null>(null);

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      const emailToCheck = userEmail || null;
      if (!emailToCheck) {
        setStatus("not_subscribed");
        return;
      }

      const { data, error } = await supabase
        .from("newsletter_subscriptions")
        .select("status")
        .eq("email", emailToCheck.toLowerCase())
        .single();

      if (error || !data) {
        setStatus("not_subscribed");
      } else if (data.status === "subscribed") {
        setStatus("subscribed");
      } else {
        setStatus("not_subscribed");
      }
    };

    checkSubscription();
  }, [userEmail]);

  const handleSubscribe = async () => {
    const subscribeEmail = userEmail || email.trim();

    if (!subscribeEmail) {
      setSnackbar({
        message: "Please enter your email address",
        color: "#EF4444",
        iconName: "alert-circle-outline",
      });
      return;
    }

    if (!isValidEmail(subscribeEmail)) {
      setSnackbar({
        message: "Please enter a valid email address",
        color: "#EF4444",
        iconName: "alert-circle-outline",
      });
      return;
    }

    setIsSubmitting(true);

    try {
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
          source: "newsletter_page",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Subscription failed");
      }

      setStatus("subscribed");
      setSnackbar({
        message: "You're subscribed! Welcome aboard.",
        color: "#22C55E",
        iconName: "checkmark-circle-outline",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setSnackbar({
        message,
        color: "#EF4444",
        iconName: "alert-circle-outline",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsubscribe = async () => {
    const unsubEmail = userEmail;
    if (!unsubEmail) return;

    setIsSubmitting(true);

    try {
      const DEV_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:3000"
          : "http://localhost:3000";
      const API_BASE_URL = __DEV__
        ? DEV_BASE
        : (process.env.EXPO_PUBLIC_API_BASE ?? "");

      const response = await fetch(`${API_BASE_URL}/api/newsletter/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unsubEmail }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unsubscribe failed");
      }

      setStatus("not_subscribed");
      setSnackbar({
        message: "You've been unsubscribed successfully.",
        color: "#22C55E",
        iconName: "checkmark-circle-outline",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setSnackbar({
        message,
        color: "#EF4444",
        iconName: "alert-circle-outline",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.purple} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={4000}
          onClose={() => setSnackbar(null)}
        />
      )}

      <ScrollView contentContainerStyle={[styles.container, !isMobile && styles.containerDesktop]}>
        <View style={styles.content}>
          {status === "subscribed" ? (
            // SUBSCRIBED VIEW
            <View style={styles.section}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.purple} />
              </View>
              <Text style={styles.title}>You're Subscribed!</Text>
              <Text style={styles.subtitle}>
                You're receiving audition alerts at{" "}
                <Text style={styles.emailHighlight}>{userEmail}</Text>
              </Text>

              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="notifications" size={20} color={Colors.purple} />
                  <Text style={styles.benefitText}>New audition alerts</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="flash" size={20} color={Colors.purple} />
                  <Text style={styles.benefitText}>Early access to opportunities</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="heart" size={20} color={Colors.purple} />
                  <Text style={styles.benefitText}>Curated content for dancers</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.unsubscribeLabel}>
                Want to stop receiving emails?
              </Text>
              <Pressable
                style={styles.unsubscribeButton}
                onPress={handleUnsubscribe}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.textMuted} />
                ) : (
                  <Text style={styles.unsubscribeButtonText}>Unsubscribe</Text>
                )}
              </Pressable>
            </View>
          ) : (
            // NOT SUBSCRIBED VIEW
            <View style={styles.section}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-unread" size={64} color={Colors.purple} />
              </View>
              <Text style={styles.title}>Stay in the Loop</Text>
              <Text style={styles.subtitle}>
                Get notified when new dance auditions are posted. Join thousands
                of dancers who never miss an opportunity.
              </Text>

              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="notifications" size={20} color={Colors.purple} />
                  <Text style={styles.benefitText}>
                    Instant alerts for new auditions
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="trending-up" size={20} color={Colors.purple} />
                  <Text style={styles.benefitText}>
                    Company updates & industry news
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="gift" size={20} color={Colors.purple} />
                  <Text style={styles.benefitText}>
                    Exclusive tips & resources
                  </Text>
                </View>
              </View>

              {!userEmail && (
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
              )}

              {userEmail && (
                <View style={styles.loggedInEmail}>
                  <Ionicons name="mail" size={20} color={Colors.purple} />
                  <Text style={styles.loggedInEmailText}>{userEmail}</Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.subscribeButton,
                  pressed && styles.subscribeButtonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleSubscribe}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="notifications-outline" size={20} color="#fff" />
                    <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.privacyNote}>
                We respect your privacy. Unsubscribe anytime.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  containerDesktop: {
    paddingTop: 60,
  },
  content: {
    width: "100%",
    maxWidth: 480,
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLightDark,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  emailHighlight: {
    fontWeight: "600",
    color: Colors.purple,
  },
  benefitsList: {
    width: "100%",
    gap: 16,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    color: Colors.textLightDark,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    width: "100%",
    marginBottom: 16,
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
    width: "100%",
    gap: 12,
    marginBottom: 16,
  },
  loggedInEmailText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
  subscribeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.purple,
    borderRadius: 12,
    height: 52,
    width: "100%",
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "transform 0.1s, background-color 0.2s",
      },
    }),
  },
  subscribeButtonPressed: {
    backgroundColor: Colors.purpleDark,
    transform: [{ scale: 0.98 }],
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  privacyNote: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 16,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: Colors.surfaceAlt,
    marginVertical: 24,
  },
  unsubscribeLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  unsubscribeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.textMuted,
  },
  unsubscribeButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
