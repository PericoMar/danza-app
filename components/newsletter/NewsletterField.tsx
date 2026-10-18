import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { INTER } from "@/theme/companies";
import { SANS } from "@/theme/landing";
import { NL } from "./styles";
import { EmailSuggestion } from "./EmailSuggestion";

export type NewsletterFieldVariant = "light" | "dark";

interface NewsletterFieldProps {
  /**
   * "light" — pill field on white (the /newsletter hero).
   * "dark"  — joined field on near-black (the /home "never miss an audition" section).
   */
  variant: NewsletterFieldVariant;
  /** Stack the input above a full-width button instead of sitting inline. */
  isCompact: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  /** When set, the address is shown read-only instead of an editable input. */
  lockedEmail?: string | null;
  placeholder?: string;
  /** A corrected address to offer under the field; see `suggestEmailFix`. */
  suggestion?: string | null;
  onAcceptSuggestion?: () => void;
}

const COPY: Record<
  NewsletterFieldVariant,
  { placeholder: string; label: string; loadingLabel: string }
> = {
  light: {
    placeholder: "name@email.com",
    label: "Subscribe Now",
    loadingLabel: "Subscribe Now",
  },
  dark: {
    placeholder: "you@example.com",
    label: "Subscribe →",
    loadingLabel: "Sending…",
  },
};

/**
 * The single email-capture form for the newsletter. Both the /newsletter hero and
 * the /home alerts section render this; the subscription wiring lives one level up in
 * `useNewsletter` (→ `services/newsletter`), so there is exactly one code path
 * from "type an email" to "call the API".
 */
export function NewsletterField({
  variant,
  isCompact,
  email,
  onEmailChange,
  onSubmit,
  isSubmitting,
  lockedEmail,
  placeholder,
  suggestion,
  onAcceptSuggestion,
}: NewsletterFieldProps) {
  const s = variant === "dark" ? dark : light;
  const copy = COPY[variant];
  const fontFamily = variant === "dark" ? SANS : INTER;
  const iconColor = variant === "dark" ? "rgba(255,255,255,0.55)" : NL.muted;

  return (
    <View style={{ width: "100%" }}>
      <View style={[s.field, isCompact && s.fieldCompact]}>
        <View style={[s.inputRow, isCompact && s.inputRowCompact]}>
          {variant === "light" && (
            <Ionicons name="mail-outline" size={19} color={iconColor} />
          )}
          {lockedEmail ? (
            <Text style={[s.input, { fontFamily }]} numberOfLines={1}>
              {lockedEmail}
            </Text>
          ) : (
            <TextInput
              style={[s.input, { fontFamily }]}
              placeholder={placeholder ?? copy.placeholder}
              placeholderTextColor={
                variant === "dark" ? "rgba(255,255,255,0.3)" : NL.muted
              }
              value={email}
              onChangeText={onEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              inputMode="email"
              editable={!isSubmitting}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
              accessibilityLabel="Email address"
            />
          )}
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          style={({ pressed }) => [
            s.button,
            isCompact && s.buttonCompact,
            pressed && { opacity: 0.82 },
            isSubmitting && { opacity: 0.6 },
          ]}
        >
          {isSubmitting && variant === "light" ? (
            <ActivityIndicator size="small" color={NL.bg} />
          ) : (
            <>
              <Text style={[s.buttonText, { fontFamily }]}>
                {isSubmitting ? copy.loadingLabel : copy.label}
              </Text>
              {variant === "light" && !isSubmitting && (
                <Ionicons name="arrow-forward" size={18} color={NL.bg} />
              )}
            </>
          )}
        </Pressable>
      </View>

      {!!suggestion && onAcceptSuggestion && (
        <EmailSuggestion
          suggestion={suggestion}
          onAccept={onAcceptSuggestion}
          variant={variant}
        />
      )}
    </View>
  );
}

// ─── "light" — pill on white (/newsletter) ───────────────────────────────────
const light = StyleSheet.create({
  field: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NL.bg,
    borderWidth: 1,
    borderColor: NL.fieldBorder,
    borderRadius: 999,
    height: 74,
    paddingLeft: 30,
    paddingRight: 8,
  },
  fieldCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    // "auto" and not undefined: a style object cannot unset a value with
    // undefined, so the 74px above survived the merge and the stacked input +
    // button spilled out of the pill, over the privacy note under it.
    height: "auto",
    borderRadius: 20,
    padding: 8,
    gap: 8,
  },
  inputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  inputRowCompact: {
    flex: 0,
    paddingLeft: 12,
    paddingRight: 12,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 16.5,
    color: NL.ink,
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: NL.ink,
    borderRadius: 999,
    height: 58,
    paddingHorizontal: 32,
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  buttonCompact: {
    height: 54,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: NL.bg,
  },
});

// ─── "dark" — joined field on near-black (/home) ─────────────────────────────
const dark = StyleSheet.create({
  field: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
  },
  fieldCompact: {
    flexDirection: "column",
  },
  inputRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  inputRowCompact: {
    flex: 0,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 58,
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  button: {
    backgroundColor: "#fff",
    paddingHorizontal: 26,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  buttonCompact: {
    paddingVertical: 18,
  },
  buttonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
    ...Platform.select({ web: { whiteSpace: "nowrap" } as object }),
  },
});
