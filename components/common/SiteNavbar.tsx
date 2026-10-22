import React, { useRef } from "react";
import { View, Text, Pressable, Image, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SANS, RULE, wrap, hPad } from "@/theme/landing";
import { siteStyles } from "@/components/common/siteStyles";
import { TABLET_BREAKPOINT } from "@/constants/layout";
import { useAuth } from "@/providers/AuthProvider";
import ChromeSurface from "@/components/companies/ChromeSurface";
import { LOGIN_ROUTE } from "@/constants/routes";

const INSTAGRAM_URL = "https://www.instagram.com/danza_app/";
const MENU_GAP = 8;

/**
 * Whether the links to the listing go back to it instead of bringing it
 * forward. On a phone the listing sits at the bottom of the stack, and
 * expo-router 4 gives every route without a dynamic segment the same id, so a
 * plain link to it moves that screen from the bottom to the top. A reordered
 * stack is a case react-native-screens doesn't handle — iOS swaps the screens
 * without a transition and Android plays it as a pop — and a few Companies ↔
 * Alerts round trips left iOS frozen and Android blank. The browser keeps a
 * history of its own, so the web is left as it was.
 */
const UNWIND_TO_LISTING = Platform.OS !== "web";

/** The touch target every icon-only entry in the navbar shares. */
const iconButtonBase = {
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
} as const;

/** …and the square outline most of them wear. */
const iconButton = {
  ...iconButtonBase,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: RULE,
} as const;

export interface MenuAnchor {
  top: number;
  right: number;
}

interface SiteNavbarProps {
  width: number;
  /** Where the brand and the "Companies" entry point at. */
  companiesHref: Href;
  /** Where the "Alerts" entry and the subscribe call to action point at. */
  alertsHref: Href;
  /** Where the magnifier points at — a listing that focuses its search field. */
  searchHref: Href;
  onOpenMenu?: (anchor: MenuAnchor) => void;
}

/**
 * The site-wide top navigation. Presentational — the caller owns the
 * destinations and (optionally) the menu modal it anchors. `SiteHeader` wires
 * both for the common case; screens that need other destinations render this
 * directly.
 *
 * The destinations arrive as hrefs rather than handlers so every entry reaches
 * the browser as a real anchor. A crawler can only follow a URL it can see in
 * the markup, and an onPress is invisible to it.
 */
export default function SiteNavbar({ width, companiesHref, alertsHref, searchHref, onOpenMenu }: SiteNavbarProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);
  const menuButtonRef = useRef<View>(null);
  const router = useRouter();
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const insets = useSafeAreaInsets();
  // The magnifier is a phone shortcut for people who already have an account:
  // on a desktop the nav links are right there, and a guest row is busy enough
  // with Log in. Everyone else finds the search field on the companies listing.
  const showSearch = isLoggedIn && isMobile;

  const handleOpenMenu = () => {
    menuButtonRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
      onOpenMenu?.({ top: pageY + h + MENU_GAP, right: width - (pageX + w) });
    });
  };

  return (
    <View style={[siteStyles.navbar, { paddingHorizontal: pH, paddingTop: insets.top }]}>
      <View style={[siteStyles.navInner, { maxWidth: wrap(width) }]}>
        <Link href={companiesHref} dismissTo={UNWIND_TO_LISTING} asChild>
          <Pressable
            style={siteStyles.brand}
            accessibilityRole="link"
            accessibilityLabel="Danza App"
          >
            <View style={[siteStyles.brandMark, { width: 44, height: 44, borderRadius: 22 }]}>
              <Image
                source={require("../../assets/images/favicon.png")}
                style={{ width: 38, height: 38 }}
                resizeMode="contain"
              />
            </View>
            {!isMobile && (
              <Text style={[siteStyles.brandWord, { fontFamily: SANS, fontWeight: "900", fontSize: 20, letterSpacing: 0.5 }]}>
                danza app
              </Text>
            )}
          </Pressable>
        </Link>

        {!isMobile && (
          <View style={siteStyles.navLinks}>
            {[
              { label: "Companies", href: companiesHref, dismissTo: UNWIND_TO_LISTING },
              { label: "Alerts", href: alertsHref, dismissTo: false },
            ].map(({ label, href, dismissTo }) => (
              <Link key={label} href={href} dismissTo={dismissTo} asChild>
                <Pressable accessibilityRole="link">
                  <Text style={[siteStyles.navLink, { fontFamily: SANS }]}>{label}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* A link and not an onPress: the destination is a real URL, and the
              listing it lands on is the one that puts the cursor in its field.
              Bare, with no outline — it reads as an action, not as a button
              competing with Alerts. */}
          {showSearch && (
            <Link href={searchHref} dismissTo={UNWIND_TO_LISTING} asChild>
              <Pressable
                style={iconButtonBase}
                accessibilityRole="link"
                accessibilityLabel="Search"
              >
                <Ionicons name="search-outline" size={22} color="#000" />
              </Pressable>
            </Link>
          )}

          {/* On mobile Instagram lives in the menu, freeing room for Log in. */}
          {!isMobile && (
            <Pressable
              onPress={() => Linking.openURL(INSTAGRAM_URL)}
              style={iconButton}
              accessibilityRole="link"
              accessibilityLabel="Instagram"
            >
              <Ionicons name="logo-instagram" size={20} color="#000" />
            </Pressable>
          )}

          {!isLoggedIn && (
            <Pressable
              onPress={() => router.push(LOGIN_ROUTE)}
              accessibilityRole="button"
              accessibilityLabel="Log in"
            >
              <ChromeSurface
                variant="chrome"
                borderRadius={6}
                style={{ height: 40, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={[siteStyles.navCtaText, { fontFamily: SANS, color: "#000" }]}>Log in</Text>
              </ChromeSurface>
            </Pressable>
          )}

          {/* The only route to /newsletter on a phone, where the nav links are hidden. */}
          <Link href={alertsHref} asChild>
            <Pressable style={siteStyles.navCta} accessibilityRole="link">
              <Text style={[siteStyles.navCtaText, { fontFamily: SANS }]}>
                {isMobile ? "Alerts" : "Subscribe to Alerts"}
              </Text>
            </Pressable>
          </Link>

          {onOpenMenu && (
            <Pressable
              ref={menuButtonRef}
              onPress={handleOpenMenu}
              style={iconButton}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <Ionicons name="menu-outline" size={22} color="#000" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
