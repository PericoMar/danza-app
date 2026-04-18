import React from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import { loadLandingFonts } from "@/theme/landing";

import LandingNavbar from "./components/LandingNavbar";
import HeroSection from "./components/HeroSection";
import TrustBar from "./components/TrustBar";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import AuditionsTeaserSection from "./components/AuditionsTeaserSection";
import NewsletterCtaSection from "./components/NewsletterCtaSection";
import CompaniesGridSection from "./components/CompaniesGridSection";
import LandingFooter from "./components/LandingFooter";

loadLandingFonts();

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const goAlerts = () => router.push("/newsletter");
  const goAuditions = () => router.push("/companies");
  const goCompanies = () => router.push("/companies");

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <LandingNavbar
        width={width}
        onGoCompanies={goCompanies}
        onGoAuditions={goAuditions}
        onGoAlerts={goAlerts}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HeroSection width={width} onGoAuditions={goAuditions} onGoAlerts={goAlerts} />
        <TrustBar width={width} />
        <FeaturesSection width={width} />
        <HowItWorksSection width={width} />
        <AuditionsTeaserSection width={width} onGoAuditions={goAuditions} />
        <NewsletterCtaSection width={width} />
        <CompaniesGridSection width={width} onGoCompanies={goCompanies} />
        <LandingFooter
          width={width}
          onGoCompanies={goCompanies}
          onGoAuditions={goAuditions}
          onGoAlerts={goAlerts}
          onGoPrivacy={() => router.push("/policies")}
          onGoTerms={() => router.push("/policies")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { flexGrow: 1 },
});
