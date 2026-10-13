// components/auditions/AuditionFormFields.tsx
// Piezas y estilos compartidos por el formulario de audición y su editor de calendario.
import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet, type KeyboardTypeOptions } from "react-native";

export function FormInput({
  label,
  value,
  onChangeText,
  maxLength,
  error,
  placeholder,
  hint,
  multiline = false,
  numberOfLines,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  maxLength: number;
  error?: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: "none" | "characters";
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        style={[formStyles.input, multiline && formStyles.inputMultiline, !!error && formStyles.inputError]}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        accessibilityLabel={label}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoCorrect={keyboardType === "url" || keyboardType === "email-address" ? false : undefined}
      />
      {!!hint && <Text style={formStyles.hint}>{hint}</Text>}
      <View style={formStyles.inputBottomRow}>
        <Text style={formStyles.charCount}>
          {value.length}/{maxLength}
        </Text>
        {error ? <Text style={formStyles.inputErrorText}>{error}</Text> : <View />}
      </View>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[formStyles.chip, active && formStyles.chipActive]}
    >
      <Text style={[formStyles.chipText, active && formStyles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Checkbox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <View style={formStyles.checkboxRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        onPress={onToggle}
        style={[formStyles.checkbox, checked && formStyles.checkboxActive]}
      >
        {checked ? <Text style={{ color: "#fff" }}>✓</Text> : null}
      </Pressable>
      <Text style={formStyles.checkboxLabel}>{label}</Text>
    </View>
  );
}

export function TextButton({
  label,
  onPress,
  tone = "primary",
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "danger";
  accessibilityLabel?: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}>
      <Text style={tone === "danger" ? formStyles.dangerLink : formStyles.link}>{label}</Text>
    </Pressable>
  );
}

export const formStyles = StyleSheet.create({
  section: {
    backgroundColor: "#fff", borderRadius: 11, padding: 10,
    shadowColor: "#aaa", shadowOpacity: 0.07, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    borderWidth: 1, borderColor: "#ececec", width: "100%",
  },
  field: { width: "100%", marginBottom: 6 },
  label: { fontWeight: "600", marginBottom: 4, fontSize: 14, color: "#111" },
  hint: { fontSize: 12, opacity: 0.7, marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#e1e4e8", borderRadius: 7, padding: 10, backgroundColor: "#f6f8fa", fontSize: 15, color: "#222", fontWeight: "500" },
  inputMultiline: { minHeight: 120, paddingTop: 12, paddingBottom: 12 },
  inputError: { borderColor: "#d32f2f" },
  inputBottomRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  charCount: { fontSize: 11, color: "#999" },
  inputErrorText: { color: "#d32f2f", fontSize: 12, marginLeft: 8, fontWeight: "600", flexShrink: 1 },
  errorText: { color: "#d32f2f", fontSize: 12, fontWeight: "600", marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#9ca3af", backgroundColor: "transparent" },
  chipActive: { borderColor: "#111827", backgroundColor: "#111827" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#111827" },
  chipTextActive: { color: "#ffffff" },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: "#bbb", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  checkboxActive: { backgroundColor: "#111", borderColor: "#111" },
  checkboxLabel: { fontWeight: "600", flex: 1 },
  link: { color: "#2563eb", fontWeight: "600" },
  dangerLink: { color: "#b91c1c", fontSize: 13 },
});
