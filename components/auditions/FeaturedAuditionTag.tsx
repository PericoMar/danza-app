// components/auditions/FeaturedAuditionTag.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ChromeSurface from "@/components/companies/ChromeSurface";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";

/**
 * Marks the audition dancers see on the company card and page. Dark chrome
 * pill (the design's "selected / premium" state) so it reads above the
 * pastel status pills next to it.
 */
export default function FeaturedAuditionTag() {
  return (
    <View accessible accessibilityLabel="Featured: shown to dancers on the company card and page">
      <ChromeSurface variant="dark" borderRadius={999} style={styles.pill}>
        <Ionicons name="star" size={10} color={Colors.white} />
        <Text style={styles.label}>Featured</Text>
      </ChromeSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  label: {
    fontFamily: INTER,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Colors.white,
  },
});
