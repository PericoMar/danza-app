import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  /**
   * Ancho de la columna. Por defecto el de un formulario; una pantalla que no
   * lo es (elegir entre dos tarjetas) necesita más sitio en escritorio.
   */
  maxWidth?: number;
}

/**
 * Shared, borderless auth-screen layout for login / register / reset-password.
 * Sits directly on the white page (no card/shadow), fades + slides in on
 * mount, and (optionally) shows the app's mark plainly above the title.
 *
 * The form sits in a ScrollView inside a KeyboardAvoidingView so that, on a
 * phone with the keyboard open, the user can still scroll down to the next
 * field or the submit button instead of having it hidden behind the keyboard.
 */
export default function AuthCard({
  title,
  subtitle,
  showLogo = true,
  children,
  footer,
  maxWidth = AUTH_CARD_MAX_WIDTH,
}: AuthCardProps) {
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
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "web" ? undefined : "padding"}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              maxWidth,
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
