// components/landing/CountryModal.tsx
// Panel that slides out from behind the home globe when a marker is clicked.
// Not a <Modal> — it's a normal absolutely-positioned sibling of the globe that
// shares a single Animated.Value with the globe's own shift animation, so the
// two move together as the panel opens (see z-order in app/home/index.tsx).
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients } from "@/theme/colors";
import { INTER, CHROME_GRADIENT_START, CHROME_GRADIENT_END } from "@/theme/companies";
import { useCountryCompanies, CountryCompany } from "@/hooks/useCountryCompanies";
import { getInitials } from "@/utils/initials";

// Fallback names for countries with zero companies (no row to read the name from).
const ISO_COUNTRY_NAMES: Record<string, string> = {
  FR: "France",
  GB: "United Kingdom",
  IT: "Italy",
  DE: "Germany",
  ES: "Spain",
  NL: "Netherlands",
  AT: "Austria",
  US: "United States",
  JP: "Japan",
  AU: "Australia",
  RU: "Russia",
};

function hasOpenAudition(company: CountryCompany): boolean {
  return company.has_live_audition;
}

export const PANEL_W = 340;
const PANEL_H = 540;
// Mobile bottom-sheet: half the screen, clamped so it stays usable on very
// short / very tall viewports.
const SHEET_RATIO = 0.5;
const SHEET_H_MIN = 340;
const SHEET_H_MAX = 560;
// How far (px) the panel sits tucked behind the globe's resting position when closed.
const CLOSED_OFFSET_X = 220;
const NAV_DELAY = 200;

type Props = {
  country: string | null;
  onClose: () => void;
  isMobile: boolean;
  progress: Animated.Value; // 0 = closed, 1 = open — shared with the globe's shift animation
};

export default function CountryModal({ country, onClose, isMobile, progress }: Props) {
  const { width, height } = useWindowDimensions();
  const router = useRouter();

  const sheetH = Math.max(
    SHEET_H_MIN,
    Math.min(SHEET_H_MAX, Math.round(height * SHEET_RATIO)),
  );

  // Keep rendering the last-selected country's content while the close
  // animation plays out (the panel itself never unmounts).
  const [activeCountry, setActiveCountry] = useState<string | null>(country);
  useEffect(() => {
    if (country) setActiveCountry(country);
  }, [country]);

  const { data, isLoading } = useCountryCompanies(activeCountry);
  const companies = data ?? [];
  const total = companies.length;
  const openCount = useMemo(() => companies.filter(hasOpenAudition).length, [companies]);
  const countryName =
    companies[0]?.country ?? (activeCountry ? ISO_COUNTRY_NAMES[activeCountry] ?? activeCountry : "");

  const handleGoCompanies = () => {
    const iso = activeCountry;
    onClose();
    setTimeout(() => router.push(`/companies?country=${iso}`), NAV_DELAY);
  };

  const panelWidth = Math.min(PANEL_W, width - 32);

  const desktopAnim = {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-CLOSED_OFFSET_X, 0],
        }),
      },
    ],
    opacity: progress.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0, 1],
    }),
  };

  const mobileAnim = {
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [sheetH, 0],
        }),
      },
    ],
  };

  const sheet = (
    <Animated.View
      pointerEvents={country ? "auto" : "none"}
      style={[
        isMobile ? styles.sheet : styles.panel,
        isMobile
          ? [
              { height: sheetH },
              // On web, pin to the viewport bottom so the sheet sits above the
              // globe (and everything else) instead of behind it in the hero's
              // local stacking context.
              Platform.OS === "web" && ({ position: "fixed" } as object),
            ]
          : { width: panelWidth, height: PANEL_H, marginTop: -PANEL_H / 2 },
        isMobile ? mobileAnim : desktopAnim,
      ]}
    >
      {isMobile && <View style={styles.handle} />}

      <View style={styles.header}>
        <View style={styles.badge}>
          <LinearGradient
            colors={Gradients.chrome.colors}
            locations={Gradients.chrome.locations}
            start={CHROME_GRADIENT_START}
            end={CHROME_GRADIENT_END}
            style={[StyleSheet.absoluteFill, styles.badgeGradient]}
          />
          <Text style={[styles.badgeText, { fontFamily: INTER }]}>{activeCountry}</Text>
        </View>
        <Pressable
          onPress={onClose}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={16} color={Colors.text} />
        </Pressable>
      </View>

      <Text style={[styles.countryName, { fontFamily: INTER }]} numberOfLines={1}>
        {countryName}
      </Text>
      <Text style={[styles.subLabel, { fontFamily: INTER }]}>
        {isLoading ? "Loading…" : `${total} ${total === 1 ? "company" : "companies"} listed`}
      </Text>

      {!isLoading && openCount > 0 && (
        <View style={styles.openPill}>
          <View style={styles.openDot} />
          <Text style={[styles.openPillText, { fontFamily: INTER }]}>
            {openCount} WITH OPEN AUDITIONS
          </Text>
        </View>
      )}

      <View style={styles.divider} />

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.purple} />
        </View>
      ) : total === 0 ? (
        <Text style={[styles.emptyText, { fontFamily: INTER }]}>No companies listed yet.</Text>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator>
          {companies.map((c) => {
            const open = hasOpenAudition(c);
            return (
              <View key={c.id} style={styles.row}>
                <View style={styles.avatar}>
                  <LinearGradient
                    colors={Gradients.chrome.colors}
                    locations={Gradients.chrome.locations}
                    start={CHROME_GRADIENT_START}
                    end={CHROME_GRADIENT_END}
                    style={[StyleSheet.absoluteFill, styles.avatarGradient]}
                  />
                  <Text style={[styles.avatarText, { fontFamily: INTER }]}>
                    {getInitials(c.name)}
                  </Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowName, { fontFamily: INTER }]} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={[styles.rowCity, { fontFamily: INTER }]} numberOfLines={1}>
                    {c.location || "—"}
                  </Text>
                </View>
                {open && (
                  <View style={styles.openCallPill}>
                    <Text style={[styles.openCallText, { fontFamily: INTER }]}>OPEN CALL</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {!isLoading && total > 0 && (
        <Pressable
          onPress={handleGoCompanies}
          style={({ pressed }) => [styles.ctaWrap, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[Colors.purple, Colors.purpleDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBtn}
          >
            <Text style={[styles.ctaText, { fontFamily: INTER }]}>
              {`View all ${total} in ${countryName}`}
            </Text>
          </LinearGradient>
        </Pressable>
      )}
    </Animated.View>
  );

  if (!isMobile) return sheet;

  // Mobile: dim + tap-to-close backdrop under the sheet, both pinned to the
  // viewport so they render above the globe.
  return (
    <>
      <Animated.View
        pointerEvents={country ? "auto" : "none"}
        style={[
          styles.backdrop,
          Platform.OS === "web" && ({ position: "fixed" } as object),
          { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      {sheet}
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: "50%",
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    // Above the globe (globeWrap zIndex 2) so the full-size globe never covers
    // the panel now that the globe no longer shrinks when a panel opens.
    zIndex: 3,
    ...({ boxShadow: "0 24px 60px -20px rgba(0,0,0,0.3)" } as object),
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    // Above the globe and the hero copy so the sheet opens on top of the page
    // rather than behind the sphere.
    zIndex: 1000,
    elevation: 24,
    ...({ boxShadow: "0 -12px 40px -16px rgba(0,0,0,0.3)" } as object),
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 999,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    ...({ boxShadow: "0 0 0 1px rgba(150,155,165,.45), 0 1px 0 rgba(255,255,255,.95) inset" } as object),
  },
  badgeGradient: {
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: "#3c3f47",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  countryName: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
    marginTop: 14,
  },
  subLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  openPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.neutralLight,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.purple,
  },
  openPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: Colors.grey1,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.rule,
    marginTop: 18,
    marginBottom: 8,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    paddingVertical: 24,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    ...({ boxShadow: "0 0 0 1px rgba(150,155,165,.4), 0 1px 0 rgba(255,255,255,.9) inset" } as object),
  },
  avatarGradient: {
    borderRadius: 19,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3c3f47",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.1,
  },
  rowCity: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  openCallPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.purpleLight,
  },
  openCallText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: Colors.purpleDark,
  },
  ctaWrap: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  ctaBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.1,
  },
});
