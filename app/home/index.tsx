import AuditionsCard from "@/components/landing/AuditionsCard";
import CompaniesCard from "@/components/landing/CompaniesCard";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import UtilitiesGrid from "@/components/landing/UtilitiesGrid";
import { LARGE_SCREEN_BREAKPOINT } from "@/constants/layout";
import { Colors } from "@/theme/colors";
import { BREAKPOINT, SPACING } from "@/theme/tokens";
import { Audition } from "@/types/audition";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    ScrollView,
    useWindowDimensions,
    View,
    StyleSheet,
    SafeAreaView,
    Animated,
    Easing,
    AccessibilityInfo,
} from "react-native";

export default function LandingScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();

    // Fade-in animation (with reduced-motion support)
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(12)).current;

    useEffect(() => {
        let mounted = true;

        AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
            if (!mounted) return;

            if (reduce) {
                // Respect reduced motion
                opacity.setValue(1);
                translateY.setValue(0);
                return;
            }

            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 450,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 450,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        });

        return () => {
            mounted = false;
        };
    }, [opacity, translateY]);

    const isWideSplit = width >= BREAKPOINT;                    // two-column layout
    const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT;     // hero padding/centering

    // responsive padding
    const paddingV = isLargeScreen ? 60 : 20;
    const paddingH = isLargeScreen ? 80 : 20;
    const cardsMinHeight = isLargeScreen ? 300 : 400;

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollBase,
                        { paddingVertical: paddingV, paddingHorizontal: paddingH },
                    ]}
                >
                    <Hero
                        title="Effortless ballet company insights—powered by AI"
                        subtitle="Real reviews summarized by AI • Instant comparisons • Upcoming audition alerts"
                        primary={{
                            label: "Early registration", onPress: () => {
                                router.push("/register");
                            }
                        }}
                        secondary={{ label: "Explore companies", onPress: () => {
                            router.push("/companies");
                         } }}
                        // centered on small screens, left on large
                        align={isLargeScreen ? "center" : "left"}
                    />

                    <View style={[styles.split, { flexDirection: isWideSplit ? "row" : "column" }]}>
                        <AuditionsCard
                            title="Upcoming auditions"
                            description="Dates, requirements, salary ranges, country, contact and official links."
                            onSeeAll={() => {
                                router.push("/companies");
                             }}
                            minHeight={cardsMinHeight}
                        />

                        <CompaniesCard
                            title="Companies"
                            description="We analyze reviews and key facts so you can decide in minutes."
                            counter={{
                                base: 100,
                                periodHours: 144,
                                startedAtISO: "2025-10-09T00:00:00Z",
                                label: "estimated reviews published",
                            }}
                            onExplore={() => {
                                router.push("/companies");
                             }}
                            minHeight={cardsMinHeight}
                        />
                    </View>

                    <UtilitiesGrid
                        title="What can you do with danza.app?"
                        items={[
                            {
                                icon: "search-outline",
                                title: "Search & compare",
                                description: "Filter by country, company type, salary estimates and satisfaction.",
                            },
                            {
                                icon: "sparkles-outline",
                                title: "AI summaries",
                                description: "Pros and cons distilled so you can read them in 20 seconds.",
                            },
                            {
                                icon: "notifications-outline",
                                title: "Audition alerts",
                                description: "Get notified by interest and deadlines.",
                            },
                            {
                                icon: "shield-checkmark-outline",
                                title: "Verification",
                                description: "Reliability signals and anti-spam checks on reviews.",
                            },
                        ]}
                    />

                    <Footer />
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scrollBase: { gap: SPACING.lg },
    split: { width: "100%", gap: 42, justifyContent: "center", marginVertical: 30 },
});
