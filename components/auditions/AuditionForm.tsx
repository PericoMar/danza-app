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
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import SiteHeader from "@/components/common/SiteHeader";
import ParticipatingCompaniesSelector from "@/components/auditions/ParticipatingCompaniesSelector";
import AuditionScheduleEditor from "@/components/auditions/AuditionScheduleEditor";
import ApplicationLinksEditor from "@/components/auditions/ApplicationLinksEditor";
import AuditionEmailsEditor from "@/components/auditions/AuditionEmailsEditor";
import RichTextField from "@/components/auditions/RichTextField";
import { Checkbox, FormInput, formStyles } from "@/components/auditions/AuditionFormFields";
import { AUDITION_TEXT_LIMITS, useAuditionForm } from "@/hooks/useAuditionForm";
import {
  AgeRangeDraft,
  FormErrors,
  GENDER_LABELS,
  HeightDraft,
  HeightDrafts,
  todayIsoDate,
} from "@/utils/auditionForm";
import type { AuditionGender } from "@/types/audition";

// Campos cortos de la cabecera, en rejilla.
const HEADER_FIELDS = [
  { key: "summary", label: "Summary", placeholder: "Short audition headline…" },
  { key: "website_url", label: "Website URL (info page)", placeholder: "https://…" },
] as const;

const GENDER_SYMBOLS: Record<AuditionGender, string> = { male: "♂", female: "♀", other: "∀" };

// Años enteros: tres cifras sobran.
const AGE_INPUT_MAX_LENGTH = 3;

type Props = {
  companyId: string;
  auditionId?: string; // si viene => edit
};

export default function AuditionForm({ companyId, auditionId }: Props) {
  const router = useRouter();
  const form = useAuditionForm(companyId, auditionId);
  const { isEdit, text, errors, feedback } = form;

  const { width } = useWindowDimensions();
  const columns = useMemo(
    () => Math.min(HEADER_FIELDS.length, width > 1000 ? 3 : width > 650 ? 2 : 1),
    [width]
  );
  const fieldWidth = columns === 1 ? "100%" : columns === 2 ? "48%" : "31%";

  async function handleSave() {
    if (await form.save()) router.replace(`/companies/${companyId}/auditions`);
  }

  if (form.loading) {
    return (
      <>
        <SiteHeader />
        <View style={[styles.wrapper, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Loading audition…</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{isEdit ? "Edit Audition" : "Create Audition"}</Text>

        <View style={[styles.grid, { flexDirection: columns > 1 ? "row" : "column", flexWrap: "wrap" }]}>
          {HEADER_FIELDS.map((field, i) => (
            <View
              key={field.key}
              style={[
                styles.gridItem,
                { width: fieldWidth, marginRight: columns > 1 && (i + 1) % columns !== 0 ? "2%" : 0 },
              ]}
            >
              <View style={formStyles.section}>
                <FormInput
                  label={field.label}
                  value={text[field.key]}
                  onChangeText={(val) => form.setTextField(field.key, val)}
                  maxLength={AUDITION_TEXT_LIMITS[field.key]}
                  error={errors[field.key]}
                  placeholder={field.placeholder}
                />
              </View>
            </View>
          ))}
        </View>

        <ApplicationLinksEditor
          links={form.applicationLinks}
          onChange={form.setApplicationLinks}
          errors={errors}
        />

        <AuditionEmailsEditor emails={form.emails} onChange={form.setEmails} errors={errors} />

        <View style={formStyles.section}>
          <RichTextField
            label="Description"
            value={text.description}
            onChangeText={(val) => form.setTextField("description", val)}
            maxLength={AUDITION_TEXT_LIMITS.description}
            error={errors.description}
            placeholder="Describe the audition, requirements, working conditions, etc."
          />
        </View>

        <AuditionScheduleEditor
          deadlines={form.deadlines}
          onChange={form.setDeadlines}
          errors={errors}
          placeDefaults={form.placeDefaults}
          hasScheduleLabel={!!text.schedule_label.trim()}
        />

        <View style={formStyles.section}>
          <FormInput
            label="Schedule label (optional)"
            value={text.schedule_label}
            onChangeText={(val) => form.setTextField("schedule_label", val)}
            maxLength={AUDITION_TEXT_LIMITS.schedule_label}
            error={errors.schedule_label}
            placeholder="7 cities · Oct 2026 – Feb 2027"
            hint="Replaces the whole Deadline · Audition line on the listing card, so keep it short. The audition page shows it above the dates."
          />
        </View>

        <HeightEditor heights={form.heights} setHeights={form.setHeights} />

        <AgeRangeEditor ageRange={form.ageRange} setAgeRange={form.setAgeRange} errors={errors} />

        {/* Compañías participantes (solo para compañías de tipo 'events') */}
        {form.isEventsCompany && (
          <View style={formStyles.section}>
            <Text style={formStyles.label}>Participating companies</Text>
            <Text style={[formStyles.hint, { marginBottom: 10 }]}>
              This audition is organized by an events company. Search and add the companies that
              participate in it.
            </Text>
            <ParticipatingCompaniesSelector
              value={form.participatingCompanies}
              onChange={form.setParticipatingCompanies}
              excludeCompanyId={companyId}
            />
          </View>
        )}

        {/* Activa / inactiva (manual) */}
        <View style={formStyles.section}>
          <Checkbox checked={form.isActive} onToggle={() => form.setIsActive(!form.isActive)} label="Active" />
          <Text style={formStyles.hint}>
            Active auditions are shown on the company page. Uncheck it to hide this audition from dancers
            without deleting it (e.g. an always-open call that has stopped).
          </Text>
        </View>

        {/* Última actualización de la información (manual) */}
        <View style={formStyles.section}>
          <Checkbox
            checked={form.markContentUpdate}
            onToggle={() => form.setMarkContentUpdate(!form.markContentUpdate)}
            label="Log this as an information update"
          />
          <Text style={formStyles.hint}>
            Keep this checked when you change information that matters to dancers — it sets the “last
            updated” date shown on the audition. Uncheck it for internal fixes that shouldn’t move that date.
          </Text>
          {form.markContentUpdate && (
            <View style={{ marginTop: 12 }}>
              <FormInput
                label="Last updated date (YYYY-MM-DD)"
                value={form.contentUpdatedDate}
                onChangeText={form.setContentUpdatedDate}
                maxLength={10}
                error={errors.content_updated_at}
                placeholder={todayIsoDate()}
              />
            </View>
          )}
        </View>

        {/* El mensaje va junto al botón: es donde mira quien acaba de pulsar guardar */}
        <View style={styles.footer}>
          {feedback && (
            <Text style={feedback.type === "success" ? styles.success : styles.error}>{feedback.message}</Text>
          )}

          <Pressable
            style={[styles.submitButton, form.saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={form.saving}
            accessibilityRole="button"
            accessibilityLabel={isEdit ? "Save audition changes" : "Create audition"}
          >
            {form.saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{isEdit ? "Save Changes" : "Create Audition"}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const HeightRow = memo(function HeightRow({
  gender,
  state,
  onChange,
}: {
  gender: AuditionGender;
  state: HeightDraft;
  onChange: (update: (prev: HeightDraft) => HeightDraft) => void;
}) {
  const [minLocal, setMinLocal] = useState(state.min ?? "");
  const [maxLocal, setMaxLocal] = useState(state.max ?? "");

  useEffect(() => {
    setMinLocal(state.min ?? "");
    setMaxLocal(state.max ?? "");
  }, [state.min, state.max]);

  const commitMin = () => onChange((prev) => ({ ...prev, min: minLocal }));
  const commitMax = () => onChange((prev) => ({ ...prev, max: maxLocal }));

  return (
    <View style={styles.heightRow}>
      <Checkbox
        checked={state.active}
        onToggle={() => onChange((prev) => ({ ...prev, active: !prev.active }))}
        label={`${GENDER_LABELS[gender]} (${GENDER_SYMBOLS[gender]})`}
      />

      {state.active && (
        <>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TextInput
              keyboardType="numeric"
              style={[formStyles.input, { flex: 1 }]}
              placeholder="Min (cm)"
              value={minLocal}
              onChangeText={setMinLocal}
              onBlur={commitMin}
              onEndEditing={commitMin}
            />
            <TextInput
              keyboardType="numeric"
              style={[formStyles.input, { flex: 1 }]}
              placeholder="Max (cm)"
              value={maxLocal}
              onChangeText={setMaxLocal}
              onBlur={commitMax}
              onEndEditing={commitMax}
            />
          </View>
          {!minLocal.trim() && !maxLocal.trim() ? (
            <Text style={formStyles.hint}>
              No height limit — this audition is open to this gender with no minimum or maximum height.
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
});

function HeightEditor({
  heights,
  setHeights,
}: {
  heights: HeightDrafts;
  setHeights: React.Dispatch<React.SetStateAction<HeightDrafts>>;
}) {
  return (
    <View style={formStyles.section}>
      <Text style={formStyles.label}>Height requirements</Text>

      {(Object.keys(heights) as AuditionGender[]).map((gender) => (
        <HeightRow
          key={gender}
          gender={gender}
          state={heights[gender]}
          onChange={(update) => setHeights((prev) => ({ ...prev, [gender]: update(prev[gender]) }))}
        />
      ))}

      <Text style={formStyles.hint}>
        Tick a gender to restrict the audition to it. Leave its height fields empty to accept that gender
        at any height (e.g. tick only “Male” for a men-only call). Untick every gender to open the audition
        to everyone.
      </Text>
    </View>
  );
}

function AgeRangeEditor({
  ageRange,
  setAgeRange,
  errors,
}: {
  ageRange: AgeRangeDraft;
  setAgeRange: React.Dispatch<React.SetStateAction<AgeRangeDraft>>;
  errors: FormErrors;
}) {
  const error = errors.min_age ?? errors.max_age;
  return (
    <View style={formStyles.section}>
      <Text style={formStyles.label}>Age range (optional)</Text>
      <View style={styles.ageRow}>
        <TextInput
          keyboardType="number-pad"
          maxLength={AGE_INPUT_MAX_LENGTH}
          style={[formStyles.input, styles.ageInput, !!errors.min_age && formStyles.inputError]}
          placeholder="Min age"
          placeholderTextColor="#6b7280"
          accessibilityLabel="Minimum age"
          value={ageRange.min}
          onChangeText={(min) => setAgeRange((prev) => ({ ...prev, min }))}
        />
        <TextInput
          keyboardType="number-pad"
          maxLength={AGE_INPUT_MAX_LENGTH}
          style={[formStyles.input, styles.ageInput, !!errors.max_age && formStyles.inputError]}
          placeholder="Max age"
          placeholderTextColor="#6b7280"
          accessibilityLabel="Maximum age"
          value={ageRange.max}
          onChangeText={(max) => setAgeRange((prev) => ({ ...prev, max }))}
        />
      </View>
      {!!error && <Text style={formStyles.errorText}>{error}</Text>}
      <Text style={formStyles.hint}>
        Whole years, both included. Fill only the minimum for “18+” or only the maximum for “up to 25”.
        Leave both empty if there is no age limit. Listing cards flag auditions that have one.
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
  footer: { marginTop: 16, gap: 10 },
  submitButton: {
    backgroundColor: "#000000ff", borderRadius: 9, paddingVertical: 13, alignItems: "center",
    shadowColor: "#111", shadowOpacity: 0.13, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  submitButtonText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  error: { color: "#d32f2f", fontWeight: "600", textAlign: "center" },
  success: { color: "#32c671", fontWeight: "600", textAlign: "center" },
  heightRow: { marginTop: 8 },
  ageRow: { flexDirection: "row", gap: 8 },
  ageInput: { flex: 1 },
});
