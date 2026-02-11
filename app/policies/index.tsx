import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/theme/colors";
import { MOBILE_BREAKPOINT } from "@/constants/layout";

const policies = [
  {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your personal data.",
    icon: "shield-checkmark-outline" as const,
    route: "/policies/privacy-policy" as const,
  },
  {
    title: "Terms and Conditions",
    description: "Rules and guidelines for using danza.app.",
    icon: "document-text-outline" as const,
    route: "/policies/terms" as const,
  },
];

export default function PoliciesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          !isMobile && styles.containerDesktop,
        ]}
      >
        <Text style={styles.heading}>Legal & Policies</Text>
        <Text style={styles.subtitle}>
          Review our policies and legal information below.
        </Text>

        <View style={styles.cards}>
          {policies.map((policy) => (
            <Pressable
              key={policy.route}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push(policy.route)}
              accessibilityRole="button"
            >
              <View style={styles.cardIcon}>
                <Ionicons name={policy.icon} size={28} color={Colors.purple} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{policy.title}</Text>
                <Text style={styles.cardDescription}>{policy.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <View style={styles.contact}>
          <Text style={styles.contactText}>
            For any questions, contact us at{" "}
            <Text style={styles.contactEmail}>danza.app.official@gmail.com</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  containerDesktop: {
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textLightDark,
    marginBottom: 28,
  },
  cards: {
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.purpleLight,
    borderRadius: 12,
    padding: 18,
    gap: 14,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textLightDark,
  },
  contact: {
    marginTop: 32,
    alignItems: "center",
  },
  contactText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
  },
  contactEmail: {
    color: Colors.purple,
    fontWeight: "500",
  },
});
