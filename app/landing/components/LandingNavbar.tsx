import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { SERIF, SANS, RULE, landingStyles, wrap, hPad } from "@/theme/landing";
import { TABLET_BREAKPOINT } from "@/constants/layout";

interface LandingNavbarProps {
  width: number;
  onGoCompanies: () => void;
  onGoAuditions: () => void;
  onGoAlerts: () => void;
}

export default function LandingNavbar({ width, onGoCompanies, onGoAuditions, onGoAlerts }: LandingNavbarProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);

  return (
    <View style={[landingStyles.navbar, { paddingHorizontal: pH }]}>
      <View style={[landingStyles.navInner, { maxWidth: wrap(width) }]}>
        <Pressable
          onPress={onGoCompanies}
          style={landingStyles.brand}
          accessibilityRole="link"
          accessibilityLabel="Danza App"
        >
          <View style={landingStyles.brandMark}>
            <Image
              source={require("../../../assets/images/favicon.png")}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
          </View>
          <Text style={[landingStyles.brandWord, { fontFamily: SERIF }]}>
            Danza <Text style={{ fontStyle: "italic" }}>App</Text>
          </Text>
        </Pressable>

        {!isMobile && (
          <View style={landingStyles.navLinks}>
            {[
              { label: "Companies", onPress: onGoCompanies },
              { label: "Auditions", onPress: onGoAuditions },
              { label: "Alerts", onPress: onGoAlerts },
            ].map(({ label, onPress }) => (
              <Pressable key={label} onPress={onPress}>
                <Text style={[landingStyles.navLink, { fontFamily: SANS }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable onPress={onGoAlerts} style={landingStyles.navCta} accessibilityRole="button">
          <Text style={[landingStyles.navCtaText, { fontFamily: SANS }]}>Subscribe to Alerts</Text>
        </Pressable>
      </View>
    </View>
  );
}
