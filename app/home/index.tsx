import React, { useEffect, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
  AccessibilityInfo,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

import Snackbar from "@/components/Snackbar";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";

import { wrap, hPad, loadLandingFonts } from "@/theme/landing";
import { TABLET_BREAKPOINT, LARGE_SCREEN_BREAKPOINT } from "@/constants/layout";
import { useAuditions } from "@/hooks/useAuditions";
import { useNewsletter } from "@/hooks/useNewsletter";
import { useStats } from "@/hooks/useStats";

import { NAVBAR_H, sectionFontSize, homeStyles as styles } from "./components/homeStyles";
import HomeHero from "./components/HomeHero";
import CompaniesSection from "./components/CompaniesSection";
import AlertsSection from "./components/AlertsSection";
import AuditionsSection from "./components/AuditionsSection";
import HomeFeaturesSection from "./components/HomeFeaturesSection";

loadLandingFonts();

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isMobile = width < TABLET_BREAKPOINT;
  const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT;
  const pH = hPad(width);
  const maxW = wrap(width);
  const pageH = height - NAVBAR_H;
  const sFSize = sectionFontSize(width);
  const companyStatFontSize = Math.min(52, Math.max(24, Math.floor(width / 10.5)));

  // Entrance animation for the whole scroll area.
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!mounted) return;
      if (reduce) {
        opacity.setValue(1);
        translateY.setValue(0);
        return;
      }
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
    return () => {
      mounted = false;
    };
  }, [opacity, translateY]);

  const { data: stats } = useStats();
  const { data: auditions, loading: auditionsLoading } = useAuditions(3);
  const {
    email,
    setEmail,
    isSubmitting: subLoading,
    handleSubscribe,
    status: newsletterStatus,
    wasAlreadySubscribed,
    snackbar,
    clearSnackbar,
  } = useNewsletter({});

  const goCompanies = () => router.push("/companies");
  const goAuditions = () => router.push("/companies");

  return (
    <SafeAreaView style={styles.safe}>
      <SiteHeader />

      <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          style={[
            styles.scrollContainer,
            Platform.OS === "web" && ({ scrollSnapType: "y proximity" } as object),
          ]}
        >
          <HomeHero
            width={width}
            isMobile={isMobile}
            pH={pH}
            maxW={maxW}
            pageH={pageH}
            onExplore={goAuditions}
          />

          <CompaniesSection
            pageH={pageH}
            pH={pH}
            maxW={maxW}
            titleSize={sFSize}
            statSize={companyStatFontSize}
            stats={stats}
            onExplore={goCompanies}
          />

          <AlertsSection
            pageH={pageH}
            pH={pH}
            maxW={maxW}
            titleSize={sFSize}
            isMobile={isMobile}
            status={newsletterStatus}
            wasAlreadySubscribed={wasAlreadySubscribed}
            email={email}
            onEmailChange={setEmail}
            onSubscribe={handleSubscribe}
            isSubmitting={subLoading}
          />

          <AuditionsSection
            pageH={pageH}
            pH={pH}
            maxW={maxW}
            titleSize={sFSize}
            auditions={auditions}
            loading={auditionsLoading}
            onBrowseAll={goAuditions}
          />

          <HomeFeaturesSection
            pageH={pageH}
            pH={pH}
            maxW={maxW}
            titleSize={sFSize}
            isLargeScreen={isLargeScreen}
          />

          <SiteFooter />
        </ScrollView>
      </Animated.View>

      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={4000}
          onClose={clearSnackbar}
        />
      )}
    </SafeAreaView>
  );
}
