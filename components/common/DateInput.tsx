// components/common/DateInput.tsx
// NOT IMPLEMENTED: Componente de input de fecha que funciona en web y en iOS/Android
import React, { useMemo, useState } from "react";
import { Platform, View, Text, TextInput, Pressable } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

type Props = {
  label: string;
  value: string;                 // YYYY-MM-DD (o '')
  onChange: (yyyyMmDd: string) => void;
  error?: string;
  placeholder?: string;
  min?: string;                  // YYYY-MM-DD
  max?: string;                  // YYYY-MM-DD
  styles: any;                   // reutiliza tus estilos del form (label, input, etc.)
};

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromYmd(s?: string) {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export default function DateInput({ label, value, onChange, error, placeholder, min, max, styles }: Props) {
  const [open, setOpen] = useState(false);
  const date = useMemo(() => fromYmd(value) ?? new Date(), [value]);

  if (Platform.OS === "web") {
    // En web usamos el input nativo de fecha
    return (
      <View style={styles.inputBox}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore: usamos el input HTML directamente en web */}
        <input
          type="date"
          value={value || ""}
          min={min}
          max={max}
          placeholder={placeholder}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            // estilo similar a tu TextInput
            borderWidth: 1,
            borderColor: error ? "#d32f2f" : "#e1e4e8",
            borderRadius: 7,
            padding: 10,
            background: "#f6f8fa",
            fontSize: 15,
            color: "#222",
            fontWeight: 500,
            width: "100%",
          }}
        />
        <View style={styles.inputBottomRow}>
          <Text style={styles.charCount}>{(value || "").length}/10</Text>
          {error ? <Text style={styles.inputErrorText}>{error}</Text> : <View />}
        </View>
      </View>
    );
  }

  // iOS/Android: mostramos un botón que abre el picker nativo
  const onChangeNative = (_: DateTimePickerEvent, selected?: Date) => {
    setOpen(false);
    if (selected) onChange(toYmd(selected));
  };

  const minDate = fromYmd(min);
  const maxDate = fromYmd(max);

  return (
    <View style={styles.inputBox}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={[styles.input, error && styles.inputError, { justifyContent: "center" }]}
      >
        <Text style={{ color: value ? "#222" : "#6b7280" }}>
          {value || placeholder || "YYYY-MM-DD"}
        </Text>
      </Pressable>

      {open && (
        <DateTimePicker
          mode="date"
          value={date}
          onChange={onChangeNative}
          minimumDate={minDate}
          maximumDate={maxDate}
          display={Platform.OS === "ios" ? "inline" : "default"}
        />
      )}

      <View style={styles.inputBottomRow}>
        <Text style={styles.charCount}>{(value || "").length}/10</Text>
        {error ? <Text style={styles.inputErrorText}>{error}</Text> : <View />}
      </View>
    </View>
  );
}
