// components/auditions/AuditionForm.tsx
import React, { memo, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import {
  upsertAudition,
  fetchAuditionWithHeights,
  replaceHeightRequirements,
} from "@/services/auditions";
import type {
  HeightReq,
  DeadlineMode,
  AuditionScheduleMode,
  AuditionScheduleEntry,
} from "@/types/audition";

const FIELD_LIMITS = {
  summary: 160,
  email: 120,
  website_url: 160,
  location: 64,
} as const;

const DESCRIPTION_LIMIT = 3000;
const TO_BE_ARRANGED_NOTE_LIMIT = 200;

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

  // Deadline
  deadline_mode: DeadlineMode;
  deadline_date: string; // YYYY-MM-DD (solo si fixed_date)

  // Audition schedule
  audition_schedule_mode: AuditionScheduleMode;
  audition_date: string; // YYYY-MM-DD (solo si single_date)
  audition_schedule_note: string; // texto libre para to_be_arranged
  audition_schedule_entries: AuditionScheduleEntry[]; // varias fechas
};

const EMPTY: FormFields = {
  summary: "",
  email: "",
  website_url: "",
  location: "",
  description: "",
  deadline_mode: "fixed_date",
  deadline_date: "",
  audition_schedule_mode: "single_date",
  audition_date: "",
  audition_schedule_note: "",
  audition_schedule_entries: [],
};

type Props = {
  companyId: string;
  auditionId?: string; // si viene => edit
};

export default function AuditionForm({ companyId, auditionId }: Props) {
  const router = useRouter();
  const isEdit = !!auditionId;

  const { width } = useWindowDimensions();
  const columns = useMemo(
    () => (width > 1000 ? 3 : width > 650 ? 2 : 1),
    [width]
  );
  const fieldWidth = useMemo(
    () => (columns === 1 ? "100%" : columns === 2 ? "48%" : "31%"),
    [columns]
  );

  const [fields, setFields] = useState<FormFields>(EMPTY);
  const [initial, setInitial] = useState<FormFields>(EMPTY);

  // heights state (ligero)
  const [male, setMale] = useState<{ active: boolean; min?: string; max?: string }>({
    active: false,
  });
  const [female, setFemale] = useState<{ active: boolean; min?: string; max?: string }>({
    active: false,
  });
  const [other, setOther] = useState<{ active: boolean; min?: string; max?: string }>({
    active: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] =
    useState<null | { type: "success" | "error"; message: string }>(null);

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
          deadline_mode: audition.deadline_mode ?? "fixed_date",
          deadline_date: audition.deadline_date ?? "",
          audition_schedule_mode: audition.audition_schedule_mode ?? "single_date",
          audition_date: audition.audition_date ?? "",
          audition_schedule_note: audition.audition_schedule_note ?? "",
          audition_schedule_entries: audition.audition_schedule_entries ?? [],
        };

        setFields(f);
        setInitial(f);

        // map heights
        const g = (gender: "male" | "female" | "other") =>
          heights.find((h) => h.gender === gender);
        const m = g("male");
        const fe = g("female");
        const o = g("other");

        setMale({
          active: !!m,
          min: m?.min_height_cm?.toString(),
          max: m?.max_height_cm?.toString(),
        });
        setFemale({
          active: !!fe,
          min: fe?.min_height_cm?.toString(),
          max: fe?.max_height_cm?.toString(),
        });
        setOther({
          active: !!o,
          min: o?.min_height_cm?.toString(),
          max: o?.max_height_cm?.toString(),
        });
      } catch (e: any) {
        setFeedback({
          type: "error",
          message: e.message ?? "Error loading audition.",
        });
      } finally {
        setLoadingFetch(false);
      }
    })();
  }, [isEdit, auditionId]);

  function onChange<K extends keyof FormFields>(key: K, val: FormFields[K]) {
    const next = { ...fields, [key]: val };
    setFields(next);
  }

  function setDeadlineMode(mode: DeadlineMode) {
    setFields((prev) => ({
      ...prev,
      deadline_mode: mode,
      // si no es fixed_date, limpiamos fecha para evitar datos confusos
      deadline_date: mode === "fixed_date" ? prev.deadline_date : "",
    }));
  }

  function setScheduleMode(mode: AuditionScheduleMode) {
    setFields((prev) => ({
      ...prev,
      audition_schedule_mode: mode,
      // limpiar campos que no tocan según modo
      audition_date: mode === "single_date" ? prev.audition_date : "",
      audition_schedule_note: mode === "to_be_arranged" ? prev.audition_schedule_note : "",
      audition_schedule_entries:
        mode === "various_dates" ? prev.audition_schedule_entries : [],
    }));
  }

  function addScheduleEntry() {
    setFields((prev) => ({
      ...prev,
      audition_schedule_entries: [
        ...prev.audition_schedule_entries,
        { date: "", label: "", extra_info: "" },
      ],
    }));
  }

  function updateScheduleEntry(
    index: number,
    patch: Partial<AuditionScheduleEntry>
  ) {
    setFields((prev) => {
      const nextEntries = [...prev.audition_schedule_entries];
      const current = nextEntries[index] ?? { date: "" };
      nextEntries[index] = { ...current, ...patch };
      return { ...prev, audition_schedule_entries: nextEntries };
    });
  }

  function removeScheduleEntry(index: number) {
    setFields((prev) => {
      const nextEntries = prev.audition_schedule_entries.filter(
        (_e, i) => i !== index
      );
      return { ...prev, audition_schedule_entries: nextEntries };
    });
  }

  function validate(v: FormFields = fields) {
    const e: Record<string, string> = {};

    // límites de texto
    if (v.summary.length > FIELD_LIMITS.summary)
      e.summary = `Max ${FIELD_LIMITS.summary} chars.`;
    if (v.email.length > FIELD_LIMITS.email)
      e.email = `Max ${FIELD_LIMITS.email} chars.`;
    if (v.website_url.length > FIELD_LIMITS.website_url)
      e.website_url = `Max ${FIELD_LIMITS.website_url} chars.`;
    if (v.location.length > FIELD_LIMITS.location)
      e.location = `Max ${FIELD_LIMITS.location} chars.`;
    if (v.description.length > DESCRIPTION_LIMIT)
      e.description = `Max ${DESCRIPTION_LIMIT} chars.`;
    if (v.audition_schedule_note.length > TO_BE_ARRANGED_NOTE_LIMIT)
      e.audition_schedule_note = `Max ${TO_BE_ARRANGED_NOTE_LIMIT} chars.`;

    const dReg = /^\d{4}-\d{2}-\d{2}$/;

    // Deadline
    if (v.deadline_mode === "fixed_date") {
      if (!v.deadline_date) {
        e.deadline_date = "Deadline date is required for fixed deadline.";
      } else if (!dReg.test(v.deadline_date)) {
        e.deadline_date = "Use YYYY-MM-DD";
      }
    }

    // Audition schedule
    if (v.audition_schedule_mode === "single_date") {
      if (!v.audition_date) {
        e.audition_date = "Audition date is required.";
      } else if (!dReg.test(v.audition_date)) {
        e.audition_date = "Use YYYY-MM-DD";
      }
    }

    if (v.audition_schedule_mode === "to_be_arranged") {
      if (!v.audition_schedule_note.trim()) {
        e.audition_schedule_note =
          "Please provide a short message for the audition schedule.";
      }
    }

    if (v.audition_schedule_mode === "various_dates") {
      if (!v.audition_schedule_entries.length) {
        e.audition_schedule_entries =
          "Add at least one audition date entry.";
      } else {
        const invalid = v.audition_schedule_entries.some(
          (entry) => !entry.date || !dReg.test(entry.date)
        );
        if (invalid) {
          e.audition_schedule_entries =
            "Each entry must have a valid date (YYYY-MM-DD).";
        }
      }
    }

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
        summary: fields.summary || null,
        email: fields.email || null,
        website_url: fields.website_url || null,
        location: fields.location || null,
        description: fields.description || null,
        deadline_mode: fields.deadline_mode,
        deadline_date: fields.deadline_date || null,
        audition_schedule_mode: fields.audition_schedule_mode,
        audition_date:
          fields.audition_schedule_mode === "single_date"
            ? fields.audition_date || null
            : null,
        audition_schedule_note:
          fields.audition_schedule_mode === "to_be_arranged"
            ? fields.audition_schedule_note || null
            : null,
        audition_schedule_entries:
          fields.audition_schedule_mode === "various_dates"
            ? fields.audition_schedule_entries
            : [],
      };

      const saved = await upsertAudition(row);

      // preparar alturas
      const collect = (
        gender: "male" | "female" | "other",
        s: { active: boolean; min?: string; max?: string }
      ): HeightReq | null => {
        if (!s.active) return null;
        const min = s.min ? Number(s.min) : null;
        const max = s.max ? Number(s.max) : null;
        if (min == null && max == null) return null;
        return { audition_id: saved.id, gender, min_height_cm: min, max_height_cm: max };
      };
      const list = [
        collect("male", male),
        collect("female", female),
        collect("other", other),
      ].filter(Boolean) as HeightReq[];

      await replaceHeightRequirements(saved.id, list);

      setFeedback({
        type: "success",
        message: isEdit ? "Audition updated!" : "Audition created!",
      });

      router.replace(`/companies/${companyId}/auditions`);
    } catch (e: any) {
      setFeedback({
        type: "error",
        message: e.message ?? "Unexpected error.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loadingFetch) {
    return (
      <View
        style={[
          styles.wrapper,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading audition…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {isEdit ? "Edit Audition" : "Create Audition"}
      </Text>

      {feedback && (
        <Text
          style={feedback.type === "success" ? styles.success : styles.error}
        >
          {feedback.message}
        </Text>
      )}

      {/* Grid principal (summary, email, url, location) */}
      <View
        style={[
          styles.grid,
          { flexDirection: columns > 1 ? "row" : "column", flexWrap: "wrap" },
        ]}
      >
        {(Object.keys(FIELD_LIMITS) as (keyof typeof FIELD_LIMITS)[]).map(
          (key, i) => (
            <View
              key={key}
              style={[
                styles.gridItem,
                {
                  width: fieldWidth,
                  marginRight:
                    columns > 1 && (i + 1) % columns !== 0 ? "2%" : 0,
                },
              ]}
            >
              <Input
                label={FIELD_LABELS[key]}
                value={fields[key]}
                onChangeText={(val) => onChange(key, val)}
                maxLength={FIELD_LIMITS[key]}
                error={errors[key]}
                placeholder={
                  key === "summary"
                    ? "Short audition headline…"
                    : key === "email"
                    ? "contact@company.com"
                    : key === "website_url"
                    ? "https://…"
                    : key === "location"
                    ? "City, Country"
                    : ""
                }
              />
            </View>
          )
        )}
      </View>

      {/* Description */}
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

      {/* Deadline */}
      <View style={styles.inputBox}>
        <Text style={styles.label}>Application deadline</Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
          }}
        >
          <ModeChip
            label="Fixed date"
            active={fields.deadline_mode === "fixed_date"}
            onPress={() => setDeadlineMode("fixed_date")}
          />
          <ModeChip
            label="ASAP"
            active={fields.deadline_mode === "asap"}
            onPress={() => setDeadlineMode("asap")}
          />
          <ModeChip
            label="Always open"
            active={fields.deadline_mode === "always_open"}
            onPress={() => setDeadlineMode("always_open")}
          />
        </View>

        {fields.deadline_mode === "fixed_date" && (
          <View style={{ marginTop: 12 }}>
            <Input
              label="Deadline date (YYYY-MM-DD)"
              value={fields.deadline_date}
              onChangeText={(v) => onChange("deadline_date", v)}
              maxLength={10}
              error={errors.deadline_date}
              placeholder="2025-11-10"
            />
          </View>
        )}
      </View>

      {/* Audition schedule */}
      <View style={styles.inputBox}>
        <Text style={styles.label}>Audition date / schedule</Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
          }}
        >
          <ModeChip
            label="Single date"
            active={fields.audition_schedule_mode === "single_date"}
            onPress={() => setScheduleMode("single_date")}
          />
          <ModeChip
            label="To be arranged"
            active={fields.audition_schedule_mode === "to_be_arranged"}
            onPress={() => setScheduleMode("to_be_arranged")}
          />
          <ModeChip
            label="Various dates"
            active={fields.audition_schedule_mode === "various_dates"}
            onPress={() => setScheduleMode("various_dates")}
          />
        </View>

        {fields.audition_schedule_mode === "single_date" && (
          <View style={{ marginTop: 12 }}>
            <Input
              label="Audition date (YYYY-MM-DD)"
              value={fields.audition_date}
              onChangeText={(v) => onChange("audition_date", v)}
              maxLength={10}
              error={errors.audition_date}
              placeholder="2025-11-20"
            />
          </View>
        )}

        {fields.audition_schedule_mode === "to_be_arranged" && (
          <View style={{ marginTop: 12 }}>
            <Input
              label="Custom message (shown to dancers)"
              value={fields.audition_schedule_note}
              onChangeText={(v) => onChange("audition_schedule_note", v)}
              maxLength={TO_BE_ARRANGED_NOTE_LIMIT}
              error={errors.audition_schedule_note}
              placeholder="e.g. Dates to be arranged directly with the company."
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {fields.audition_schedule_mode === "various_dates" && (
          <View style={{ marginTop: 12 }}>
            {fields.audition_schedule_entries.map((entry, index) => (
              <View
                key={index}
                style={{ marginBottom: 12, borderRadius: 8, padding: 8 }}
              >
                <Text style={{ fontWeight: "600", marginBottom: 4 }}>
                  Date {index + 1}
                </Text>
                <TextInput
                  style={[styles.input, { marginBottom: 6 }]}
                  placeholder="Date (YYYY-MM-DD)"
                  value={entry.date}
                  onChangeText={(val) =>
                    updateScheduleEntry(index, { date: val })
                  }
                  maxLength={10}
                />
                <TextInput
                  style={[styles.input, { marginBottom: 6 }]}
                  placeholder="Label (optional)"
                  value={entry.label ?? ""}
                  onChangeText={(val) =>
                    updateScheduleEntry(index, { label: val })
                  }
                  maxLength={120}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Extra info (optional)"
                  value={entry.extra_info ?? ""}
                  onChangeText={(val) =>
                    updateScheduleEntry(index, { extra_info: val })
                  }
                  maxLength={200}
                />
                <Pressable
                  onPress={() => removeScheduleEntry(index)}
                  style={{ marginTop: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove audition date ${index + 1}`}
                >
                  <Text style={{ color: "#b91c1c", fontSize: 13 }}>
                    Remove date
                  </Text>
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={addScheduleEntry}
              style={{ marginTop: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Add audition date"
            >
              <Text style={{ color: "#2563eb", fontWeight: "600" }}>
                + Add audition date
              </Text>
            </Pressable>

            {errors.audition_schedule_entries ? (
              <Text style={styles.inputErrorText}>
                {errors.audition_schedule_entries}
              </Text>
            ) : null}
          </View>
        )}
      </View>

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
        style={[styles.submitButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={isEdit ? "Save audition changes" : "Create audition"}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEdit ? "Save Changes" : "Create Audition"}
          </Text>
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
        {error ? <Text style={styles.inputErrorText}>{error}</Text> : <View />}
      </View>
    </View>
  );
}

function ModeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? "#111827" : "#9ca3af",
        backgroundColor: active ? "#111827" : "transparent",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: active ? "#ffffff" : "#111827",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type RowState = { active: boolean; min?: string; max?: string };
type RowProps = {
  label: string;
  state: RowState;
  setState: (updater: (prev: RowState) => RowState) => void;
  styles: any;
};

const HeightRow = memo(function HeightRow({
  label,
  state,
  setState,
  styles,
}: RowProps) {
  const [minLocal, setMinLocal] = useState(state.min ?? "");
  const [maxLocal, setMaxLocal] = useState(state.max ?? "");

  useEffect(() => {
    setMinLocal(state.min ?? "");
    setMaxLocal(state.max ?? "");
  }, [state.min, state.max]);

  const commitMin = () => setState((prev) => ({ ...prev, min: minLocal }));
  const commitMax = () => setState((prev) => ({ ...prev, max: maxLocal }));

  return (
    <View style={styles.heightRow}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: state.active }}
          onPress={() =>
            setState((prev) => ({ ...prev, active: !prev.active }))
          }
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
            onBlur={commitMin}
            onEndEditing={commitMin}
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
  title,
  male,
  female,
  other,
  setMale,
  setFemale,
  setOther,
  styles,
}: {
  title: string;
  male: RowState;
  female: RowState;
  other: RowState;
  setMale: React.Dispatch<React.SetStateAction<RowState>>;
  setFemale: React.Dispatch<React.SetStateAction<RowState>>;
  setOther: React.Dispatch<React.SetStateAction<RowState>>;
  styles: any;
}) {
  return (
    <View style={styles.inputBox}>
      <Text style={styles.label}>{title}</Text>

      <HeightRow label="Male (♂)" state={male} setState={setMale} styles={styles} />
      <HeightRow
        label="Female (♀)"
        state={female}
        setState={setFemale}
        styles={styles}
      />
      <HeightRow
        label="Other (∀)"
        state={other}
        setState={setOther}
        styles={styles}
      />

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
