import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SERIF, SANS, MONO, INK_2, INK_3, RULE, RULE_STRONG, landingStyles, wrap, hPad } from "@/theme/landing";
import { Colors } from "@/theme/colors";
import { TABLET_BREAKPOINT } from "@/constants/layout";

interface LandingFooterProps {
  width: number;
  onGoCompanies: () => void;
  onGoAuditions: () => void;
  onGoAlerts: () => void;
  onGoPrivacy: () => void;
  onGoTerms: () => void;
}

export default function LandingFooter({
  width,
  onGoCompanies,
  onGoAuditions,
  onGoAlerts,
  onGoPrivacy,
  onGoTerms,
}: LandingFooterProps) {
  const isMobile = width < TABLET_BREAKPOINT;
  const pH = hPad(width);

  const linkColumns = [
    {
      title: "Platform",
      links: [
        { label: "Auditions", onPress: onGoAuditions },
        { label: "Companies", onPress: onGoCompanies },
        { label: "Alerts", onPress: onGoAlerts },
      ],
    },
    {
      title: "For Companies",
      links: [
        { label: "List a call", onPress: onGoCompanies },
        { label: "Contact", onPress: onGoAlerts },
      ],
    },
    {
      title: "About",
      links: [
        { label: "Privacy", onPress: onGoPrivacy },
        { label: "Terms", onPress: onGoTerms },
      ],
    },
  ];

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: RULE, paddingHorizontal: pH, paddingTop: 64, paddingBottom: 36 }}>
      <View style={{ maxWidth: wrap(width), alignSelf: "center", width: "100%" }}>
        <View style={{ flexDirection: isMobile ? "column" : "row", gap: isMobile ? 40 : 32, marginBottom: 56 }}>
          <View style={{ flex: isMobile ? undefined : 1.4 }}>
            <View style={landingStyles.brand}>
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

          {linkColumns.map(({ title, links }) => (
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
  );
}
