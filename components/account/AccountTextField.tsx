import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Platform, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/companies";
import { accountStyles } from "./styles";

type AccountTextFieldProps = {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  /** Leading icon inside the field. */
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  /** Read-only: greyed out with a lock, not focusable. */
  locked?: boolean;
  multiline?: boolean;
  /** Helper text under the field; replaced by `error` when that is set. */
  hint?: string;
  error?: string | null;
  inputProps?: Omit<TextInputProps, "value" | "onChangeText" | "placeholder" | "editable" | "multiline" | "style">;
};

/** Labelled hairline input used by every field on the profile form. */
export function AccountTextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  locked = false,
  multiline = false,
  hint,
  error,
  inputProps,
}: AccountTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const iconColor = focused ? Colors.text : Colors.textMuted;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.box,
          multiline && styles.boxMultiline,
          focused && styles.boxFocused,
          locked && styles.boxLocked,
          !!error && styles.boxError,
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={18} color={iconColor} style={multiline ? styles.iconTop : undefined} />
        ) : null}
        <TextInput
          {...inputProps}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          editable={!locked}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            inputProps?.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps?.onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, locked && styles.inputLocked]}
        />
        {locked ? <Ionicons name="lock-closed" size={15} color={Colors.textMuted} /> : null}
      </View>

      {error ? (
        <Text style={accountStyles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={accountStyles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.grey1,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    borderRadius: 14,
    backgroundColor: Colors.white,
    ...Platform.select({
      web: { transitionProperty: "border-color, box-shadow", transitionDuration: "150ms" } as object,
      default: {},
    }),
  },
  boxMultiline: {
    alignItems: "flex-start",
    paddingVertical: 14,
  },
  boxFocused: {
    borderColor: Colors.text,
    ...Platform.select({
      web: { boxShadow: "0 0 0 3px rgba(0,0,0,0.06)" } as object,
      default: {},
    }),
  },
  boxLocked: {
    backgroundColor: Colors.specSurface,
    borderColor: Colors.rule,
  },
  boxError: {
    borderColor: Colors.dangerText,
  },
  iconTop: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: INTER,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
    ...Platform.select({ web: { outlineStyle: "none" } as object, default: {} }),
  },
  inputMultiline: {
    minHeight: 120,
    paddingVertical: 0,
    lineHeight: 23,
  },
  inputLocked: {
    color: Colors.grey2,
    ...Platform.select({ web: { cursor: "not-allowed" } as object, default: {} }),
  },
});
