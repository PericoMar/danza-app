// app/+not-found.tsx
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";

const MOBILE_BREAKPOINT = 600;

// Fluid "404" size: 20rem at a small phone up to 40rem on desktop, scaling
// linearly with viewport width in between (1rem = 16px).
const CODE_MIN = 20 * 16; // 320
const CODE_MAX = 40 * 16; // 640
const CODE_MIN_VW = 375;
const CODE_MAX_VW = 1440;
const SCREEN_PADDING = 24; // matches styles.screen paddingHorizontal
// Rendered width of "404" (3 bold digits) per 1px of font size — caps the
// fluid size so it never clips against the viewport on narrower screens.
const DIGITS_WIDTH_RATIO = 1.8;

function codeFontSize(width: number) {
  const t = (width - CODE_MIN_VW) / (CODE_MAX_VW - CODE_MIN_VW);
  const fluid = Math.min(CODE_MAX, Math.max(CODE_MIN, CODE_MIN + t * (CODE_MAX - CODE_MIN)));
  const maxFit = (width - SCREEN_PADDING * 2) / DIGITS_WIDTH_RATIO;
  return Math.round(Math.min(fluid, maxFit));
}

export default function NotFound() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const codeSize = codeFontSize(width);

  return (
    <View style={styles.screen}>
      <SiteHeader />
      <View style={styles.body}>
        <View style={styles.content}>
          <Text style={[styles.code, { fontSize: codeSize, lineHeight: codeSize }]}>404</Text>
          <Text style={styles.title}>Page not found</Text>
          <Text style={styles.subtitle}>
            The page you're looking for doesn't exist or may have been moved.
          </Text>

          <View style={[styles.actions, isMobile && styles.actionsMobile]}>
            <Pressable
              onPress={() => router.push("/home")}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                isMobile && styles.buttonMobile,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="home-outline" size={18} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Go home</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/companies")}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                isMobile && styles.buttonMobile,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="business-outline" size={18} color={Colors.text} />
              <Text style={styles.secondaryButtonText}>Browse companies</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <SiteFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 480,
  },
  code: {
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLightDark,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 32,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  actionsMobile: {
    flexDirection: "column",
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
  },
  buttonMobile: {
    width: "100%",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  primaryButton: {
    backgroundColor: Colors.text,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.text,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
});
