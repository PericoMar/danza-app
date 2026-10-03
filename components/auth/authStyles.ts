import { Platform, StyleSheet } from "react-native";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";

// Shared visual language for the login / register / reset-password screens —
// mirrors the chrome-card + hairline-input conventions used on Companies /
// Insights (see .claude/skills/design-logic). Font sizes / heights that scale
// with screen width live in `useAuthScale` and are merged in at the call site;
// this file only holds the size-independent look (color, weight, radius...).
export const authStyles = StyleSheet.create({
  title: {
    marginTop: 12,
    fontWeight: "800",
    letterSpacing: -1,
    color: Colors.text,
    textAlign: "center",
    ...Platform.select({ web: { fontFamily: INTER } as any, default: {} }),
  },
  subtitle: {
    marginTop: 16,
    color: Colors.textLightDark,
    textAlign: "center",
  },
  label: {
    fontWeight: "600",
    color: Colors.grey1,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: Colors.specSurface,
    color: Colors.text,
    ...Platform.select({
      web: { fontFamily: INTER, outlineStyle: "none" } as any,
      default: {},
    }),
  },
  inputFocused: {
    borderColor: Colors.purpleSoft,
    backgroundColor: Colors.white,
    ...Platform.select({
      web: { boxShadow: `0 0 0 3px ${Colors.purpleLight}` } as any,
      default: {},
    }),
  },
  button: {
    backgroundColor: Colors.text,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: Colors.white,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  link: {
    color: Colors.purple,
    fontWeight: "600",
  },
  bottomText: {
    marginTop: 22,
    textAlign: "center",
    color: Colors.textMuted,
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: Colors.dangerSoft,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorText: {
    color: "#8a2020",
    fontWeight: "500",
    flex: 1,
  },
});
