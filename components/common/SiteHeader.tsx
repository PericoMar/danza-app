import React, { useState } from "react";
import { useWindowDimensions } from "react-native";
import { Stack, useRouter } from "expo-router";

import SiteNavbar, { MenuAnchor } from "@/components/common/SiteNavbar";
import MenuModal from "@/components/modals/MenuModal";
import { RESOURCES_ROUTE } from "@/constants/routes";
import { loadLandingFonts } from "@/theme/landing";

loadLandingFonts();

/**
 * Shared top navigation for every page — `SiteNavbar` + the `MenuModal` it
 * anchors, with routing pre-wired. Drop it in as the first child of a screen's
 * root view; it also hides the native Stack header.
 */
export default function SiteHeader() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SiteNavbar
        width={width}
        onGoCompanies={() => router.push("/companies")}
        onGoResources={() => router.push(RESOURCES_ROUTE)}
        onGoAlerts={() => router.push("/newsletter")}
        onOpenMenu={(anchor) => {
          setMenuAnchor(anchor);
          setIsMenuOpen(true);
        }}
      />

      <MenuModal
        isVisible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        anchor={menuAnchor ?? undefined}
      />
    </>
  );
}
