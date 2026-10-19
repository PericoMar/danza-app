import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { INTER } from "@/theme/companies";
import { NewsletterConsentMode } from "@/constants/newsletterPopup";
import type { NewsletterPopupForm } from "@/hooks/useNewsletterPopupForm";
import { NL } from "../styles";
import type { PopupTone } from "./types";

type PopupConsentProps = {
  form: Pick<NewsletterPopupForm, "consentMode" | "hasConsent" | "toggleConsent">;
  onOpenPrivacyPolicy: () => void;
  tone?: PopupTone;
  isCentered?: boolean;
};

/**
 * The consent line of any popup design. A design doesn't pick between a
 * checkbox and a sentence: the form's consent mode does, so every design works
 * with either.
 */
export function PopupConsent({
  form,
  onOpenPrivacyPolicy,
  tone = "light",
  isCentered = false,
}: PopupConsentProps) {
  const isDark = tone === "dark";
  const link = (
    <Text
      style={[styles.link, isDark && styles.linkDark]}
      onPress={onOpenPrivacyPolicy}
      accessibilityRole="link"
    >
      Privacy Policy
    </Text>
  );

  if (form.consentMode === NewsletterConsentMode.INLINE) {
    return (
      <Text style={[styles.label, isDark && styles.labelDark, isCentered && styles.centered]}>
        By subscribing you agree to receive audition alerts and accept the {link}.
      </Text>
    );
  }

  return (
    <Pressable
      style={styles.checkboxRow}
      onPress={form.toggleConsent}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: form.hasConsent }}
    >
      <View
        style={[
          styles.checkbox,
          isDark && styles.checkboxDark,
          form.hasConsent && (isDark ? styles.checkboxCheckedDark : styles.checkboxChecked),
        ]}
      >
        {form.hasConsent && (
          <Ionicons name="checkmark" size={13} color={isDark ? NL.ink : NL.bg} />
        )}
      </View>
      <Text style={[styles.label, styles.checkboxLabel, isDark && styles.labelDark]}>
        I agree to receive audition alerts and accept the {link}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: NL.fieldBorder,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxDark: {
    borderColor: "rgba(255,255,255,0.3)",
  },
  checkboxChecked: {
    backgroundColor: NL.ink,
    borderColor: NL.ink,
  },
  checkboxCheckedDark: {
    backgroundColor: NL.bg,
    borderColor: NL.bg,
  },
  checkboxLabel: {
    flex: 1,
  },
  label: {
    fontFamily: INTER,
    fontSize: 12.5,
    lineHeight: 18,
    color: NL.muted,
  },
  labelDark: {
    color: "rgba(255,255,255,0.55)",
  },
  centered: {
    textAlign: "center",
  },
  link: {
    color: NL.ink,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  linkDark: {
    color: NL.bg,
  },
});
