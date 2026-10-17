import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SANS } from "@/theme/landing";
import { NewsletterField, ValidatingNotice } from "@/components/newsletter";
import { SubscriptionStatus, hasSubscribed } from "@/types/newsletter";
import { Page, SectionHeader } from "./HomeSection";
import { homeStyles as styles, ALERTS_BG } from "./homeStyles";

type Props = {
  pageH: number;
  pH: number;
  maxW: number;
  titleSize: number;
  isMobile: boolean;
  status: SubscriptionStatus;
  wasAlreadySubscribed: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  onSubscribe: () => void;
  isSubmitting: boolean;
};

// ─── Newsletter success panel ────────────────────────────────────────────────
function NewsletterSuccess({
  alreadySubscribed,
  isValidating,
}: {
  alreadySubscribed: boolean;
  isValidating: boolean;
}) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
    ]).start();
    Animated.timing(iconScale, {
      toValue: 1,
      duration: 420,
      delay: 130,
      easing: Easing.out(Easing.back(2.2)),
      useNativeDriver: true,
    }).start();
  }, [iconScale, opacity, scale]);

  return (
    <Animated.View
      style={[styles.successPanel, { opacity, transform: [{ scale }] }]}
      accessibilityRole="alert"
    >
      <Animated.View style={[styles.successIcon, { transform: [{ scale: iconScale }] }]}>
        <Ionicons
          name={alreadySubscribed ? "mail-open-outline" : "checkmark-sharp"}
          size={24}
          color={ALERTS_BG}
        />
      </Animated.View>
      <View style={styles.successCopy}>
        <Text style={[styles.successTitle, { fontFamily: SANS }]}>
          {alreadySubscribed ? "You're already on the list" : "You're on the list"}
        </Text>
        <Text style={[styles.successBody, { fontFamily: SANS }]}>
          {alreadySubscribed
            ? "No need to sign up again — we'll email you the moment new auditions open."
            : "We'll email you the moment new auditions open for the companies you follow."}
        </Text>
        {isValidating && <ValidatingNotice variant="dark" />}
      </View>
    </Animated.View>
  );
}

export default function AlertsSection({
  pageH,
  pH,
  maxW,
  titleSize,
  isMobile,
  status,
  wasAlreadySubscribed,
  email,
  onEmailChange,
  onSubscribe,
  isSubmitting,
}: Props) {
  return (
    <Page pageH={pageH} bg={ALERTS_BG}>
      <View style={[styles.section, { paddingHorizontal: pH }]}>
        <View style={{ maxWidth: maxW, width: "100%" }}>
          <SectionHeader
            mark="[03]"
            right="Free, cancel anytime"
            markColor="rgba(255,255,255,0.4)"
            rightColor="rgba(255,255,255,0.4)"
          />

          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: titleSize,
                lineHeight: Math.round(titleSize * 0.95),
                fontFamily: SANS,
                color: "#fff",
              },
            ]}
          >
            {"NEVER MISS\nAN AUDITION"}
          </Text>

          <Text style={[styles.alertsBody, { fontFamily: SANS }]}>
            Get alerts straight to your inbox when new auditions open for companies you follow. No
            spam, unsubscribe anytime.
          </Text>

          {hasSubscribed(status) ? (
            <NewsletterSuccess
              alreadySubscribed={wasAlreadySubscribed}
              isValidating={status === SubscriptionStatus.VALIDATING}
            />
          ) : (
            <View
              style={{
                width: "100%",
                maxWidth: isMobile ? 460 : 620,
                alignSelf: "flex-start",
              }}
            >
              <NewsletterField
                variant="dark"
                isCompact={isMobile}
                email={email}
                onEmailChange={onEmailChange}
                onSubmit={onSubscribe}
                isSubmitting={isSubmitting}
              />
            </View>
          )}
        </View>
      </View>
    </Page>
  );
}
