// components/common/ConfirmDialog.tsx
import React from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 18,
            gap: 10,
          }}
          accessible
          accessibilityRole="alert"
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="alert-circle-outline" size={22} color="#b45309" />
            <Text style={{ fontSize: 16, fontWeight: "700" }}>{title}</Text>
          </View>

          {message ? <Text style={{ opacity: 0.9 }}>{message}</Text> : null}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12, justifyContent: "flex-end" }}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
              accessibilityRole="button"
              accessibilityLabel={cancelText}
            >
              <Text style={{ fontWeight: "600" }}>{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: loading ? "#f59e0b" : "#dc2626",
              }}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {loading ? "Procesando..." : confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
