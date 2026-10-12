import React, { useMemo, useRef, useState } from "react";
import { TextInput, View, Text } from "react-native";
import { supabase } from "@/services/supabase";
import type { SnackbarState } from "@/types/ui";
import AuthTextInput from "@/components/auth/AuthTextInput";
import AuthButton from "@/components/auth/AuthButton";
import { authStyles } from "@/components/auth/authStyles";
import { useAuthScale } from "@/components/auth/useAuthScale";

type Props = {
  onSnackbar: (s: SnackbarState | null) => void;
  onSuccess: () => void;
};

export default function UpdatePasswordForm({ onSnackbar, onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const scale = useAuthScale();
  const confirmRef = useRef<TextInput>(null);

  const canSubmit = useMemo(() => {
    const p = password.trim();
    return p.length >= 8 && p === confirm.trim() && !loading;
  }, [password, confirm, loading]);

  const handleUpdate = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password.trim() });

      if (error) {
        onSnackbar({ message: error.message, color: "#EF4444", iconName: "close-circle-outline" });
        return;
      }

      onSnackbar({ message: "Password updated successfully.", color: "#4CAF50", iconName: "checkmark-circle-outline" });
      onSuccess();
    } catch (e) {
      console.error("[updateUser password] unexpected error", e);
      onSnackbar({ message: "Something went wrong. Please try again.", color: "#EF4444", iconName: "close-circle-outline" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text style={[authStyles.subtitle, scale.subtitle, { marginTop: 0, marginBottom: 16 }]}>
        Your new password must be at least 8 characters.
      </Text>

      <AuthTextInput
        value={password}
        onChangeText={setPassword}
        placeholder="New password"
        secureTextEntry
        accessibilityLabel="New password"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        blurOnSubmit={false}
      />

      <AuthTextInput
        ref={confirmRef}
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirm new password"
        secureTextEntry
        accessibilityLabel="Confirm new password"
        returnKeyType="go"
        onSubmitEditing={handleUpdate}
      />

      <AuthButton onPress={handleUpdate} label="Update password" loading={loading} disabled={!canSubmit} />
    </View>
  );
}
