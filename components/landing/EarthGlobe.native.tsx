// components/landing/EarthGlobe.native.tsx
// Fallback for native: Three.js/WebGL not available.
// Shows a styled circle as a decorative placeholder.
import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";

// Same contract as the web variant so a caller never has to know which platform
// it is on. There is no real globe here, so `onUnavailable` always fires and
// `onMarkerClick` is never called.
type Props = {
  onMarkerClick?: (country: string) => void;
  bleed?: boolean;
  onUnavailable?: () => void;
};

export default function EarthGlobe({ onUnavailable }: Props) {
  // Through a ref: callers pass an inline arrow, and depending on it directly
  // would re-run this on every render.
  const onUnavailableRef = useRef(onUnavailable);
  onUnavailableRef.current = onUnavailable;
  useEffect(() => { onUnavailableRef.current?.(); }, []);

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
