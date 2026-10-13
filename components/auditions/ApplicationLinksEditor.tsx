// components/auditions/ApplicationLinksEditor.tsx
// Editor de los enlaces de inscripción de una audición: dónde se apunta el
// bailarín (formulario, subida de vídeo…). Se muestran como botones en la
// ficha pública, en este orden; el primero es el destacado.
import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import {
  APPLICATION_LINK_LABEL_MAX_CHARS,
  APPLICATION_LINK_LABEL_PRESETS,
  APPLICATION_LINK_URL_MAX_CHARS,
} from "@/constants/auditions";
import { ApplicationLinkDraft, FormErrors, emptyApplicationLink } from "@/utils/auditionForm";
import { moveItem } from "@/utils/arrays";
import { Chip, FormInput, TextButton, formStyles } from "@/components/auditions/AuditionFormFields";

const WIDE_MIN_WIDTH = 650;

type Props = {
  links: ApplicationLinkDraft[];
  onChange: (links: ApplicationLinkDraft[]) => void;
  errors: FormErrors;
};

export default function ApplicationLinksEditor({ links, onChange, errors }: Props) {
  const { width } = useWindowDimensions();
  const wide = width > WIDE_MIN_WIDTH;

  const update = (key: string, patch: Partial<ApplicationLinkDraft>) =>
    onChange(links.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <View style={formStyles.section}>
      <Text style={formStyles.label}>Application links (optional)</Text>
      <Text style={formStyles.hint}>
        Where dancers apply: a form, a video upload, a registration page… They show up as buttons on the
        audition, in this order, and the first one stands out. Only while the call is open. Not the Website
        URL above, which stays as the information page.
      </Text>

      {links.map((link, i) => (
        <View key={link.key} style={styles.block}>
          <View style={styles.blockHead}>
            <Text style={styles.blockTitle}>{i === 0 ? "Link 1 · main" : `Link ${i + 1}`}</Text>
            <View style={styles.actions}>
              {i > 0 && (
                <TextButton
                  label="↑ Up"
                  onPress={() => onChange(moveItem(links, i, -1))}
                  accessibilityLabel={`Move link ${i + 1} up`}
                />
              )}
              {i < links.length - 1 && (
                <TextButton
                  label="↓ Down"
                  onPress={() => onChange(moveItem(links, i, 1))}
                  accessibilityLabel={`Move link ${i + 1} down`}
                />
              )}
              <TextButton
                label="Remove"
                tone="danger"
                onPress={() => onChange(links.filter((l) => l.key !== link.key))}
                accessibilityLabel={`Remove link ${i + 1}`}
              />
            </View>
          </View>

          <View style={[styles.row, wide && styles.rowWide]}>
            <View style={[styles.cell, wide && styles.cellWide]}>
              <FormInput
                label="URL"
                value={link.url}
                onChangeText={(url) => update(link.key, { url })}
                maxLength={APPLICATION_LINK_URL_MAX_CHARS}
                error={errors[`${link.key}.url`]}
                placeholder="https://forms.company.com/apply"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={styles.cell}>
              <FormInput
                label="Button text (optional)"
                value={link.label}
                onChangeText={(label) => update(link.key, { label })}
                maxLength={APPLICATION_LINK_LABEL_MAX_CHARS}
                placeholder="Apply online"
                hint={link.label.trim() ? undefined : "Empty: “Apply”, or the site's name when there are several links."}
              />
            </View>
          </View>
          <View style={styles.chips}>
            {APPLICATION_LINK_LABEL_PRESETS.map((preset) => {
              const active = link.label.trim() === preset;
              return (
                <Chip
                  key={preset}
                  label={preset}
                  active={active}
                  onPress={() => update(link.key, { label: active ? "" : preset })}
                  accessibilityLabel={`Button text: ${preset}`}
                />
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.addRow}>
        <TextButton label="+ Add application link" onPress={() => onChange([...links, emptyApplicationLink()])} />
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
