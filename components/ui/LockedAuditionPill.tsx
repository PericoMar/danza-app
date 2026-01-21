import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";

export function LockedAuditionPill() {
  return (
    <View style={styles.lockedPill} accessibilityRole="button">
      <Ionicons name="lock-closed" size={16} color="#ffffff" />
      <Text style={styles.lockedText}>Login to unlock audition info</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockedPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.purple,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  lockedText: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
  },
});
