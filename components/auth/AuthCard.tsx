import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/theme/colors";
import { AUTH_CARD_MAX_WIDTH } from "@/constants/layout";
import { authStyles } from "./authStyles";
import { useAuthScale } from "./useAuthScale";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Shared, borderless auth-screen layout for login / register / reset-password.
 * Sits directly on the white page (no card/shadow), fades + slides in on
 * mount, and (optionally) shows the app's mark plainly above the title.
 */
export default function AuthCard({ title, subtitle, showLogo = true, children, footer }: AuthCardProps) {
  const scale = useAuthScale();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.page}>
      <Animated.View
        style={[
          styles.content,
          {
            maxWidth: AUTH_CARD_MAX_WIDTH,
            paddingHorizontal: scale.isCompact ? 8 : 0,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        {showLogo && (
          <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
            <Image
              source={require("@/assets/images/favicon.png")}
              style={{ width: scale.logoSize, height: scale.logoSize }}
              resizeMode="contain"
            />
          </Animated.View>
        )}

        <Text style={[authStyles.title, scale.title]}>{title}</Text>
        {!!subtitle && <Text style={[authStyles.subtitle, scale.subtitle]}>{subtitle}</Text>}

        <View style={styles.body}>{children}</View>

        {footer}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: Colors.white,
  },
  logoWrap: {
    alignSelf: "center",
    marginBottom: 20,
  },
  body: {
    marginTop: 28,
  },
});
