// utils/auditionForm.ts
// Lógica pura del formulario de audición: borradores del calendario
// (deadlines -> fechas) y de los enlaces de inscripción, atajos, validación y
// payload de `save_audition`.
// Las reglas de validación replican las de la BD para avisar antes de guardar.

import {
  APPLICATION_LINK_URL_PATTERN,
  AUDITION_DATE_MAX_DAYS,
  CARD_LABEL_FALLBACK,
  CARD_LABEL_MAX_CHARS,
  CARD_MULTIPLE_DATES,
  COUNTRY_ISO_CODE_PATTERN,
  DATE_LABEL_PRESETS,
  ISO_DATE_PATTERN,
  OpenDeadlineLabel,
} from "@/constants/auditions";
import {
  Audition,
  AuditionAgeRange,
  AuditionApplicationLink,
  AuditionDateFormat,
  AuditionGender,
  AuditionHeightRequirement,
  SaveAuditionPayload,
} from "@/types/audition";
import { cardLabel } from "@/utils/auditionDisplay";

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

/**
 * Cambia el inicio y el fin lo sigue (lo normal es un solo día). El fin solo se
 * queda quieto si ya es el final de un rango: una fecha completa distinta del
 * inicio anterior y que no queda antes del nuevo inicio. El fin nunca toca el inicio.
 */
export function withStartDate(date: DateDraft, start: string): DateDraft {
  const end = date.end_date;
  const keepsRange =
    isValidIsoDate(end) && end !== date.start_date && (!isValidIsoDate(start) || end >= start);
  return { ...date, start_date: start, end_date: keepsRange ? end : start };
}

export function withFormat(date: DateDraft, format: AuditionDateFormat, defaults: PlaceDefaults): DateDraft {
  if (format === date.format) return date;
  return format === AuditionDateFormat.ONLINE
    ? { ...date, format, place: "", country_iso_code: "" }
    : { ...date, format, place: defaults.place, country_iso_code: defaults.country_iso_code };
}

/**
 * Atajos "ASAP" / "Always open": ese label y, como fecha, el inicio de su
 * primera fecha de audición (se puede apuntar hasta que empieza).
 */
export function applyOpenDeadline(deadline: DeadlineDraft, label: OpenDeadlineLabel): DeadlineDraft {
  const starts = deadline.dates.map((x) => x.start_date).filter(isValidIsoDate).sort();
  return { ...deadline, date_label: label, date: starts[0] ?? deadline.date };
}

/** Atajo "To be arranged": solo el label; la fecha estimada la sigue poniendo el admin. */
export function applyToBeArranged(date: DateDraft): DateDraft {
  return { ...date, date_label: DATE_LABEL_PRESETS.TO_BE_ARRANGED };
}

/** Lo que decide qué label usa la card del listado (misma regla que `getCardScheduleText`). */
export type CardHintContext = { hasScheduleLabel: boolean; auditionDateCount: number };

const SCHEDULE_LABEL_WINS_HINT = "Listing card shows the Schedule label instead.";

function cardLabelHint(label: string): string {
  return cardLabel(label) === label
    ? `Listing card shows "${label}".`
    : `Listing card shows "${CARD_LABEL_FALLBACK}": labels over ${CARD_LABEL_MAX_CHARS} characters don't fit there. The audition page shows it in full.`;
}

/** Aviso bajo el label de una deadline: cómo se lee en la card del listado. */
export function deadlineCardHint(
  label: string,
  context: Pick<CardHintContext, "hasScheduleLabel">
): string | undefined {
  const trimmed = label.trim();
  if (!trimmed) return undefined;
  if (context.hasScheduleLabel) return SCHEDULE_LABEL_WINS_HINT;
  return cardLabelHint(trimmed);
}

/**
 * Aviso bajo el label de una fecha de audición. La card solo lo usa si la
 * audición no tiene Schedule label y tiene una única fecha de audición.
 */
export function auditionDateCardHint(label: string, context: CardHintContext): string | undefined {
  const trimmed = label.trim();
  if (!trimmed) return undefined;
  if (context.hasScheduleLabel) return SCHEDULE_LABEL_WINS_HINT;
  if (context.auditionDateCount > 1)
    return `Listing card shows "${CARD_MULTIPLE_DATES}" instead (there are several audition dates).`;
  return cardLabelHint(trimmed);
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

// ─── Rango de edad ───────────────────────────────────────────────────────────

/** Vacío = sin ese límite. Errores en `min_age` / `max_age`. */
export type AgeRangeDraft = { min: string; max: string };

const WHOLE_NUMBER = /^\d+$/;

export function ageRangeDraftFrom(range?: AuditionAgeRange): AgeRangeDraft {
  return { min: range?.min_age?.toString() ?? "", max: range?.max_age?.toString() ?? "" };
}

export function validateAgeRange(draft: AgeRangeDraft): FormErrors {
  const errors: FormErrors = {};
  const check = (raw: string, key: keyof AuditionAgeRange) => {
    const value = raw.trim();
    if (!value) return null;
    if (!WHOLE_NUMBER.test(value) || Number(value) <= 0) {
      errors[key] = "Use a whole number of years above 0.";
      return null;
    }
    return Number(value);
  };
  const min = check(draft.min, "min_age");
  const max = check(draft.max, "max_age");
  if (min != null && max != null && min > max) errors.max_age = "The maximum age can't be below the minimum.";
  return errors;
}

export function ageRangeForPayload(draft: AgeRangeDraft): AuditionAgeRange {
  const toAge = (raw: string) => (raw.trim() ? Number(raw.trim()) : null);
  return { min_age: toAge(draft.min), max_age: toAge(draft.max) };
}

// ─── Enlaces de inscripción ──────────────────────────────────────────────────

/** Una fila del editor; las vacías (sin URL ni label) no se guardan. Errores en `${key}.url`. */
export type ApplicationLinkDraft = { key: string; url: string; label: string };

export function emptyApplicationLink(): ApplicationLinkDraft {
  return { key: newKey(), url: "", label: "" };
}

export function applicationLinkDraftsFrom(
  audition: Pick<Audition, "application_links">
): ApplicationLinkDraft[] {
  return (audition.application_links ?? []).map((l) => ({ key: newKey(), url: l.url, label: l.label ?? "" }));
}

const isBlankLink = (link: ApplicationLinkDraft) => !link.url.trim() && !link.label.trim();

export function validateApplicationLinks(links: ApplicationLinkDraft[]): FormErrors {
  const errors: FormErrors = {};
  const seen = new Set<string>();
  for (const link of links) {
    if (isBlankLink(link)) continue;
    const url = link.url.trim();
    const key = `${link.key}.url`;
    if (!url) errors[key] = "Add the link's URL, or remove it.";
    else if (!APPLICATION_LINK_URL_PATTERN.test(url)) errors[key] = "Use a full URL, starting with https://";
    else if (seen.has(url)) errors[key] = "This link is already in the list.";
    seen.add(url);
  }
  return errors;
}

export function applicationLinksForPayload(
  links: ApplicationLinkDraft[]
): Omit<AuditionApplicationLink, "id">[] {
  return links
    .filter((link) => !isBlankLink(link))
    .map((link) => ({ url: link.url.trim(), label: orNull(link.label) }));
}
