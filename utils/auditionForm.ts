// utils/auditionForm.ts
// Lógica pura del formulario de audición: borradores del calendario
// (deadlines -> fechas), atajos, validación y payload de `save_audition`.
// Las reglas de validación replican las de la BD para avisar antes de guardar.

import {
  AUDITION_DATE_MAX_DAYS,
  COUNTRY_ISO_CODE_PATTERN,
  DATE_LABEL_PRESETS,
  ISO_DATE_PATTERN,
} from "@/constants/auditions";
import {
  Audition,
  AuditionDateFormat,
  AuditionGender,
  AuditionHeightRequirement,
  SaveAuditionPayload,
} from "@/types/audition";

export type DateDraft = {
  key: string; // estable para las listas de React; no se guarda
  id?: string;
  start_date: string;
  end_date: string;
  format: AuditionDateFormat;
  place: string;
  country_iso_code: string;
  date_label: string;
  notes: string;
};

export type DeadlineDraft = {
  key: string;
  id?: string;
  date: string;
  date_label: string;
  notes: string;
  dates: DateDraft[];
};

/** Lugar y país de la compañía: valores por defecto de una fecha presencial. */
export type PlaceDefaults = { place: string; country_iso_code: string };

/** Errores por campo: `${draft.key}.${campo}`, o `schedule` para el calendario entero. */
export type FormErrors = Record<string, string>;

let draftSeq = 0;
const newKey = () => `draft-${++draftSeq}`;

export function todayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function emptyDate(defaults: PlaceDefaults): DateDraft {
  return {
    key: newKey(),
    start_date: "",
    end_date: "",
    format: AuditionDateFormat.IN_PERSON,
    place: defaults.place,
    country_iso_code: defaults.country_iso_code,
    date_label: "",
    notes: "",
  };
}

export function emptyDeadline(defaults: PlaceDefaults): DeadlineDraft {
  return { key: newKey(), date: "", date_label: "", notes: "", dates: [emptyDate(defaults)] };
}

export function deadlinesFromAudition(audition: Pick<Audition, "deadlines">): DeadlineDraft[] {
  return (audition.deadlines ?? []).map((d) => ({
    key: newKey(),
    id: d.id,
    date: d.date,
    date_label: d.date_label ?? "",
    notes: d.notes ?? "",
    dates: (d.dates ?? []).map((x) => ({
      key: newKey(),
      id: x.id,
      start_date: x.start_date,
      end_date: x.end_date,
      format: x.format,
      place: x.place,
      country_iso_code: x.country_iso_code ?? "",
      date_label: x.date_label ?? "",
      notes: x.notes ?? "",
    })),
  }));
}

/** Cambia el inicio y arrastra el fin mientras era un solo día (o estaba vacío). */
export function withStartDate(date: DateDraft, start: string): DateDraft {
  const singleDay = !date.end_date || date.end_date === date.start_date;
  return { ...date, start_date: start, end_date: singleDay ? start : date.end_date };
}

export function withFormat(date: DateDraft, format: AuditionDateFormat, defaults: PlaceDefaults): DateDraft {
  if (format === date.format) return date;
  return format === AuditionDateFormat.ONLINE
    ? { ...date, format, place: "", country_iso_code: "" }
    : { ...date, format, place: defaults.place, country_iso_code: defaults.country_iso_code };
}

/**
 * Atajo "ASAP": label "ASAP" y, como fecha, el inicio de su primera fecha de
 * audición (se puede apuntar hasta que empieza).
 */
export function applyAsap(deadline: DeadlineDraft): DeadlineDraft {
  const starts = deadline.dates.map((x) => x.start_date).filter(isValidIsoDate).sort();
  return { ...deadline, date_label: DATE_LABEL_PRESETS.ASAP, date: starts[0] ?? deadline.date };
}

/** Atajo "To be arranged": solo el label; la fecha estimada la sigue poniendo el admin. */
export function applyToBeArranged(date: DateDraft): DateDraft {
  return { ...date, date_label: DATE_LABEL_PRESETS.TO_BE_ARRANGED };
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function daysBetween(startIso: string, endIso: string): number {
  const toUtc = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(endIso) - toUtc(startIso)) / 86_400_000);
}

export function validateSchedule(deadlines: DeadlineDraft[]): FormErrors {
  const errors: FormErrors = {};
  if (deadlines.length === 0) errors.schedule = "Add at least one deadline.";

  for (const deadline of deadlines) {
    const dk = deadline.key;
    if (!isValidIsoDate(deadline.date)) errors[`${dk}.date`] = "Use a real date (YYYY-MM-DD).";
    if (deadline.dates.length === 0) errors[`${dk}.dates`] = "Add at least one audition date.";

    for (const date of deadline.dates) {
      const k = date.key;
      const startOk = isValidIsoDate(date.start_date);
      const endOk = isValidIsoDate(date.end_date);
      if (!startOk) errors[`${k}.start_date`] = "Use a real date (YYYY-MM-DD).";
      if (!endOk) errors[`${k}.end_date`] = "Use a real date (YYYY-MM-DD).";

      if (startOk && endOk) {
        const span = daysBetween(date.start_date, date.end_date);
        if (span < 0) errors[`${k}.end_date`] = "The end can't be before the start.";
        else if (span >= AUDITION_DATE_MAX_DAYS)
          errors[`${k}.end_date`] = `A range can last ${AUDITION_DATE_MAX_DAYS} days at most.`;

        if (isValidIsoDate(deadline.date) && deadline.date > date.end_date && !errors[`${dk}.date`])
          errors[`${dk}.date`] = "The deadline can't be after the end of its audition dates.";
      }

      if (date.format === AuditionDateFormat.IN_PERSON) {
        const code = date.country_iso_code.trim().toUpperCase();
        if (!code) errors[`${k}.country_iso_code`] = "Required for an in-person audition.";
        else if (!COUNTRY_ISO_CODE_PATTERN.test(code))
          errors[`${k}.country_iso_code`] = "Use an ISO code: ES, FR, GB-ENG…";
      }
    }
  }
  return errors;
}

const orNull = (value: string) => (value.trim() ? value.trim() : null);

export function scheduleForPayload(deadlines: DeadlineDraft[]): SaveAuditionPayload["deadlines"] {
  return deadlines.map((d) => ({
    ...(d.id ? { id: d.id } : {}),
    date: d.date,
    date_label: orNull(d.date_label),
    notes: orNull(d.notes),
    dates: d.dates.map((x) => {
      const online = x.format === AuditionDateFormat.ONLINE;
      return {
        ...(x.id ? { id: x.id } : {}),
        start_date: x.start_date,
        end_date: x.end_date,
        format: x.format,
        place: orNull(x.place), // vacío: lo pone la BD (compañía u "Online")
        country_iso_code: online ? null : orNull(x.country_iso_code.toUpperCase()),
        date_label: orNull(x.date_label),
        notes: orNull(x.notes),
      };
    }),
  }));
}

// ─── Requisitos de altura ────────────────────────────────────────────────────

/** Un género marcado restringe la audición a él; sin alturas, a cualquier altura. */
export type HeightDraft = { active: boolean; min?: string; max?: string };
export type HeightDrafts = Record<AuditionGender, HeightDraft>;

export const GENDER_LABELS: Record<AuditionGender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export function heightDraftsFrom(reqs: AuditionHeightRequirement[] = []): HeightDrafts {
  const draft = (gender: AuditionGender): HeightDraft => {
    const r = reqs.find((h) => h.gender === gender);
    return { active: !!r, min: r?.min_height_cm?.toString(), max: r?.max_height_cm?.toString() };
  };
  return { male: draft("male"), female: draft("female"), other: draft("other") };
}

export function validateHeights(drafts: HeightDrafts): string | null {
  for (const gender of Object.keys(drafts) as AuditionGender[]) {
    const s = drafts[gender];
    if (!s.active) continue;
    const label = GENDER_LABELS[gender];
    const rawMin = s.min?.trim() ?? "";
    const rawMax = s.max?.trim() ?? "";
    const min = rawMin ? Number(rawMin) : null;
    const max = rawMax ? Number(rawMax) : null;
    if (min != null && (!Number.isFinite(min) || min <= 0))
      return `${label}: minimum height must be a positive number (or leave it empty).`;
    if (max != null && (!Number.isFinite(max) || max <= 0))
      return `${label}: maximum height must be a positive number (or leave it empty).`;
    if (min != null && max != null && min > max)
      return `${label}: minimum height can't be greater than the maximum.`;
  }
  return null;
}

export function heightsForPayload(drafts: HeightDrafts): AuditionHeightRequirement[] {
  return (Object.keys(drafts) as AuditionGender[])
    .filter((gender) => drafts[gender].active)
    .map((gender) => ({
      gender,
      min_height_cm: drafts[gender].min?.trim() ? Number(drafts[gender].min) : null,
      max_height_cm: drafts[gender].max?.trim() ? Number(drafts[gender].max) : null,
    }));
}
