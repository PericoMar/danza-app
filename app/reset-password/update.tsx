import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/services/supabase";
import Snackbar from "@/components/Snackbar";
import type { SnackbarState } from "@/types/ui";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasSession(!!data.session);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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

      <Text style={styles.title}>Set a new password</Text>

      {hasSession === false && (
        <Text style={styles.subtitle}>
          This link is not valid anymore or your session is missing. Please request a new reset email.
        </Text>
      )}

      {hasSession ? (
        <UpdatePasswordForm
          onSnackbar={setSnackbar}
          onSuccess={() => router.replace("/login")}
        />
      ) : (
        <Text style={styles.helpText}>
          Go to <Link href="/reset-password" style={styles.linkText}>Reset password</Link>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
  subtitle: { marginTop: 10, textAlign: "center", color: "#666", fontSize: 14, lineHeight: 20 },
  helpText: { marginTop: 18, textAlign: "center", color: "#666", fontSize: 14 },
  linkText: { color: "#007AFF", fontWeight: "bold" },
});
