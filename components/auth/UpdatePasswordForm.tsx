import React, { useMemo, useState } from "react";
import { View, TextInput, Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "@/services/supabase";
import type { SnackbarState } from "@/types/ui";

type Props = {
  onSnackbar: (s: SnackbarState | null) => void;
  onSuccess: () => void;
};

export default function UpdatePasswordForm({ onSnackbar, onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

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
    <View style={styles.form}>
      <Text style={styles.hint}>Your new password must be at least 8 characters.</Text>

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="New password"
        secureTextEntry
        style={styles.input}
        accessibilityLabel="New password"
      />

      <TextInput
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirm new password"
        secureTextEntry
        style={styles.input}
        accessibilityLabel="Confirm new password"
      />

      <Pressable
        onPress={handleUpdate}
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityLabel="Update password"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update password</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: "100%", maxWidth: 420, alignSelf: "center", marginTop: 18 },
  hint: { color: "#666", fontSize: 13, marginBottom: 10, textAlign: "center" },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "black",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
