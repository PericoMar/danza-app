// components/auditions/LabeledListEditor.tsx
// Editor de una lista ordenada de valores con texto opcional (enlaces de
// inscripción, emails): cada fila tiene el valor, su texto con atajos, y se
// puede subir, bajar o quitar. Lo que cambia entre listas llega por props.
import React from "react";
import { View, Text, StyleSheet, useWindowDimensions, type KeyboardTypeOptions } from "react-native";
import { FormErrors, LabeledDraft } from "@/utils/auditionForm";
import { moveItem } from "@/utils/arrays";
import { Chip, FormInput, TextButton, formStyles } from "@/components/auditions/AuditionFormFields";

const WIDE_MIN_WIDTH = 650;

type InputConfig = {
  label: string;
  placeholder: string;
  maxLength: number;
};

type Props<F extends string> = {
  title: string;
  hint: string;
  /** Campo del borrador que guarda el valor (`url`, `email`). */
  field: F;
  rows: LabeledDraft<F>[];
  onChange: (rows: LabeledDraft<F>[]) => void;
  create: () => LabeledDraft<F>;
  errors: FormErrors;
  /** Nombre de una fila en los textos de accesibilidad ("link", "email"). */
  itemName: string;
  itemTitle: (index: number) => string;
  addLabel: string;
  valueInput: InputConfig & { keyboardType: KeyboardTypeOptions };
  labelInput: InputConfig & {
    /** Se muestra mientras el texto está vacío, para decir qué se verá en su lugar. */
    emptyHint: string;
    presets: readonly string[];
    /** Prefijo del nombre accesible de cada atajo ("Button text: Apply online"). */
    presetName: string;
  };
};

export default function LabeledListEditor<F extends string>({
  title,
  hint,
  field,
  rows,
  onChange,
  create,
  errors,
  itemName,
  itemTitle,
  addLabel,
  valueInput,
  labelInput,
}: Props<F>) {
  const { width } = useWindowDimensions();
  const wide = width > WIDE_MIN_WIDTH;

  const update = (key: string, patch: Partial<LabeledDraft<F>>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <View style={formStyles.section}>
      <Text style={formStyles.label}>{title}</Text>
      <Text style={formStyles.hint}>{hint}</Text>

      {rows.map((row, i) => (
        <View key={row.key} style={styles.block}>
          <View style={styles.blockHead}>
            <Text style={styles.blockTitle}>{itemTitle(i)}</Text>
            <View style={styles.actions}>
              {i > 0 && (
                <TextButton
                  label="↑ Up"
                  onPress={() => onChange(moveItem(rows, i, -1))}
                  accessibilityLabel={`Move ${itemName} ${i + 1} up`}
                />
              )}
              {i < rows.length - 1 && (
                <TextButton
                  label="↓ Down"
                  onPress={() => onChange(moveItem(rows, i, 1))}
                  accessibilityLabel={`Move ${itemName} ${i + 1} down`}
                />
              )}
              <TextButton
                label="Remove"
                tone="danger"
                onPress={() => onChange(rows.filter((r) => r.key !== row.key))}
                accessibilityLabel={`Remove ${itemName} ${i + 1}`}
              />
            </View>
          </View>

          <View style={[styles.row, wide && styles.rowWide]}>
            <View style={[styles.cell, wide && styles.cellWide]}>
              <FormInput
                label={valueInput.label}
                value={row[field]}
                onChangeText={(value) => update(row.key, { [field]: value } as Partial<LabeledDraft<F>>)}
                maxLength={valueInput.maxLength}
                error={errors[`${row.key}.${field}`]}
                placeholder={valueInput.placeholder}
                autoCapitalize="none"
                keyboardType={valueInput.keyboardType}
              />
            </View>
            <View style={styles.cell}>
              <FormInput
                label={labelInput.label}
                value={row.label}
                onChangeText={(label) => update(row.key, { label } as Partial<LabeledDraft<F>>)}
                maxLength={labelInput.maxLength}
                placeholder={labelInput.placeholder}
                hint={row.label.trim() ? undefined : labelInput.emptyHint}
              />
            </View>
          </View>
          <View style={styles.chips}>
            {labelInput.presets.map((preset) => {
              const active = row.label.trim() === preset;
              return (
                <Chip
                  key={preset}
                  label={preset}
                  active={active}
                  onPress={() => update(row.key, { label: active ? "" : preset } as Partial<LabeledDraft<F>>)}
                  accessibilityLabel={`${labelInput.presetName}: ${preset}`}
                />
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.addRow}>
        <TextButton label={addLabel} onPress={() => onChange([...rows, create()])} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10, marginTop: 12, gap: 4 },
  blockHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 12 },
  blockTitle: { fontWeight: "700", fontSize: 15, color: "#111" },
  actions: { flexDirection: "row", alignItems: "center", gap: 14 },
  row: { flexDirection: "column" },
  rowWide: { flexDirection: "row", gap: 12 },
  cell: { flex: 1, minWidth: 0 },
  cellWide: { flex: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 },
  addRow: { marginTop: 10 },
});
