import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";

const MOBILE_BREAKPOINT = 600;
const SUPPORT_EMAIL = "danza.app.official@gmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/danza_app/";

export default function SupportScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const handleInstagramPress = () => {
    if (Platform.OS === "web") {
      window.open(INSTAGRAM_URL, "_blank");
    } else {
      Linking.openURL(INSTAGRAM_URL);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          !isMobile && styles.containerDesktop,
        ]}
      >
        <View style={styles.content}>
          <View style={styles.section}>
            {/* Header */}
            <View style={styles.iconContainer}>
              <Ionicons name="bug-outline" size={56} color={Colors.purple} />
            </View>
            <Text style={styles.title}>Found a Bug?</Text>
            <Text style={styles.subtitle}>
              First of all, thank you for taking the time to report it! Your
              feedback helps us make Danza better for everyone.
            </Text>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>
                To help us fix it faster, please include:
              </Text>
              <View style={styles.tipItem}>
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={Colors.purple}
                />
                <Text style={styles.tipText}>
                  Screenshots or screen recordings if possible
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={Colors.purple}
                />
                <Text style={styles.tipText}>
                  A clear description of what happened
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons
                  name="footsteps-outline"
                  size={20}
                  color={Colors.purple}
                />
                <Text style={styles.tipText}>
                  Steps to reproduce the issue
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={Colors.purple}
                />
                <Text style={styles.tipText}>
                  Your device and browser info
                </Text>
              </View>
            </View>

            {/* Contact Options */}
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Get in touch</Text>

              {/* Instagram Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.contactButton,
                  styles.instagramButton,
                  pressed && styles.contactButtonPressed,
                ]}
                onPress={handleInstagramPress}
              >
                <Ionicons name="logo-instagram" size={22} color="#fff" />
                <View style={styles.contactButtonContent}>
                  <Text style={styles.contactButtonText}>DM us on Instagram</Text>
                  <Text style={styles.contactButtonSubtext}>@danza_app</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>

              {/* Email Info */}
              <View style={styles.emailInfo}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                <Text style={styles.emailInfoText}>
                  Or email us at <Text style={styles.emailHighlight}>{SUPPORT_EMAIL}</Text>
                </Text>
              </View>
            </View>

            {/* Footer note */}
            <Text style={styles.footerNote}>
              We usually respond within 24-48 hours. Thanks for helping us
              improve!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    marginBottom: 32,
  },
  tipsContainer: {
    width: "100%",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLightDark,
    lineHeight: 20,
  },
  contactSection: {
    width: "100%",
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  instagramButton: {
    backgroundColor: "#E4405F",
  },
  contactButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  contactButtonContent: {
    flex: 1,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  contactButtonSubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  emailInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  emailInfoText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  emailHighlight: {
    color: Colors.purple,
    fontWeight: "500",
  },
  footerNote: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
