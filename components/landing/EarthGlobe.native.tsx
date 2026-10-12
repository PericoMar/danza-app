// components/landing/EarthGlobe.native.tsx
// Fallback for native: Three.js/WebGL not available.
// Shows a styled circle as a decorative placeholder.
import React from "react";
import { View, StyleSheet } from "react-native";

export default function EarthGlobe() {
  return (
    <View style={styles.wrap}>
      <View style={styles.globe} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  globe: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#1D3B6E",
    borderWidth: 1,
    borderColor: "rgba(68,119,170,0.4)",
  },
});
