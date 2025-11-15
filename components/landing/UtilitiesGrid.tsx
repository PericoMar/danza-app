// components/landing/UtilitiesGrid.tsx
import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { GRADIENT_TILE, SPACING, TYPO } from "../../theme/tokens";
import IconBubble from "../common/IconBubble";
import { LARGE_SCREEN_BREAKPOINT } from "@/constants/layout";

type Item = { icon: keyof typeof Ionicons.glyphMap; title: string; description: string };

type Props = {
  title: string;
  items: Item[];
};

export default function UtilitiesGrid({ title, items }: Props) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT;

  // padding responsive
  const paddingV = isLargeScreen ? 60 : 20;
  const paddingH = isLargeScreen ? 150 : 0;

  return (
    <View style={{ gap: SPACING.sm, paddingHorizontal: paddingH, paddingVertical: paddingV }}>
      <Text style={{ color: Colors.text, ...TYPO.h2 }}>{title}</Text>

      {/* Contenedor que permite wrap */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          // En RN web, usa gap si está disponible; si no, podrías simular con margins
          gap: SPACING.sm,
          borderStyle: "solid",
          borderWidth: 1,
          borderRadius: 16,
          padding: SPACING.sm,
          backgroundColor: Colors.purpleLight,
          borderColor: Colors.purple,
        }}
      >
        {items.map((it, i) => (
          <UtilityTile key={i} {...it} />
        ))}
      </View>
    </View>
  );
}

function UtilityTile({ icon, title, description }: Item) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT;

  return (
    <LinearGradient
      colors={GRADIENT_TILE}
      style={{
        // RESPONSIVE: en pantallas pequeñas ocupa el 100%
        // en grandes, un ancho cómodo por tile.
        flexBasis: isLargeScreen ? 330 : "100%",
        minWidth: 0,            // 👈 permite que el contenido encoja y haga wrap
        maxWidth: "100%",
        flexGrow: 1,

        borderRadius: 16,
        padding: SPACING.md,
        backgroundColor: Colors.bg,
      }}
    >
      <View style={{ gap: 8 }}>
        {/* Header row con wrap */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            flexWrap: "wrap",
            minWidth: 0, // 👈 necesario para que el título pueda romper
          }}
        >
          <IconBubble>
            <Ionicons name={icon} size={18} color={Colors.bg} />
          </IconBubble>

          {/* Título con wrap garantizado */}
          <View style={{ flex: 1, minWidth: 0, flexShrink: 1 }}>
            <Text
              style={{
                color: Colors.text,
                fontWeight: "800",
              }}
            >
              {title}
            </Text>
          </View>
        </View>

        {/* Descripción con wrap garantizado */}
        <Text
          style={{
            color: Colors.textLightDark,
            lineHeight: 20,
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          {description}
        </Text>
      </View>
    </LinearGradient>
  );
}
