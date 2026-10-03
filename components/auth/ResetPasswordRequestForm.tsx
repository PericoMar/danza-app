import React, { useMemo, useState } from "react";
import { View, Platform } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "@/services/supabase";
import type { SnackbarState } from "@/types/ui";
import AuthTextInput from "@/components/auth/AuthTextInput";
import AuthButton from "@/components/auth/AuthButton";

type Props = {
  onSnackbar: (s: SnackbarState | null) => void;
};

/**
 * Sends a password reset email using Supabase.
 * NOTE: You must configure your Supabase Auth "Redirect URLs" to include your app/web URL.
 */
export default function ResetPasswordRequestForm({ onSnackbar }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email]);

  const handleSend = async () => {
    if (loading) return;

    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail || !isValidEmail) {
      onSnackbar({ message: "Please enter a valid email address.", color: "#EF4444", iconName: "close-circle-outline" });
      return;
    }

    setLoading(true);
    try {
      // This URL is where the user lands after clicking the email link.
      // Web keeps landing on the site; native deep-links straight back into
      // the app (myapp://reset-password/update) since there's no browser
      // session to pick the recovery token up from.
      const redirectTo =
        Platform.OS === "web"
          ? "https://danza-app.com/reset-password/update"
          : Linking.createURL("/reset-password/update");

      const { error } = await supabase.auth.resetPasswordForEmail(safeEmail, {
        redirectTo,
      });

      if (error) {
        console.error("[resetPasswordForEmail] error", error);
        onSnackbar({ message: error.message, color: "#EF4444", iconName: "close-circle-outline" });
        return;
      }

      onSnackbar({
        message: "Check your inbox. We’ve sent you a password reset link.",
        color: "#4CAF50",
        iconName: "checkmark-circle-outline",
      });
      setEmail("");
    } catch (e) {
      console.error("[resetPasswordForEmail] unexpected error", e);
      onSnackbar({ message: "Something went wrong. Please try again.", color: "#EF4444", iconName: "close-circle-outline" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <AuthTextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email address"
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Email address"
        returnKeyType="go"
        onSubmitEditing={handleSend}
      />

      <AuthButton
        onPress={handleSend}
        label="Send reset link"
        loading={loading}
        disabled={!isValidEmail}
      />
    </View>
  );
}
