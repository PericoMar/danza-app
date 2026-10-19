import { StyleSheet } from "react-native";
import { RULE } from "@/theme/landing";
import { Colors } from "@/theme/colors";

// Shared chrome for the marketing surfaces: the site navbar and the primary /
// ghost buttons the /home sections reuse. Page-specific styles stay in their
// own screen — this is only what more than one surface renders identically.
export const siteStyles = StyleSheet.create({
  // Navbar
  navbar: {
    backgroundColor: Colors.bgGlass,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  navInner: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "100%",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: RULE,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  brandWord: { fontSize: 22, fontWeight: "500", color: "#000" },
  navLinks: { flexDirection: "row", gap: 36 },
  navLink: { fontSize: 14, letterSpacing: 0.3, color: "#000" },
  navCta: {
    backgroundColor: "#000",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 6,
  },
  navCtaText: { color: "#fff", fontSize: 13, fontWeight: "500", letterSpacing: 0.3 },

  // Buttons
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 6,
  },
  btnPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "500", letterSpacing: 0.3 },
  btnGhost: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
  },
  btnGhostText: { color: "#000", fontSize: 14, fontWeight: "400" },
});
