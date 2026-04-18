import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SERIF, SANS, MONO, DARK, landingStyles, wrap, hPad } from "@/theme/landing";
import { Colors } from "@/theme/colors";
import { useNewsletter } from "@/hooks/useNewsletter";
import { TABLET_BREAKPOINT } from "@/constants/layout";

interface NewsletterCtaSectionProps {
  width: number;
}

export default function NewsletterCtaSection({ width }: NewsletterCtaSectionProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const { email, setEmail, isSubmitting, handleSubscribe } = useNewsletter({ userEmail: null });

  const onSubscribePress = async () => {
    await handleSubscribe();
    setSubscribeSuccess(true);
    setTimeout(() => setSubscribeSuccess(false), 4500);
  };

  return (
    <View style={{ backgroundColor: DARK, paddingVertical: isMobile ? 80 : 120, paddingHorizontal: pH, overflow: "hidden" }}>
      <LinearGradient
        colors={["rgba(119,85,255,0.18)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View
        style={{
          maxWidth: wrap(width),
          alignSelf: "center",
          width: "100%",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 40 : 80,
          alignItems: isMobile ? "flex-start" : "center",
        }}
      >
        <View style={{ flex: 1.1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <View style={{ width: 26, height: 1, backgroundColor: Colors.purpleSoft }} />
            <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: Colors.purpleSoft }}>
              The Danza Weekly
            </Text>
          </View>
          <Text
            style={{
              fontFamily: SERIF,
              fontWeight: "400",
              fontSize: isMobile ? 44 : Math.min(72, width * 0.055),
              lineHeight: isMobile ? 42 : Math.min(70, width * 0.053),
              letterSpacing: -0.5,
              color: "#fff",
              marginBottom: 22,
            }}
          >
            Never miss an{"\n"}
            <Text style={{ fontStyle: "italic", color: Colors.purpleSoft }}>audition</Text> again.
          </Text>
          <Text style={{ fontFamily: SANS, fontSize: 17, lineHeight: 26, color: "rgba(255,255,255,0.72)", maxWidth: 440 }}>
            One email, every Sunday morning. A considered round-up of the week's newly-opened calls — from corps de ballet to principal, Paris to Tokyo.
          </Text>
        </View>

        <View style={{ flex: 0.9, width: isMobile ? "100%" : undefined }}>
          <View style={[landingStyles.ctaForm, { flexDirection: isMobile ? "column" : "row" }]}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="rgba(255,255,255,0.38)"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[landingStyles.ctaInput, { fontFamily: SANS }]}
              accessibilityLabel="Email address"
            />
            <Pressable
              onPress={onSubscribePress}
              disabled={isSubmitting || subscribeSuccess}
              style={[landingStyles.ctaBtn, subscribeSuccess && landingStyles.ctaBtnSent]}
              accessibilityRole="button"
            >
              <Text style={[landingStyles.ctaBtnText, { fontFamily: SANS }]}>
                {subscribeSuccess ? "✓  Subscribed" : isSubmitting ? "Subscribing…" : "Subscribe"}
              </Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14, gap: 8, flexWrap: "wrap" }}>
            {["Free forever", "Unsubscribe any time", "No spam"].map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && <Text style={{ color: Colors.purpleSoft, opacity: 0.7 }}>·</Text>}
                <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                  {t}
                </Text>
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
