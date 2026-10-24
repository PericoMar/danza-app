import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAuth } from "@/app/_layout";
import { useNewsletter } from "@/hooks/useNewsletter";
import { SubscriptionStatus } from "@/types/newsletter";
import { NEWSLETTER_ROUTE } from "@/constants/routes";
import { INSIGHTS_CARD_RADIUS } from "@/constants/layout";
import ChromeSurface from "@/components/companies/ChromeSurface";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/insights";

const REVEAL_DURATION_MS = 400;
const REVEAL_OFFSET = 8;
const ICON_SIZE = 38;

/** Invites anyone not yet on the newsletter to the weekly audition alerts. */
export default function AuditionAlertsNudge() {
  const { session } = useAuth();
  const router = useRouter();
  const { status } = useNewsletter({ userEmail: session?.user?.email ?? null });
  const isVisible = status === SubscriptionStatus.NOT_SUBSCRIBED;
  const [hovered, setHovered] = useState(false);

  const reveal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isVisible) return;
    Animated.timing(reveal, {
      toValue: 1,
      duration: REVEAL_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [isVisible, reveal]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: reveal,
          transform: [
            { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [REVEAL_OFFSET, 0] }) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={() => router.push(NEWSLETTER_ROUTE)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        accessibilityRole="link"
        accessibilityLabel="Never miss an audition: get weekly audition alerts"
        style={({ pressed }) => [
          styles.card,
          webPointer,
          hovered && styles.cardHovered,
          pressed && styles.cardPressed,
        ]}
  >
        <ChromeSurface variant="chromeSoft" borderRadius={ICON_SIZE / 2} style={styles.icon}>
          <Ionicons name="mail-outline" size={17} color={Colors.grey1} />
        </ChromeSurface>
        <View style={styles.copy}>
          <Text style={styles.title}>Never miss an audition</Text>
          <Text style={styles.subtitle}>New open calls in your inbox, every week.</Text>
        </View>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={hovered ? Colors.text : Colors.grey2}
          style={hovered && styles.arrowHovered}
        />
      </Pressable>
    </Animated.View>
  );
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: INSIGHTS_CARD_RADIUS,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 2px rgba(17,19,24,0.04), 0 24px 48px -28px rgba(30,34,44,0.32)",
      },
      default: {
        shadowColor: Colors.text,
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
      },
    }),
  },
  cardHovered: {
    borderColor: Colors.silver,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 2px rgba(17,19,24,0.06), 0 28px 52px -26px rgba(30,34,44,0.42)",
      },
      default: {},
    }),
  },
  cardPressed: {
    opacity: 0.7,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: INTER,
    fontSize: 14.5,
    fontWeight: "600",
    color: Colors.text,
  },
  subtitle: {
    fontFamily: INTER,
    fontSize: 13,
    color: Colors.grey2,
  },
  arrowHovered: {
    transform: [{ translateX: 2 }],
  },
});
