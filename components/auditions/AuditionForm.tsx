// components/auditions/AuditionForm.tsx
import React, { memo, useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView,
  useWindowDimensions, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { upsertAudition, fetchAuditionWithHeights, replaceHeightRequirements } from "@/services/auditions";
import type { HeightReq } from "@/types/audition";

const FIELD_LIMITS = {
  summary: 160,
  email: 120,
  website_url: 160,
  location: 64,
} as const;

const DESCRIPTION_LIMIT = 3000;

const FIELD_LABELS: Record<keyof typeof FIELD_LIMITS, string> = {
  summary: "Summary",
  email: "Contact email",
  website_url: "Website URL",
  location: "Location",
};

type FormFields = {
  summary: string;
  email: string;
  website_url: string;
  location: string;
  description: string;
  audition_date: string;  // YYYY-MM-DD
  deadline_date: string;  // YYYY-MM-DD
};

const EMPTY: FormFields = {
  summary: "",
  email: "",
  website_url: "",
  location: "",
  description: "",
  audition_date: "",
  deadline_date: "",
};

type Props = {
  companyId: string;
  auditionId?: string; // si viene => edit
};

export default function AuditionForm({ companyId, auditionId }: Props) {
  const router = useRouter();
  const isEdit = !!auditionId;

  const { width } = useWindowDimensions();
  const columns = useMemo(() => (width > 1000 ? 3 : width > 650 ? 2 : 1), [width]);
  const fieldWidth = useMemo(() => (columns === 1 ? "100%" : columns === 2 ? "48%" : "31%"), [columns]);

  const [fields, setFields] = useState<FormFields>(EMPTY);
  const [initial, setInitial] = useState<FormFields>(EMPTY);

  // heights state (ligero)
  const [male, setMale] = useState<{ active: boolean; min?: string; max?: string }>({ active: false });
  const [female, setFemale] = useState<{ active: boolean; min?: string; max?: string }>({ active: false });
  const [other, setOther] = useState<{ active: boolean; min?: string; max?: string }>({ active: false });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<null | { type: "success" | "error"; message: string }>(null);

  // Load if edit
  useEffect(() => {
    if (!isEdit || !auditionId) return;
    (async () => {
      setLoadingFetch(true);
      setFeedback(null);
      try {
        const { audition, heights } = await fetchAuditionWithHeights(auditionId);
        if (!audition) {
          setFeedback({ type: "error", message: "Audition not found." });
          setLoadingFetch(false);
          return;
        }
        const f: FormFields = {
          summary: audition.summary ?? "",
          email: audition.email ?? "",
          website_url: audition.website_url ?? "",
          location: audition.location ?? "",
          description: audition.description ?? "",
          audition_date: audition.audition_date ?? "",
          deadline_date: audition.deadline_date ?? "",
        };

        setFields(f);
        setInitial(f);

        // map heights
        const g = (gender: "male" | "female" | "other") =>
          heights.find((h) => h.gender === gender);
        const m = g("male");
        const fe = g("female");
        const o = g("other");

        setMale({ active: !!m, min: m?.min_height_cm?.toString(), max: m?.max_height_cm?.toString() });
        setFemale({ active: !!fe, min: fe?.min_height_cm?.toString(), max: fe?.max_height_cm?.toString() });
        setOther({ active: !!o, min: o?.min_height_cm?.toString(), max: o?.max_height_cm?.toString() });
      } catch (e: any) {
        setFeedback({ type: "error", message: e.message ?? "Error loading audition." });
      } finally {
        setLoadingFetch(false);
      }
    })();
  }, [isEdit, auditionId]);

  function onChange<K extends keyof FormFields>(key: K, val: string) {
    const next = { ...fields, [key]: val };
    setFields(next);
  }

  function validate(v: FormFields = fields) {
    const e: Record<string, string> = {};
    if (v.summary.length > FIELD_LIMITS.summary) e.summary = `Max ${FIELD_LIMITS.summary} chars.`;
    if (v.email.length > FIELD_LIMITS.email) e.email = `Max ${FIELD_LIMITS.email} chars.`;
    if (v.website_url.length > FIELD_LIMITS.website_url) e.website_url = `Max ${FIELD_LIMITS.website_url} chars.`;
    if (v.location.length > FIELD_LIMITS.location) e.location = `Max ${FIELD_LIMITS.location} chars.`;

    // YYYY-MM-DD muy simple
    const dReg = /^\d{4}-\d{2}-\d{2}$/;
    if (v.audition_date && !dReg.test(v.audition_date)) e.audition_date = "Use YYYY-MM-DD";
    if (v.deadline_date && !dReg.test(v.deadline_date)) e.deadline_date = "Use YYYY-MM-DD";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const row = {
        ...(isEdit ? { id: auditionId } : {}),
        company_id: companyId,
        ...fields,
      };
      const saved = await upsertAudition(row);

      // preparar alturas
      const collect = (gender: "male" | "female" | "other", s: { active: boolean; min?: string; max?: string }): HeightReq | null => {
        if (!s.active) return null;
        const min = s.min ? Number(s.min) : null;
        const max = s.max ? Number(s.max) : null;
        if (min == null && max == null) return null;
        return { audition_id: saved.id, gender, min_height_cm: min, max_height_cm: max };
      };
      const list = [collect("male", male), collect("female", female), collect("other", other)].filter(Boolean) as HeightReq[];

      await replaceHeightRequirements(saved.id, list);

      setFeedback({ type: "success", message: isEdit ? "Audition updated!" : "Audition created!" });

      // Navega de vuelta al listado
      router.replace(`/companies/${companyId}/auditions`);
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message ?? "Unexpected error." });
    } finally {
      setSaving(false);
    }
  }

  if (loadingFetch) {
    return (
      <View style={[styles.wrapper, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading audition…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEdit ? "Edit Audition" : "Create Audition"}</Text>

      {feedback && (
        <Text style={feedback.type === "success" ? styles.success : styles.error}>
          {feedback.message}
        </Text>
      )}

      {/* Grid principal */}
      <View style={[styles.grid, { flexDirection: columns > 1 ? "row" : "column", flexWrap: "wrap" }]}>
        {(Object.keys(FIELD_LIMITS) as (keyof typeof FIELD_LIMITS)[]).map((key, i) => (
          <View
            key={key}
            style={[
              styles.gridItem,
              { width: fieldWidth, marginRight: columns > 1 && (i + 1) % columns !== 0 ? "2%" : 0 },
            ]}
          >
            <Input
              label={FIELD_LABELS[key]}
              value={fields[key]}
              onChangeText={(val) => onChange(key, val)}
              maxLength={FIELD_LIMITS[key]}
              error={errors[key]}
              placeholder={
                key === "summary" ? "Short audition headline…" :
                key === "email" ? "contact@company.com" :
                key === "website_url" ? "https://…" :
                key === "location" ? "City, Country" : ""
              }
            />
          </View>
        ))}
      </View>

      <Input
        label="Description"
        value={fields.description}
        onChangeText={(val) => onChange("description", val)}
        maxLength={DESCRIPTION_LIMIT}
        error={errors.description}
        placeholder="Describe the audition, requirements, working conditions, etc."
        multiline
        numberOfLines={6}
      />

      {/* Fechas */}
      <Input
        label="Audition date (YYYY-MM-DD)"
        value={fields.audition_date}
        onChangeText={(v) => onChange("audition_date", v)}
        maxLength={10}
        error={errors.audition_date}
        placeholder="2025-11-20"
      />
      <Input
        label="Deadline date (YYYY-MM-DD)"
        value={fields.deadline_date}
        onChangeText={(v) => onChange("deadline_date", v)}
        maxLength={10}
        error={errors.deadline_date}
        placeholder="2025-11-10"
      />

      {/* Height requirements */}
      <HeightEditor
        title="Height requirements"
        male={male}
        female={female}
        other={other}
        setMale={setMale}
        setFemale={setFemale}
        setOther={setOther}
        styles={styles}
      />

      <Pressable
        style={[styles.submitButton, (saving) && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={isEdit ? "Save audition changes" : "Create audition"}
      >
        {saving ? <ActivityIndicator color="#fff" /> : (
          <Text style={styles.submitButtonText}>{isEdit ? "Save Changes" : "Create Audition"}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function Input({
  label,
  value,
  onChangeText,
  maxLength,
  error,
  placeholder,
  multiline = false,
  numberOfLines,
}: {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  maxLength: number;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View style={styles.inputBox}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        accessibilityLabel={label}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
      />
      <View style={styles.inputBottomRow}>
        <Text style={styles.charCount}>
          {value.length}/{maxLength}
        </Text>
        {error ? (
          <Text style={styles.inputErrorText}>{error}</Text>
        ) : (
          <View />
        )}
      </View>
    </View>
  );
}


type RowState = { active: boolean; min?: string; max?: string };
type RowProps = {
  label: string;
  state: RowState;
  setState: (updater: (prev: RowState) => RowState) => void;
  styles: any;
};

const HeightRow = memo(function HeightRow({ label, state, setState, styles }: RowProps) {
  // Estado local para escribir sin perder el foco
  const [minLocal, setMinLocal] = useState(state.min ?? "");
  const [maxLocal, setMaxLocal] = useState(state.max ?? "");

  // Sincroniza local cuando cambian props (p.ej. al cargar datos)
  useEffect(() => {
    setMinLocal(state.min ?? "");
    setMaxLocal(state.max ?? "");
  }, [state.min, state.max]);

  const commitMin = () =>
    setState(prev => ({ ...prev, min: minLocal }));
  const commitMax = () =>
    setState(prev => ({ ...prev, max: maxLocal }));

  return (
    <View style={styles.heightRow}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: state.active }}
          onPress={() => setState(prev => ({ ...prev, active: !prev.active }))}
          style={[styles.checkbox, state.active && styles.checkboxActive]}
        >
          {state.active ? <Text style={{ color: "#fff" }}>✓</Text> : null}
        </Pressable>
        <Text style={{ fontWeight: "600" }}>{label}</Text>
      </View>

      {state.active && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <TextInput
            keyboardType="numeric"
            style={[styles.input, { flex: 1 }]}
            placeholder="Min (cm)"
            value={minLocal}
            onChangeText={setMinLocal}
            onBlur={commitMin}           // ← commit al perder foco
            onEndEditing={commitMin}     // ← fallback móvil
          />
          <TextInput
            keyboardType="numeric"
            style={[styles.input, { flex: 1 }]}
            placeholder="Max (cm)"
            value={maxLocal}
            onChangeText={setMaxLocal}
            onBlur={commitMax}
            onEndEditing={commitMax}
          />
        </View>
      )}
    </View>
  );
});

function HeightEditor({
  title, male, female, other, setMale, setFemale, setOther, styles,
}: {
  title: string;
  male: RowState;
  female: RowState;
  other: RowState;
  setMale: React.Dispatch<React.SetStateAction<RowState>>;
  setFemale: React.Dispatch<React.SetStateAction<RowState>>;
  setOther: React.Dispatch<React.SetStateAction<RowState>>;
  styles: any; // reutiliza tus estilos existentes
}) {
  return (
    <View style={styles.inputBox}>
      <Text style={styles.label}>{title}</Text>

      <HeightRow label="Male (♂)"   state={male}   setState={setMale}   styles={styles} />
      <HeightRow label="Female (♀)" state={female} setState={setFemale} styles={styles} />
      <HeightRow label="Other (∀)"  state={other}  setState={setOther}  styles={styles} />

      <Text style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
        Specific rules override “Other”. Leave fields empty to ignore.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fafbfc", width: "100%" },
  content: { padding: 22, maxWidth: 1100, alignSelf: "center", gap: 14, width: "100%" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8, color: "#23272f", letterSpacing: -1, alignSelf: "center" },
  grid: { width: "100%", justifyContent: "flex-start", alignItems: "flex-start", gap: 0 },
  gridItem: { marginBottom: 12, minWidth: 160 },
  inputBox: {
    marginBottom: 0, backgroundColor: "#fff", borderRadius: 11, padding: 10,
    shadowColor: "#aaa", shadowOpacity: 0.07, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    borderWidth: 1, borderColor: "#ececec", width: "100%",
  },
  label: { fontWeight: "600", marginBottom: 4, fontSize: 14, color: "#111" },
  input: { borderWidth: 1, borderColor: "#e1e4e8", borderRadius: 7, padding: 10, backgroundColor: "#f6f8fa", fontSize: 15, color: "#222", fontWeight: "500" },
  inputMultiline: {
    minHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputError: { borderColor: "#d32f2f" },
  inputBottomRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  charCount: { fontSize: 11, color: "#999" },
  inputErrorText: { color: "#d32f2f", fontSize: 12, marginLeft: 8, fontWeight: "600" },
  submitButton: {
    backgroundColor: "#000000ff", borderRadius: 9, paddingVertical: 13, marginTop: 16, alignItems: "center",
    shadowColor: "#111", shadowOpacity: 0.13, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  submitButtonText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  error: { color: "#d32f2f", fontWeight: "600", marginBottom: 10, textAlign: "center" },
  success: { color: "#32c671", fontWeight: "600", marginBottom: 10, textAlign: "center" },
  heightRow: { marginTop: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: "#bbb", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  checkboxActive: { backgroundColor: "#111", borderColor: "#111" },
});
