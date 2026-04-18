import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, Image, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SERIF, SANS, MONO, INK_2, INK_3, landingStyles, wrap, hPad } from "@/theme/landing";
import { Colors } from "@/theme/colors";
import { TABLET_BREAKPOINT } from "@/constants/layout";

interface HeroSectionProps {
  width: number;
  onGoAuditions: () => void;
  onGoAlerts: () => void;
}

export default function HeroSection({ width, onGoAuditions, onGoAlerts }: HeroSectionProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);

  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  return (
    <View style={{ paddingHorizontal: pH, paddingTop: isMobile ? 48 : 72, paddingBottom: isMobile ? 64 : 100 }}>
      <View
        style={{
          maxWidth: wrap(width),
          alignSelf: "center",
          width: "100%",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 32 : 40,
          alignItems: isMobile ? "flex-start" : "center",
        }}
      >
        {/* Copy */}
        <View style={{ flex: isMobile ? undefined : 1.15, gap: 0 }}>
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: INK_3,
              marginBottom: 32,
            }}
          >
            {"— "}For dancers & companies — free, always
          </Text>

          <Text
            style={{
              fontFamily: SERIF,
              fontWeight: "400",
              fontSize: isMobile ? 52 : Math.min(96, width * 0.072),
              lineHeight: isMobile ? 50 : Math.min(94, width * 0.07),
              letterSpacing: -0.5,
              color: Colors.text,
              marginBottom: 28,
            }}
          >
            Every audition.{"\n"}Every company.{"\n"}
            <Text style={{ fontStyle: "italic" }}>One </Text>
            <Text style={{ fontStyle: "italic", color: Colors.purple }}>place.</Text>
          </Text>

          <Text
            style={{
              fontFamily: SANS,
              fontSize: 18,
              lineHeight: 28,
              color: INK_2,
              maxWidth: 500,
              marginBottom: 40,
            }}
          >
            Danza is a worldwide directory of ballet companies and their open auditions — curated, searchable, and delivered weekly to your inbox.
          </Text>

          <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
            <Pressable onPress={onGoAuditions} style={landingStyles.btnPrimary} accessibilityRole="button">
              <Text style={[landingStyles.btnPrimaryText, { fontFamily: SANS }]}>Browse Auditions</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </Pressable>
            <Pressable onPress={onGoAlerts} style={landingStyles.btnGhost} accessibilityRole="button">
              <Text style={[landingStyles.btnGhostText, { fontFamily: SANS }]}>Subscribe to Alerts</Text>
            </Pressable>
          </View>
        </View>

        {/* Visual */}
        {!isMobile && (
          <View
            style={{
              flex: 0.85,
              aspectRatio: 1 / 1.1,
              minHeight: 400,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: "8%",
                left: "12%",
                right: "2%",
                bottom: "8%",
                borderRadius: 9999,
                backgroundColor: Colors.purpleLight,
              }}
            />
            <Animated.View style={{ transform: [{ translateY: floatY }], width: "130%", alignItems: "center" }}>
              <Image
                source={require("../../../assets/images/favicon.png")}
                style={{ width: "100%", height: undefined, aspectRatio: 1 }}
                resizeMode="contain"
              />
            </Animated.View>
            <View style={landingStyles.heroMark}>
              <View style={landingStyles.heroDot} />
              <Text style={[landingStyles.heroMarkText, { fontFamily: MONO }]}>Danza · Est. 2026</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
