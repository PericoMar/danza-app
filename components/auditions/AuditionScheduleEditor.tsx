// components/auditions/AuditionScheduleEditor.tsx
// Editor del calendario de una audición: deadlines y, dentro de cada una, sus
// fechas de audición. Los atajos ASAP / To be arranged solo rellenan labels.
import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { AUDITION_DATE_FORMAT_OPTIONS, AuditionDateFormat } from "@/types/audition";
import { AUDITION_DATE_MAX_DAYS, DATE_LABEL_PRESETS } from "@/constants/auditions";
import {
  DateDraft,
  DeadlineDraft,
  FormErrors,
  PlaceDefaults,
  applyAsap,
  applyToBeArranged,
  emptyDate,
  emptyDeadline,
  withFormat,
  withStartDate,
} from "@/utils/auditionForm";
import { Chip, FormInput, TextButton, formStyles } from "@/components/auditions/AuditionFormFields";

const LIMITS = { date: 10, label: 80, notes: 200, place: 120, country: 6 } as const;
const WIDE_MIN_WIDTH = 650;

type Props = {
  deadlines: DeadlineDraft[];
  onChange: (deadlines: DeadlineDraft[]) => void;
  errors: FormErrors;
  placeDefaults: PlaceDefaults;
};

export default function AuditionScheduleEditor({ deadlines, onChange, errors, placeDefaults }: Props) {
  const { width } = useWindowDimensions();
  const wide = width > WIDE_MIN_WIDTH;

  const updateDeadline = (key: string, update: (d: DeadlineDraft) => DeadlineDraft) =>
    onChange(deadlines.map((d) => (d.key === key ? update(d) : d)));
  const removeDeadline = (key: string) => onChange(deadlines.filter((d) => d.key !== key));

  return (
    <View style={formStyles.section}>
      <Text style={formStyles.label}>Deadlines and audition dates</Text>
      <Text style={formStyles.hint}>
        Each audition date belongs to one deadline. A label is shown instead of its date, but the date is
        still needed: it sets the status and the filters. Use an estimate when the real date isn't known.
      </Text>
      {!!errors.schedule && <Text style={formStyles.errorText}>{errors.schedule}</Text>}

      {deadlines.map((deadline, i) => (
        <DeadlineBlock
          key={deadline.key}
          index={i}
          deadline={deadline}
          canRemove={deadlines.length > 1}
          wide={wide}
          errors={errors}
          placeDefaults={placeDefaults}
          onChange={(update) => updateDeadline(deadline.key, update)}
          onRemove={() => removeDeadline(deadline.key)}
        />
      ))}

      <View style={styles.addRow}>
        <TextButton label="+ Add deadline" onPress={() => onChange([...deadlines, emptyDeadline(placeDefaults)])} />
      </View>
    </View>
  );
}

function DeadlineBlock({
  index,
  deadline,
  canRemove,
  wide,
  errors,
  placeDefaults,
  onChange,
  onRemove,
}: {
  index: number;
  deadline: DeadlineDraft;
  canRemove: boolean;
  wide: boolean;
  errors: FormErrors;
  placeDefaults: PlaceDefaults;
  onChange: (update: (d: DeadlineDraft) => DeadlineDraft) => void;
  onRemove: () => void;
}) {
  const k = deadline.key;
  const set = (patch: Partial<DeadlineDraft>) => onChange((d) => ({ ...d, ...patch }));
  const updateDate = (key: string, update: (x: DateDraft) => DateDraft) =>
    onChange((d) => ({ ...d, dates: d.dates.map((x) => (x.key === key ? update(x) : x)) }));
  const isAsap = deadline.date_label === DATE_LABEL_PRESETS.ASAP;

  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.blockTitle}>Deadline {index + 1}</Text>
        {canRemove && (
          <TextButton label="Remove deadline" tone="danger" onPress={onRemove} accessibilityLabel={`Remove deadline ${index + 1}`} />
        )}
      </View>

      <View style={[styles.row, wide && styles.rowWide]}>
        <View style={styles.cell}>
          <FormInput
            label="Deadline (YYYY-MM-DD)"
            value={deadline.date}
            onChangeText={(v) => set({ date: v })}
            maxLength={LIMITS.date}
            error={errors[`${k}.date`]}
            placeholder="2026-11-10"
          />
        </View>
        <View style={styles.cell}>
          <FormInput
            label="Label (optional, shown instead of the date)"
            value={deadline.date_label}
            onChangeText={(v) => set({ date_label: v })}
            maxLength={LIMITS.label}
            placeholder="ASAP"
          />
        </View>
      </View>
      <View style={styles.chips}>
        <Chip
          label="ASAP"
          active={isAsap}
          onPress={() => onChange((d) => (isAsap ? { ...d, date_label: "" } : applyAsap(d)))}
          accessibilityLabel="Mark deadline as ASAP: label ASAP, date of its first audition"
        />
      </View>
      <FormInput
        label="Notes (optional)"
        value={deadline.notes}
        onChangeText={(v) => set({ notes: v })}
        maxLength={LIMITS.notes}
        placeholder="Send CV and a video link"
      />

      {deadline.dates.map((date, j) => (
        <AuditionDateBlock
          key={date.key}
          index={j}
          date={date}
          canRemove={deadline.dates.length > 1}
          wide={wide}
          errors={errors}
          placeDefaults={placeDefaults}
          onChange={(update) => updateDate(date.key, update)}
          onRemove={() => onChange((d) => ({ ...d, dates: d.dates.filter((x) => x.key !== date.key) }))}
        />
      ))}
      {!!errors[`${k}.dates`] && <Text style={formStyles.errorText}>{errors[`${k}.dates`]}</Text>}

      <View style={styles.addRow}>
        <TextButton
          label="+ Add audition date"
          onPress={() => onChange((d) => ({ ...d, dates: [...d.dates, emptyDate(placeDefaults)] }))}
          accessibilityLabel={`Add audition date to deadline ${index + 1}`}
        />
      </View>
    </View>
  );
}

function AuditionDateBlock({
  index,
  date,
  canRemove,
  wide,
  errors,
  placeDefaults,
  onChange,
  onRemove,
}: {
  index: number;
  date: DateDraft;
  canRemove: boolean;
  wide: boolean;
  errors: FormErrors;
  placeDefaults: PlaceDefaults;
  onChange: (update: (x: DateDraft) => DateDraft) => void;
  onRemove: () => void;
}) {
  const k = date.key;
  const set = (patch: Partial<DateDraft>) => onChange((x) => ({ ...x, ...patch }));
  const inPerson = date.format === AuditionDateFormat.IN_PERSON;
  const isTba = date.date_label === DATE_LABEL_PRESETS.TO_BE_ARRANGED;

  return (
    <View style={styles.dateBlock}>
      <View style={styles.blockHead}>
        <Text style={styles.dateTitle}>Audition date {index + 1}</Text>
        {canRemove && (
          <TextButton label="Remove date" tone="danger" onPress={onRemove} accessibilityLabel={`Remove audition date ${index + 1}`} />
        )}
      </View>

      <View style={[styles.row, wide && styles.rowWide]}>
        <View style={styles.cell}>
          <FormInput
            label="Start (YYYY-MM-DD)"
            value={date.start_date}
            onChangeText={(v) => onChange((x) => withStartDate(x, v))}
            maxLength={LIMITS.date}
            error={errors[`${k}.start_date`]}
            placeholder="2026-11-20"
          />
        </View>
        <View style={styles.cell}>
          <FormInput
            label={`End (same as start for one day, up to ${AUDITION_DATE_MAX_DAYS} days)`}
            value={date.end_date}
            onChangeText={(v) => set({ end_date: v })}
            maxLength={LIMITS.date}
            error={errors[`${k}.end_date`]}
            placeholder="2026-11-21"
          />
        </View>
      </View>

      <View style={styles.chips}>
        {AUDITION_DATE_FORMAT_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={date.format === option.value}
            onPress={() => onChange((x) => withFormat(x, option.value, placeDefaults))}
          />
        ))}
      </View>

      {inPerson && (
        <View style={[styles.row, wide && styles.rowWide]}>
          <View style={[styles.cell, styles.cellWide]}>
            <FormInput
              label="Place (city, venue or address)"
              value={date.place}
              onChangeText={(v) => set({ place: v })}
              maxLength={LIMITS.place}
              placeholder="Leeds, UK"
              hint="Left empty, the company's address is used."
            />
          </View>
          <View style={styles.cell}>
            <FormInput
              label="Country (ISO code)"
              value={date.country_iso_code}
              onChangeText={(v) => set({ country_iso_code: v.toUpperCase() })}
              maxLength={LIMITS.country}
              error={errors[`${k}.country_iso_code`]}
              placeholder="GB-ENG"
              autoCapitalize="characters"
            />
          </View>
        </View>
      )}

      <View style={[styles.row, wide && styles.rowWide]}>
        <View style={styles.cell}>
          <FormInput
            label="Label (optional, shown instead of the dates)"
            value={date.date_label}
            onChangeText={(v) => set({ date_label: v })}
            maxLength={LIMITS.label}
            placeholder={DATE_LABEL_PRESETS.TO_BE_ARRANGED}
          />
        </View>
        <View style={styles.cell}>
          <FormInput
            label="Notes (optional, shown next to the dates)"
            value={date.notes}
            onChangeText={(v) => set({ notes: v })}
            maxLength={LIMITS.notes}
            placeholder="Men · 11:00–12:30"
          />
        </View>
      </View>
      <View style={styles.chips}>
        <Chip
          label="To be arranged"
          active={isTba}
          onPress={() => onChange((x) => (isTba ? { ...x, date_label: "" } : applyToBeArranged(x)))}
          accessibilityLabel="Mark audition date as to be arranged upon invitation"
        />
        {isTba && <Text style={formStyles.hint}>Keep an estimated date above.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10, marginTop: 12, gap: 4 },
  blockHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  blockTitle: { fontWeight: "700", fontSize: 15, color: "#111" },
  dateBlock: { borderLeftWidth: 3, borderLeftColor: "#e5e7eb", paddingLeft: 10, marginTop: 12, gap: 4 },
  dateTitle: { fontWeight: "700", fontSize: 13.5, color: "#374151" },
  row: { flexDirection: "column" },
  rowWide: { flexDirection: "row", gap: 12 },
  cell: { flex: 1, minWidth: 0 },
  cellWide: { flex: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 8 },
  addRow: { marginTop: 10 },
});
