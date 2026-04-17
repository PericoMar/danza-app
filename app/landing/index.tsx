import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  useWindowDimensions,
  Platform,
  Animated,
  Easing,
  Image,
  StyleSheet,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/theme/colors";
import { useNewsletter } from "@/hooks/useNewsletter";
import { TABLET_BREAKPOINT, LARGE_SCREEN_BREAKPOINT } from "@/constants/layout";

// Load editorial fonts on web
if (Platform.OS === "web" && typeof document !== "undefined") {
  if (!document.getElementById("danza-landing-fonts")) {
    const link = document.createElement("link");
    link.id = "danza-landing-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }
}

const SERIF: any = Platform.select({
  web: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
  default: "Georgia",
});
const MONO: any = Platform.select({
  web: '"JetBrains Mono", "Courier New", monospace',
  default: "monospace",
});
const SANS: any = Platform.select({
  web: '"DM Sans", system-ui, sans-serif',
  default: undefined,
});

const INK_2 = "#474747cc";
const INK_3 = "#929294";
const DARK = "#101012";
const RULE = "rgba(0,0,0,0.08)";
const RULE_STRONG = "rgba(0,0,0,0.14)";

// ─── Static data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    num: "i.",
    icon: "calendar-outline" as const,
    title: "Audition\nDirectory",
    desc: "Browse open calls from hundreds of ballet companies worldwide — filtered by city, contract, style, or season.",
  },
  {
    num: "ii.",
    icon: "mail-outline" as const,
    title: "Audition\nAlerts",
    desc: "Subscribe once. Receive a single, carefully curated email of the week's new auditions. No noise. No resends.",
  },
  {
    num: "iii.",
    icon: "heart-outline" as const,
    title: "A Private\nFavorites List",
    desc: "Save auditions that matter to you. Track deadlines, preparation notes, and submission status — quietly, privately.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Browse the directory.",
    desc: "Search hundreds of companies and active calls. Filter by country, contract length, or audition window.",
  },
  {
    num: "02",
    title: "Save your favorites.",
    desc: "Bookmark calls you want to pursue. Keep deadlines, requirements, and your own notes in one quiet place.",
  },
  {
    num: "03",
    title: "Receive weekly alerts.",
    desc: "Every Sunday, a single email with the week's new auditions. Unsubscribe any time. Always free.",
  },
];

const AUDITIONS = [
  { company: "Atelier Marceau", city: "Paris", role: "Corps de Ballet · Female", deadline: "Apr 30", isNew: true },
  { company: "Ballet du Nord", city: "Oslo", role: "Soloist · Open", deadline: "May 06", isNew: true },
  { company: "Compañía Luz", city: "Madrid", role: "Apprentice Program", deadline: "May 12", isNew: false },
  { company: "Teatro Serenata", city: "Milan", role: "Principal · Male", deadline: "May 18", isNew: true },
  { company: "Kōgei Ensemble", city: "Tokyo", role: "Corps · Contemporary", deadline: "May 22", isNew: false },
  { company: "The Meridian Co.", city: "New York", role: "Summer Season", deadline: "Jun 01", isNew: false },
];

const COMPANIES = [
  { name: "Atelier Marceau", loc: "Paris · FR" },
  { name: "Ballet du Nord", loc: "Oslo · NO" },
  { name: "Compañía Luz", loc: "Madrid · ES" },
  { name: "Teatro Serenata", loc: "Milan · IT" },
  { name: "Kōgei Ensemble", loc: "Tokyo · JP" },
  { name: "The Meridian Company", loc: "New York · US" },
  { name: "Ballet Arcana", loc: "Vienna · AT" },
  { name: "Collectif Sable", loc: "Montréal · CA" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrap(w: number): number {
  return Math.min(w - 0, 1320);
}

function hPad(w: number): number {
  return w < TABLET_BREAKPOINT ? 22 : 40;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Kicker({ n, label }: { n: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: INK_3 }}>
        <Text style={{ color: Colors.text, fontWeight: "500" }}>{n}</Text>
        {"  /  "}{label}
      </Text>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: SERIF,
        fontWeight: "400",
        fontSize: 52,
        lineHeight: 52,
        letterSpacing: -0.5,
        color: Colors.text,
        marginBottom: 0,
      }}
    >
      {children}
    </Text>
  );
}

function FeatureCard({ num, icon, title, desc }: typeof FEATURES[0]) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 240,
        backgroundColor: Colors.purpleLight,
        borderRadius: 4,
        padding: 44,
        minHeight: 380,
        justifyContent: "flex-start",
      }}
    >
      <Text style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: "400", fontSize: 26, color: Colors.text, opacity: 0.55, marginBottom: "auto" }}>
        {num}
      </Text>
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <Ionicons name={icon} size={40} color={Colors.text} />
      </View>
      <Text style={{ fontFamily: SERIF, fontWeight: "400", fontSize: 32, lineHeight: 34, color: Colors.text, marginBottom: 12 }}>
        {title}
      </Text>
      <Text style={{ fontFamily: SANS, color: INK_2, fontSize: 15, lineHeight: 24 }}>
        {desc}
      </Text>
    </View>
  );
}

function StepBlock({ num, title, desc, hasBorderLeft }: typeof STEPS[0] & { hasBorderLeft: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        paddingTop: 44,
        paddingBottom: 44,
        paddingRight: 44,
        paddingLeft: hasBorderLeft ? 44 : 0,
        borderTopWidth: 1,
        borderTopColor: RULE,
        borderBottomWidth: 1,
        borderBottomColor: RULE,
        borderLeftWidth: hasBorderLeft ? 1 : 0,
        borderLeftColor: RULE,
        minWidth: 200,
      }}
    >
      <Text
        style={{
          fontFamily: SERIF,
          fontWeight: "300",
          fontSize: 80,
          lineHeight: 80,
          letterSpacing: -2,
          color: Colors.text,
          marginBottom: 24,
        }}
      >
        {num}
        <Text style={{ fontSize: 18, fontStyle: "italic", color: INK_3 }}> i</Text>
      </Text>
      <Text style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: "400", fontSize: 24, lineHeight: 28, color: Colors.text, marginBottom: 10 }}>
        {title}
      </Text>
      <Text style={{ fontFamily: SANS, color: INK_2, fontSize: 15, lineHeight: 24 }}>
        {desc}
      </Text>
    </View>
  );
}

function AuditionCard({
  company, city, role, deadline, isNew, favorited, onToggleFav,
}: typeof AUDITIONS[0] & { favorited: boolean; onToggleFav: () => void }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 240,
        backgroundColor: Colors.purpleLight,
        borderRadius: 4,
        padding: 28,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: INK_3 }}>
          {city}
        </Text>
        {isNew ? (
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: Colors.purpleDark, fontWeight: "500" }}>
            ● New this week
          </Text>
        ) : (
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: INK_3 }}>
            Open
          </Text>
        )}
      </View>
      <Text style={{ fontFamily: SERIF, fontWeight: "400", fontSize: 26, lineHeight: 28, color: Colors.text }}>
        {company}
      </Text>
      <Text style={{ fontFamily: SANS, color: INK_2, fontSize: 14 }}>
        {role}
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.07)",
        }}
      >
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: INK_3 }}>
          Apply by {deadline}
        </Text>
        <Pressable
          onPress={onToggleFav}
          aria-label="Save to favorites"
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: favorited ? Colors.text : "rgba(255,255,255,0.6)",
            borderWidth: 1,
            borderColor: favorited ? Colors.text : "rgba(0,0,0,0.06)",
          }}
        >
          <Ionicons
            name={favorited ? "bookmark" : "bookmark-outline"}
            size={14}
            color={favorited ? "#fff" : Colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
}

function CompanyCell({ name, loc, isLastRow }: { name: string; loc: string; isLastRow: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flex: 1,
        minWidth: 200,
        borderRightWidth: 1,
        borderRightColor: RULE,
        borderBottomWidth: 1,
        borderBottomColor: RULE,
        padding: 36,
        paddingVertical: 40,
        gap: 8,
        backgroundColor: hovered ? Colors.purpleLight : "transparent",
      }}
    >
      <Text style={{ fontFamily: SERIF, fontWeight: "500", fontSize: 20, lineHeight: 22, color: Colors.text }}>
        {name}
      </Text>
      <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: INK_3 }}>
        {loc}
      </Text>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isMobile = width < TABLET_BREAKPOINT;
  const isLarge = width >= LARGE_SCREEN_BREAKPOINT;
  const pH = hPad(width);

  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  const { email, setEmail, isSubmitting, handleSubscribe } = useNewsletter({ userEmail: null });

  // Dancer float animation
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

  const toggleFav = (i: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const goAlerts = () => router.push("/newsletter");
  const goAuditions = () => router.push("/companies");
  const goCompanies = () => router.push("/companies");

  const onSubscribePress = async () => {
    await handleSubscribe();
    setSubscribeSuccess(true);
    setTimeout(() => setSubscribeSuccess(false), 4500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Navbar ── */}
      <View style={[styles.navbar, { paddingHorizontal: pH }]}>
        <View style={[styles.navInner, { maxWidth: wrap(width) }]}>
          <Pressable
            onPress={goCompanies}
            style={styles.brand}
            accessibilityRole="link"
            accessibilityLabel="Danza App"
          >
            <View style={styles.brandMark}>
              <Image
                source={require("../../assets/images/favicon.png")}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandWord, { fontFamily: SERIF }]}>
              Danza <Text style={{ fontStyle: "italic" }}>App</Text>
            </Text>
          </Pressable>

          {!isMobile && (
            <View style={styles.navLinks}>
              {[
                { label: "Companies", onPress: goCompanies },
                { label: "Auditions", onPress: goAuditions },
                { label: "Alerts", onPress: goAlerts },
              ].map(({ label, onPress }) => (
                <Pressable key={label} onPress={onPress}>
                  <Text style={[styles.navLink, { fontFamily: SANS }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable onPress={goAlerts} style={styles.navCta} accessibilityRole="button">
            <Text style={[styles.navCtaText, { fontFamily: SANS }]}>Subscribe to Alerts</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
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
                <Pressable
                  onPress={goAuditions}
                  style={styles.btnPrimary}
                  accessibilityRole="button"
                >
                  <Text style={[styles.btnPrimaryText, { fontFamily: SANS }]}>Browse Auditions</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </Pressable>
                <Pressable
                  onPress={goAlerts}
                  style={styles.btnGhost}
                  accessibilityRole="button"
                >
                  <Text style={[styles.btnGhostText, { fontFamily: SANS }]}>Subscribe to Alerts</Text>
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
                    source={require("../../assets/images/favicon.png")}
                    style={{ width: "100%", height: undefined, aspectRatio: 1 }}
                    resizeMode="contain"
                  />
                </Animated.View>
                <View style={styles.heroMark}>
                  <View style={styles.heroDot} />
                  <Text style={[styles.heroMarkText, { fontFamily: MONO }]}>Danza · Est. 2026</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Trust Bar ── */}
        <View style={{ borderTopWidth: 1, borderTopColor: RULE, borderBottomWidth: 1, borderBottomColor: RULE, paddingVertical: 18, paddingHorizontal: pH }}>
          <View
            style={{
              maxWidth: wrap(width),
              alignSelf: "center",
              width: "100%",
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobile ? 12 : 36,
            }}
          >
            {[
              <><Text style={{ color: Colors.text, fontWeight: "500" }}>240+</Text> Companies</>,
              <><Text style={{ color: Colors.text, fontWeight: "500" }}>520+</Text> Open Auditions</>,
              <>Weekly Alerts</>,
              <>Free for everyone</>,
            ].map((item, i) => (
              <Text
                key={i}
                style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: INK_3 }}
              >
                {item}
              </Text>
            ))}
          </View>
        </View>

        {/* ── Features ── */}
        <View style={{ paddingHorizontal: pH, paddingVertical: isMobile ? 80 : 120 }}>
          <View style={{ maxWidth: wrap(width), alignSelf: "center", width: "100%", gap: 64 }}>
            <View
              style={{
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "flex-end",
                gap: 32,
              }}
            >
              <View style={{ flex: 1 }}>
                <Kicker n="01" label="What Danza offers" />
                <SectionTitle>
                  A quieter way to{"\n"}find your{" "}
                  <Text style={{ fontStyle: "italic" }}>next stage.</Text>
                </SectionTitle>
              </View>
              {!isMobile && (
                <View style={{ maxWidth: 360, paddingBottom: 8 }}>
                  <Text style={{ fontFamily: SANS, fontSize: 16, color: INK_2, lineHeight: 26 }}>
                    Three tools, carefully made. Designed for the rhythm of a dancer's life and the realities of running a company.
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: isMobile ? "column" : "row", gap: 16 }}>
              {FEATURES.map((f) => (
                <FeatureCard key={f.num} {...f} />
              ))}
            </View>
          </View>
        </View>

        {/* ── How It Works ── */}
        <View style={{ paddingHorizontal: pH, paddingBottom: isMobile ? 80 : 120 }}>
          <View style={{ maxWidth: wrap(width), alignSelf: "center", width: "100%" }}>
            <View style={{ marginBottom: 48 }}>
              <Kicker n="02" label="How it works" />
              <SectionTitle>
                Three steps,{"\n"}
                <Text style={{ fontStyle: "italic" }}>no friction.</Text>
              </SectionTitle>
            </View>
            <View style={{ flexDirection: isMobile ? "column" : "row" }}>
              {STEPS.map((s, i) => (
                <StepBlock key={s.num} {...s} hasBorderLeft={!isMobile && i > 0} />
              ))}
            </View>
          </View>
        </View>

        {/* ── Audition Teaser ── */}
        <View style={{ paddingHorizontal: pH, paddingBottom: isMobile ? 80 : 120 }}>
          <View style={{ maxWidth: wrap(width), alignSelf: "center", width: "100%", gap: 64 }}>
            <View
              style={{
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "flex-end",
                gap: 32,
              }}
            >
              <View style={{ flex: 1 }}>
                <Kicker n="03" label="Open this week" />
                <SectionTitle>
                  This week's{"\n"}
                  <Text style={{ fontStyle: "italic" }}>new calls.</Text>
                </SectionTitle>
              </View>
              {!isMobile && (
                <View style={{ maxWidth: 360, paddingBottom: 8 }}>
                  <Text style={{ fontFamily: SANS, fontSize: 16, color: INK_2, lineHeight: 26 }}>
                    A sample of recent listings, updated daily across the directory. Favorites save instantly — no account required.
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
              {AUDITIONS.map((a, i) => (
                <View key={i} style={{ flex: 1, minWidth: isMobile ? "100%" : 260 }}>
                  <AuditionCard
                    {...a}
                    favorited={favorites.has(i)}
                    onToggleFav={() => toggleFav(i)}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Dark CTA ── */}
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
              <View
                style={[
                  styles.ctaForm,
                  { flexDirection: isMobile ? "column" : "row" },
                ]}
              >
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="rgba(255,255,255,0.38)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.ctaInput, { fontFamily: SANS }]}
                  accessibilityLabel="Email address"
                />
                <Pressable
                  onPress={onSubscribePress}
                  disabled={isSubmitting || subscribeSuccess}
                  style={[styles.ctaBtn, subscribeSuccess && styles.ctaBtnSent]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.ctaBtnText, { fontFamily: SANS }]}>
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

        {/* ── Companies ── */}
        <View style={{ paddingHorizontal: pH, paddingVertical: isMobile ? 80 : 120 }}>
          <View style={{ maxWidth: wrap(width), alignSelf: "center", width: "100%", gap: 64 }}>
            <View
              style={{
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "flex-end",
                gap: 32,
              }}
            >
              <View style={{ flex: 1 }}>
                <Kicker n="04" label="In the directory" />
                <SectionTitle>
                  Trusted by{"\n"}
                  <Text style={{ fontStyle: "italic" }}>leading companies.</Text>
                </SectionTitle>
              </View>
              {!isMobile && (
                <View style={{ maxWidth: 360, paddingBottom: 8 }}>
                  <Text style={{ fontFamily: SANS, fontSize: 16, color: INK_2, lineHeight: 26 }}>
                    From historic repertory houses to contemporary ensembles — Danza is where companies list and dancers discover.
                  </Text>
                </View>
              )}
            </View>

            {/* Grid: 4 cols on large, 2 on mobile */}
            <View style={{ borderTopWidth: 1, borderTopColor: RULE, borderLeftWidth: 1, borderLeftColor: RULE }}>
              {(() => {
                const cols = isMobile ? 2 : 4;
                const rows: (typeof COMPANIES)[] = [];
                for (let i = 0; i < COMPANIES.length; i += cols) {
                  rows.push(COMPANIES.slice(i, i + cols));
                }
                return rows.map((row, ri) =>
                  <View key={ri} style={{ flexDirection: "row" }}>
                    {row.map((c, ci) => (
                      <CompanyCell
                        key={ci}
                        name={c.name}
                        loc={c.loc}
                        isLastRow={ri === rows.length - 1}
                      />
                    ))}
                  </View>
                );
              })()}
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={{ borderTopWidth: 1, borderTopColor: RULE, paddingHorizontal: pH, paddingTop: 64, paddingBottom: 36 }}>
          <View style={{ maxWidth: wrap(width), alignSelf: "center", width: "100%" }}>
            {/* Top: brand + link columns */}
            <View style={{ flexDirection: isMobile ? "column" : "row", gap: isMobile ? 40 : 32, marginBottom: 56 }}>
              <View style={{ flex: isMobile ? undefined : 1.4 }}>
                <View style={styles.brand}>
                  <View style={styles.brandMark}>
                    <Image
                      source={require("../../assets/images/favicon.png")}
                      style={{ width: 28, height: 28 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={[styles.brandWord, { fontFamily: SERIF }]}>
                    Danza <Text style={{ fontStyle: "italic" }}>App</Text>
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: SERIF,
                    fontSize: 20,
                    lineHeight: 26,
                    color: Colors.text,
                    marginTop: 16,
                    maxWidth: 320,
                  }}
                >
                  A quiet, worldwide directory{" "}
                  <Text style={{ fontStyle: "italic", color: INK_2 }}>of ballet auditions</Text>
                  {" "}— made free, for dancers and companies.
                </Text>
              </View>

              {[
                {
                  title: "Platform",
                  links: [
                    { label: "Auditions", onPress: goAuditions },
                    { label: "Companies", onPress: goCompanies },
                    { label: "Alerts", onPress: goAlerts },
                  ],
                },
                {
                  title: "For Companies",
                  links: [
                    { label: "List a call", onPress: goCompanies },
                    { label: "Contact", onPress: goAlerts },
                  ],
                },
                {
                  title: "About",
                  links: [
                    { label: "Privacy", onPress: () => router.push("/policies") },
                    { label: "Terms", onPress: () => router.push("/policies") },
                  ],
                },
              ].map(({ title, links }) => (
                <View key={title} style={{ flex: 1, minWidth: 120 }}>
                  <Text
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: 3,
                      textTransform: "uppercase",
                      color: INK_3,
                      marginBottom: 16,
                      fontWeight: "500",
                    }}
                  >
                    {title}
                  </Text>
                  <View style={{ gap: 10 }}>
                    {links.map(({ label, onPress }) => (
                      <Pressable key={label} onPress={onPress}>
                        <Text style={{ fontFamily: SANS, fontSize: 14, color: Colors.text }}>
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {/* Bottom bar */}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: RULE,
                paddingTop: 24,
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                gap: 16,
              }}
            >
              <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: INK_3 }}>
                © {new Date().getFullYear()} Danza App · Made for the dance community
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {[
                  { name: "logo-instagram", label: "Instagram" },
                  { name: "logo-twitter", label: "X" },
                  { name: "mail-outline", label: "Email" },
                ].map(({ name, label }) => (
                  <View
                    key={label}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      borderWidth: 1,
                      borderColor: RULE_STRONG,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    accessibilityLabel={label}
                  >
                    <Ionicons name={name as any} size={12} color={Colors.text} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { flexGrow: 1 },

  // Navbar
  navbar: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  navInner: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "100%",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: RULE,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  brandWord: { fontSize: 22, fontWeight: "500", color: "#000" },
  navLinks: { flexDirection: "row", gap: 36 },
  navLink: { fontSize: 14, letterSpacing: 0.3, color: "#000" },
  navCta: {
    backgroundColor: "#000",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 6,
  },
  navCtaText: { color: "#fff", fontSize: 13, fontWeight: "500", letterSpacing: 0.3 },

  // Hero
  heroMark: {
    position: "absolute",
    bottom: "8%",
    left: "4%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.purple,
  },
  heroMarkText: { fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: INK_3 },

  // Buttons
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 6,
  },
  btnPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "500", letterSpacing: 0.3 },
  btnGhost: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
  },
  btnGhostText: { color: "#000", fontSize: 14, fontWeight: "400" },

  // Dark CTA form
  ctaForm: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 8,
    gap: 8,
    alignItems: "stretch",
  },
  ctaInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  ctaBtn: {
    backgroundColor: Colors.purple,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnSent: { backgroundColor: "#2a2a2a" },
  ctaBtnText: { color: "#fff", fontSize: 14, fontWeight: "500", letterSpacing: 0.3 },
});
