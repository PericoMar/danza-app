// components/auditions/RichTextField.tsx
// Campo de texto con formato: una barra que escribe la sintaxis (títulos,
// negrita, cursiva, listas, enlace) y una vista previa de cómo se verá.
import React, { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import RichText from "@/components/common/RichText";
import { Chip, FieldFrame, PLACEHOLDER_COLOR, formStyles } from "@/components/auditions/AuditionFormFields";
import { RichTextFormat } from "@/constants/richText";
import { applyRichTextFormat, type TextSelection } from "@/utils/richTextEditing";

const TOOLBAR: { format: RichTextFormat; label: string; a11y: string; style?: TextStyle }[] = [
  { format: RichTextFormat.HEADING_2, label: "H2", a11y: "Heading" },
  { format: RichTextFormat.HEADING_3, label: "H3", a11y: "Subheading" },
  { format: RichTextFormat.BOLD, label: "B", a11y: "Bold", style: { fontWeight: "800" } },
  { format: RichTextFormat.ITALIC, label: "I", a11y: "Italic", style: { fontStyle: "italic" } },
  { format: RichTextFormat.BULLET_LIST, label: "• List", a11y: "Bulleted list" },
  { format: RichTextFormat.NUMBERED_LIST, label: "1. List", a11y: "Numbered list" },
  { format: RichTextFormat.LINK, label: "Link", a11y: "Link" },
];

const SYNTAX_HINT =
  "Select text and use the buttons, or type it: ## Heading, ### Subheading, **bold**, *italic*, " +
  "- list, 1. list, [text](https://…). Web addresses become links on their own.";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  maxLength: number;
  error?: string;
  placeholder?: string;
};

export default function RichTextField({ label, value, onChangeText, maxLength, error, placeholder }: Props) {
  const inputRef = useRef<TextInput>(null);
  const lastSelection = useRef<TextSelection | null>(null);
  // Selección que pone la barra; se suelta en cuanto el campo la confirma para no fijar el cursor.
  const [forcedSelection, setForcedSelection] = useState<TextSelection>();
  const [preview, setPreview] = useState(false);

  // En web el textarea guarda su selección aunque pierda el foco al pulsar la barra,
  // y `onSelectionChange` no avisa de cada movimiento del cursor: se lee de él.
  const currentSelection = (): TextSelection => {
    const node = inputRef.current as unknown as { selectionStart?: number; selectionEnd?: number } | null;
    if (Platform.OS === "web" && typeof node?.selectionStart === "number") {
      return { start: node.selectionStart, end: node.selectionEnd ?? node.selectionStart };
    }
    return lastSelection.current ?? { start: value.length, end: value.length };
  };

  const applyFormat = (format: RichTextFormat) => {
    const next = applyRichTextFormat(value, currentSelection(), format);
    if (next.value.length > maxLength) return;
    lastSelection.current = next.selection;
    setForcedSelection(next.selection);
    onChangeText(next.value);
    inputRef.current?.focus();
  };

  return (
    <FieldFrame label={label} hint={SYNTAX_HINT} length={value.length} maxLength={maxLength} error={error}>
      <View style={styles.toolbar}>
        {TOOLBAR.map((tool) => (
          <Pressable
            key={tool.format}
            onPress={() => applyFormat(tool.format)}
            disabled={preview}
            accessibilityRole="button"
            accessibilityLabel={tool.a11y}
            style={({ pressed }) => [styles.tool, pressed && styles.toolPressed, preview && styles.toolDisabled]}
          >
            <Text style={[styles.toolText, tool.style]}>{tool.label}</Text>
          </Pressable>
        ))}
        <View style={styles.spacer} />
        <Chip label="Preview" active={preview} onPress={() => setPreview((v) => !v)} />
      </View>

      {preview ? (
        <View style={styles.preview}>
          {value.trim() ? <RichText text={value} /> : <Text style={styles.empty}>Nothing to preview yet.</Text>}
        </View>
      ) : (
        <TextInput
          ref={inputRef}
          style={[formStyles.input, formStyles.inputMultiline, styles.input, !!error && formStyles.inputError]}
          value={value}
          onChangeText={onChangeText}
          selection={forcedSelection}
          onSelectionChange={(e) => {
            lastSelection.current = e.nativeEvent.selection;
            if (forcedSelection) setForcedSelection(undefined);
          }}
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={PLACEHOLDER_COLOR}
          accessibilityLabel={label}
          multiline
          textAlignVertical="top"
        />
      )}
    </FieldFrame>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 8 },
  tool: {
    minWidth: 34,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#e1e4e8",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  toolPressed: { backgroundColor: "#f0f1f3" },
  toolDisabled: { opacity: 0.4 },
  toolText: { fontSize: 13, fontWeight: "600", color: "#111827" },
  spacer: { flexGrow: 1 },
  // Lo bastante alto para escribir una convocatoria entera sin hacer scroll dentro.
  input: { minHeight: 260 },
  preview: { minHeight: 260, padding: 12, borderWidth: 1, borderColor: "#e1e4e8", borderRadius: 7, backgroundColor: "#fff" },
  empty: { fontSize: 14, color: PLACEHOLDER_COLOR },
});
