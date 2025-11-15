// app/companies/[companyId]/delete.tsx
import React, { useState, useCallback } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { deleteCompany } from "@/hooks/useCompanies";


export default function DeleteCompanyScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = useCallback(() => {
    if (!companyId) {
      // Fallback if for some reason companyId is missing
      router.replace("/companies");
      return;
    }
    router.replace(`/reviews/${companyId}`);
  }, [companyId]);

  const handleConfirm = useCallback(async () => {
    if (!companyId) {
      Alert.alert("Missing company ID");
      return;
    }
    try {
      setSubmitting(true);
      await deleteCompany(String(companyId));
      // After successful deletion, send the user somewhere safe (e.g., companies list)
      router.replace("/companies");
    } catch (e: any) {
      Alert.alert("Deletion failed", e?.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [companyId]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container} accessible accessibilityLabel="Delete company confirmation">
        <Ionicons
          name="warning-outline"
          size={112}
          style={styles.icon}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />

        <Text style={styles.title} accessibilityRole="header">
          Delete this company?
        </Text>

        <Text style={styles.subtitle}>
          This action is permanent and cannot be undone.
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
            style={[
              styles.button,
              styles.cancelBtn,
            ]}
            onPress={handleCancel}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Cancel and go back"
            accessibilityHint="Returns to the company reviews page"
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
            accessibilityLabel="Confirm deletion"
            accessibilityHint="Permanently deletes this company"
          >
            {submitting ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.deleteText}>Yes, delete company</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const BORDER_RADIUS = 16;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffffff",
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
    color: "#f50b1bff", // amber-ish warning (adjust to your theme)
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000ff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#000000ff",
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
    color: "#000000ff",
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
