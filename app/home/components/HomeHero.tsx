import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { SANS, MONO } from "@/theme/landing";
import EarthGlobe from "@/components/landing/EarthGlobe";
import CountryModal, { PANEL_W } from "@/components/landing/CountryModal";
import { Page } from "./HomeSection";
import { homeStyles as styles, heroFontSize } from "./homeStyles";

type Props = {
  width: number;
  isMobile: boolean;
  pH: number;
  maxW: number;
  pageH: number;
  onExplore: () => void;
};

export default function HomeHero({ width, isMobile, pH, maxW, pageH, onExplore }: Props) {
  const fSize = heroFontSize(width, isMobile);
  // On mobile the globe is a square that fits the narrower (width) axis, so give
  // the row enough height for a comfortably large sphere plus breathing room
  // above/below — capped so it never eats the whole viewport.
  const globeHeight = isMobile
    ? Math.min(Math.max(width - 48, 260), 360)
    : Math.max(480, pageH - 80);

  // Globe marker modal — shared progress drives both the panel slide-in and the
  // hero content (copy + globe) sliding gently left to make room, so the panel
  // reads as sliding out from behind the sphere rather than a detached overlay.
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const panelProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(panelProgress, {
      toValue: selectedCountry ? 1 : 0,
      useNativeDriver: true,
      tension: 70,
      friction: 14,
    }).start();
  }, [selectedCountry, panelProgress]);

  const panelWidth = Math.min(PANEL_W, width - 32);
  const heroShiftX = Math.min(panelWidth * 0.4, 130);
  const heroTranslateX = panelProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -heroShiftX] });

  return (
    <Page pageH={pageH}>
      <View style={[styles.heroSection, { paddingHorizontal: pH }]}>
        <View
          style={[
            styles.heroInner,
            { maxWidth: maxW, flexDirection: isMobile ? "column" : "row" },
            // Centre the copy + globe stack vertically on mobile so the sphere
            // isn't stranded near the top with empty space beneath it.
            isMobile && { justifyContent: "center", gap: 24 },
          ]}
        >
          {/* Catches clicks outside the panel to close it. Painted first (lowest),
              so the copy column and globe/panel above it stay interactive. */}
          {!!selectedCountry && (
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setSelectedCountry(null)} />
          )}

          {/* Copy column — eases left with the globe when a panel opens */}
          <Animated.View
            style={[
              styles.heroCopy,
              { flex: isMobile ? undefined : 0.42 },
              !isMobile && { transform: [{ translateX: heroTranslateX }] },
            ]}
          >
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionMark, { fontFamily: MONO }]}>[01]</Text>
              {isMobile && (
                <Text style={[styles.taglineSmall, { fontFamily: SANS }]} numberOfLines={2}>
                  Where dance companies discover each other globally
                </Text>
              )}
            </View>

            <Text
              style={[
                styles.heroTitle,
                { fontSize: fSize, lineHeight: Math.round(fSize * 0.95), fontFamily: SANS },
              ]}
            >
              {"DISCOVER\nAUDITIONS"}
            </Text>

            <Pressable
              onPress={onExplore}
              style={({ pressed }) => [styles.exploreBtn, pressed && { opacity: 0.82 }]}
              accessibilityRole="button"
              accessibilityLabel="Explore auditions"
            >
              <Text style={[styles.exploreBtnText, { fontFamily: SANS }]}>Explore Auditions →</Text>
            </Pressable>

            {!isMobile && (
              <Text style={[styles.globeHint, { fontFamily: SANS }]}>
                Click a marker · scroll to zoom
              </Text>
            )}
          </Animated.View>

          {/* Country panel — sits behind the globe (painted before it) so it
              visually slides out from behind the sphere. */}
          <CountryModal
            country={selectedCountry}
            onClose={() => setSelectedCountry(null)}
            isMobile={isMobile}
            progress={panelProgress}
          />

          {/* Globe column — eases left (no shrink) while the panel is open. */}
          <Animated.View
            style={[
              styles.globeWrap,
              { flex: isMobile ? undefined : 0.58, height: globeHeight, zIndex: 2 },
              !isMobile && { transform: [{ translateX: heroTranslateX }] },
            ]}
          >
            {!isMobile && (
              <Text style={[styles.taglineDesktop, { fontFamily: SANS }]}>
                Where dance companies discover each other globally
              </Text>
            )}
            <EarthGlobe onMarkerClick={setSelectedCountry} bleed={!isMobile} />
          </Animated.View>
        </View>
      </View>
    </Page>
  );
}
