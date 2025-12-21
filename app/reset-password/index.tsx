import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import Snackbar from "@/components/Snackbar";
import type { SnackbarState } from "@/types/ui";
import ResetPasswordRequestForm from "@/components/auth/ResetPasswordRequestForm";

export default function ResetPasswordScreen() {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  return (
    <View style={styles.container}>
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={3500}
          onClose={() => setSnackbar(null)}
        />
      )}

      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>
        Enter your email and we’ll send you a link to set a new password.
      </Text>

      <ResetPasswordRequestForm onSnackbar={setSnackbar} />

      <Text style={styles.bottomText}>
        Back to <Link href="/login" style={styles.linkText}>Login</Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
  subtitle: { marginTop: 10, textAlign: "center", color: "#666", fontSize: 14, lineHeight: 20 },
  bottomText: { marginTop: 18, textAlign: "center", color: "#666", fontSize: 14 },
  linkText: { color: "#007AFF", fontWeight: "bold" },
});
