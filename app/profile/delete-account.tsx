// app/profile/delete-account.tsx
import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "@/services/supabase";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";
import SiteHeader from "@/components/common/SiteHeader";

export default function DeleteAccountScreen() {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = useCallback(() => {
    router.replace("/profile");
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      setSubmitting(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        Alert.alert("Not authenticated", "Please log in again and retry.");
        return;
      }

      const resp = await fetch(`${getApiBaseUrl()}/api/account/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `Server error (${resp.status})`);
      }

      await supabase.auth.signOut();
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Deletion failed", e?.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  return (
    <>
      <SiteHeader />
      <SafeAreaView style={styles.safe}>
      <View style={styles.container} accessible accessibilityLabel="Delete account confirmation">
        <Ionicons
          name="warning-outline"
          size={112}
          style={styles.icon}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />

        <Text style={styles.title} accessibilityRole="header">
          Delete your account?
        </Text>

        <Text style={styles.subtitle}>
          This permanently deletes your profile, reviews and favorites. This action cannot be undone.
        </Text>

        <View style={styles.switchRow}>
          <Switch
            value={isAcknowledged}
            onValueChange={setIsAcknowledged}
            accessibilityRole="switch"
            accessibilityLabel="I understand the consequences"
          />
          <Text style={styles.switchLabel}>I understand the consequences</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.cancelBtn]}
            onPress={handleCancel}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Cancel and go back"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.deleteBtn,
              (!isAcknowledged || submitting) && styles.buttonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!isAcknowledged || submitting}
            accessibilityRole="button"
            accessibilityLabel="Confirm account deletion"
            accessibilityHint="Permanently deletes your account"
          >
            {submitting ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.deleteText}>Yes, delete my account</Text>
            )}
          </Pressable>
        </View>
      </View>
      </SafeAreaView>
    </>
  );
}

const BORDER_RADIUS = 16;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  icon: {
    opacity: 0.9,
    marginBottom: 8,
    color: "#f50b1b",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#000000",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 380,
  },
  switchRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  switchLabel: {
    color: "#000000",
    fontSize: 14,
  },
  actions: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  button: {
    minWidth: 150,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
  },
  deleteBtn: {
    backgroundColor: "#DC2626",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelText: {
    color: "#E5E7EB",
    fontWeight: "600",
  },
  deleteText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
