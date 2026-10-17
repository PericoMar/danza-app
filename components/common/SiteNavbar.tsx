import React, { useRef } from "react";
import { View, Text, Pressable, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SANS, RULE, wrap, hPad } from "@/theme/landing";
import { siteStyles } from "@/components/common/siteStyles";
import { TABLET_BREAKPOINT } from "@/constants/layout";
import { useAuth } from "@/providers/AuthProvider";
import ChromeSurface from "@/components/companies/ChromeSurface";
import { LOGIN_ROUTE } from "@/constants/routes";

const INSTAGRAM_URL = "https://www.instagram.com/danza_app/";
const MENU_GAP = 8;

export interface MenuAnchor {
  top: number;
  right: number;
}

interface SiteNavbarProps {
  width: number;
  onGoCompanies: () => void;
  onGoAlerts: () => void;
  /** Optional so screens that render this directly keep their own set of links. */
  onGoResources?: () => void;
  onOpenMenu?: (anchor: MenuAnchor) => void;
}

/**
 * The site-wide top navigation. Presentational — the caller owns the routing and
 * (optionally) the menu modal it anchors. `SiteHeader` wires both for the common
 * case; screens that need custom handlers render this directly.
 */
export default function SiteNavbar({
  width,
  onGoCompanies,
  onGoAlerts,
  onGoResources,
  onOpenMenu,
}: SiteNavbarProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);
  const menuButtonRef = useRef<View>(null);
  const router = useRouter();
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const insets = useSafeAreaInsets();

  const handleOpenMenu = () => {
    menuButtonRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
      onOpenMenu?.({ top: pageY + h + MENU_GAP, right: width - (pageX + w) });
    });
  };

  return (
    <View style={[siteStyles.navbar, { paddingHorizontal: pH, paddingTop: insets.top }]}>
      <View style={[siteStyles.navInner, { maxWidth: wrap(width) }]}>
        <Pressable
          onPress={onGoCompanies}
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

        {!isMobile && (
          <View style={siteStyles.navLinks}>
            {[
              { label: "Companies", onPress: onGoCompanies },
              ...(onGoResources ? [{ label: "Resources", onPress: onGoResources }] : []),
              { label: "Alerts", onPress: onGoAlerts },
            ].map(({ label, onPress }) => (
              <Pressable key={label} onPress={onPress}>
                <Text style={[siteStyles.navLink, { fontFamily: SANS }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* On mobile Instagram lives in the menu, freeing room for Log in. */}
          {!isMobile && (
            <Pressable
              onPress={() => Linking.openURL(INSTAGRAM_URL)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: RULE,
                alignItems: "center",
                justifyContent: "center",
              }}
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

          <Pressable onPress={onGoAlerts} style={siteStyles.navCta} accessibilityRole="button">
            <Text style={[siteStyles.navCtaText, { fontFamily: SANS }]}>
              {isMobile ? "Alerts" : "Subscribe to Alerts"}
            </Text>
          </Pressable>

          {onOpenMenu && (
            <Pressable
              ref={menuButtonRef}
              onPress={handleOpenMenu}
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: RULE,
                alignItems: "center",
                justifyContent: "center",
              }}
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
