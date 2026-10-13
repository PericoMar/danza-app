// utils/auditionDisplay.ts
// Texto listo para pintar a partir de una audición. Compartido por la ficha
// pública (Insights) y el panel de admin para que ambos digan lo mismo.
//
// Regla de los labels: un `date_label` se muestra EN LUGAR de la fecha (la
// fecha real o estimada sigue debajo para estados y filtros); las `notes` de
// una fecha de audición se muestran JUNTO a ella. El `schedule_label` de la
// audición sustituye en la card del listado toda la línea "Deadline · Audition";
// en la ficha va encima de las fechas.

import {
  APPLICATION_LINK_DEFAULT_LABEL,
  CARD_LABEL_FALLBACK,
  CARD_LABEL_MAX_CHARS,
  CARD_MULTIPLE_DATES,
} from "@/constants/auditions";
import type {
  Audition,
  AuditionAgeRange,
  AuditionApplicationLink,
  AuditionDate,
  AuditionDateFormat,
  AuditionDeadline,
  AuditionHeightRequirement,
} from "@/types/audition";

export type AuditionSpec = { k: string; v: string };

/** Una deadline tal como se muestra. `date` solo existe si lo que se muestra es la fecha. */
export type DeadlineRow = { key: string; text: string; date: Date | null; notes: string | null };

/** Una fecha de audición tal como se muestra. `start`/`end` solo si se muestran fechas. */
export type AuditionDateRow = {
  key: string;
  when: string;
  place: string;
  format: AuditionDateFormat;
  notes: string | null;
  start: Date | null;
  end: Date | null;
};

/** "2026-11-17" -> fecha local (un `new Date(iso)` sería medianoche UTC y en América saldría el día anterior). */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatAuditionDate(d?: string | null): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(d));
  } catch {
    return d ?? "—";
  }
}

/** Fecha legible y destacada: "30 Oct 2026" (según el locale del usuario). */
export function formatAuditionDateLong(d: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return d.toDateString();
  }
}

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric" });
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const FULL = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "17 Nov 2026" · "17–20 Nov 2026" · "30 Sep – 2 Oct 2026" · "28 Dec 2026 – 3 Jan 2027" */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (startIso === endIso) return FULL.format(start);
  if (start.getFullYear() !== end.getFullYear()) return `${FULL.format(start)} – ${FULL.format(end)}`;
  if (start.getMonth() !== end.getMonth()) return `${DAY_MONTH.format(start)} – ${FULL.format(end)}`;
  return `${DAY.format(start)}–${FULL.format(end)}`;
}

/** "17.11" — para las cards compactas. */
export function formatShortDate(iso: string): string {
  const d = parseIsoDate(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function joinDistinct(values: (string | null)[]): string | null {
  const distinct = [...new Set(values.filter((v): v is string => !!v))];
  return distinct.length ? distinct.join(" · ") : null;
}

/** Una deadline tal como se muestra, con las fechas de audición que cuelgan de ella. */
export type ScheduleRow = { deadline: DeadlineRow; dates: AuditionDateRow[] };

const byStartDate = (a: AuditionDate, b: AuditionDate) =>
  a.start_date.localeCompare(b.start_date) || a.id.localeCompare(b.id);

function toDateRow(x: AuditionDate): AuditionDateRow {
  return {
    key: x.id,
    when: x.date_label ?? formatDateRange(x.start_date, x.end_date),
    place: x.place,
    format: x.format,
    notes: x.notes,
    start: x.date_label ? null : parseIsoDate(x.start_date),
    end: x.date_label ? null : parseIsoDate(x.end_date),
  };
}

/**
 * Deadlines en orden de fecha, cada una con sus fechas de audición. Las que
 * llevan el mismo `date_label` (p. ej. una "ASAP" por cada fecha de audición)
 * se muestran una sola vez y juntan sus fechas.
 */
export function getScheduleRows(audition: Pick<Audition, "deadlines">): ScheduleRow[] {
  const rows = new Map<string, { deadline: DeadlineRow; allNotes: (string | null)[]; dates: AuditionDate[] }>();
  for (const d of audition.deadlines ?? []) {
    const key = d.date_label ? `label:${d.date_label}` : `date:${d.date}`;
    const row = rows.get(key) ?? {
      deadline: {
        key,
        text: d.date_label ?? FULL.format(parseIsoDate(d.date)),
        date: d.date_label ? null : parseIsoDate(d.date),
        notes: null,
      },
      allNotes: [],
      dates: [],
    };
    row.allNotes.push(d.notes);
    row.dates.push(...(d.dates ?? []));
    rows.set(key, row);
  }
  return [...rows.values()].map(({ deadline, allNotes, dates }) => ({
    deadline: { ...deadline, notes: joinDistinct(allNotes) },
    dates: dates.sort(byStartDate).map(toDateRow),
  }));
}

export function getDeadlineRows(audition: Pick<Audition, "deadlines">): DeadlineRow[] {
  return getScheduleRows(audition).map((row) => row.deadline);
}

/** Todas las fechas de audición, de la primera a la última. */
export function getAuditionDates(audition: Pick<Audition, "deadlines">): AuditionDate[] {
  return (audition.deadlines ?? []).flatMap((d) => d.dates ?? []).sort(byStartDate);
}

export function getAuditionDateRows(audition: Pick<Audition, "deadlines">): AuditionDateRow[] {
  return getAuditionDates(audition).map(toDateRow);
}

/** Lugares distintos en orden de fecha: "Bradford · Birmingham". */
export function getPlacesSummary(audition: Pick<Audition, "deadlines">): string | null {
  return joinDistinct(getAuditionDates(audition).map((x) => x.place));
}

/** Un label en la tira de la card del listado: entero si cabe y, si no, "TBA". */
export function cardLabel(label: string): string {
  return label.length <= CARD_LABEL_MAX_CHARS ? label : CARD_LABEL_FALLBACK;
}

/**
 * La deadline que encabeza la audición: la próxima si sigue abierta y, si no,
 * la última que hubo.
 */
export function getHeadlineDeadline(
  audition: Pick<Audition, "deadlines" | "next_deadline_date">
): AuditionDeadline | null {
  const deadlines = audition.deadlines ?? [];
  return (
    deadlines.find((d) => d.date === audition.next_deadline_date) ??
    deadlines[deadlines.length - 1] ??
    null
  );
}

/**
 * La fecha de audición que encabeza la audición: la primera que aún no ha
 * terminado y, si no queda ninguna, la última.
 */
export function getHeadlineAuditionDate(
  audition: Pick<Audition, "deadlines" | "next_audition_date">
): AuditionDate | null {
  const dates = getAuditionDates(audition);
  return (
    dates.find((x) => x.start_date === audition.next_audition_date) ?? dates[dates.length - 1] ?? null
  );
}

type CardScheduleSource = Pick<
  Audition,
  "deadlines" | "next_deadline_date" | "next_audition_date" | "schedule_label"
>;

function cardDeadlineText(audition: CardScheduleSource): string {
  const deadline = getHeadlineDeadline(audition);
  if (!deadline) return "—";
  return deadline.date_label ? cardLabel(deadline.date_label) : formatShortDate(deadline.date);
}

function cardAuditionDateText(audition: CardScheduleSource): string {
  if (getAuditionDates(audition).length > 1) return CARD_MULTIPLE_DATES;
  const date = getHeadlineAuditionDate(audition);
  if (!date) return "—";
  return date.date_label ? cardLabel(date.date_label) : formatShortDate(date.start_date);
}

/**
 * La línea de fechas de la card del listado: "Deadline 10.11  ·  Audition 17.11".
 * Un schedule label la sustituye entera; un date label, solo su fecha.
 */
export function getCardScheduleText(audition: CardScheduleSource): string {
  if (audition.schedule_label) return audition.schedule_label;
  return `Deadline ${cardDeadlineText(audition)}  ·  Audition ${cardAuditionDateText(audition)}`;
}

export function getHeightSpecs(heights?: AuditionHeightRequirement[] | null): AuditionSpec[] {
  return (heights ?? []).map((h) => {
    const who =
      h.gender === "male"
        ? "Height — male"
        : h.gender === "female"
        ? "Height — female"
        : "Height — all genders";
    const { min_height_cm: min, max_height_cm: max } = h;
    const v =
      min && max
        ? `${min}–${max} cm`
        : min
        ? `≥ ${min} cm`
        : max
        ? `≤ ${max} cm`
        : "Any height";
    return { k: who, v };
  });
}

/** Rango de edad compacto: "18–25", "18+", "Up to 25"; null si no hay límite. */
export function formatAgeRange({ min_age: min, max_age: max }: AuditionAgeRange): string | null {
  if (min != null && max != null) return min === max ? `${min}` : `${min}–${max}`;
  if (min != null) return `${min}+`;
  if (max != null) return `Up to ${max}`;
  return null;
}

/** El mismo rango para leer en voz alta: "aged 18 to 25"; null si no hay límite. */
export function describeAgeRange({ min_age: min, max_age: max }: AuditionAgeRange): string | null {
  if (min != null && max != null) return min === max ? `aged ${min}` : `aged ${min} to ${max}`;
  if (min != null) return `aged ${min} or older`;
  if (max != null) return `aged ${max} or younger`;
  return null;
}

/** Ficha "Age" solo si la audición tiene límite de edad. */
export function getAgeSpecs(range: AuditionAgeRange): AuditionSpec[] {
  const text = formatAgeRange(range);
  return text ? [{ k: "Age", v: `${text} years` }] : [];
}

/** "https://www.forms.gle/abc?x=1" -> "forms.gle". Sin `URL`, para no depender del polyfill de React Native. */
export function urlHost(url: string): string {
  const host = url.trim().replace(/^https?:\/\//i, "").split(/[/?#:]/)[0];
  return host.replace(/^www\./i, "");
}

/** Un enlace de inscripción tal como se muestra: su texto y adónde lleva. */
export type ApplicationLinkRow = { key: string; url: string; text: string; host: string };

/**
 * El texto de un enlace es su label. Sin label, el único enlace dice "Apply";
 * con varios, cada uno su dominio, para que no haya dos botones iguales.
 */
export function getApplicationLinkRows(
  audition: Pick<Audition, "application_links">
): ApplicationLinkRow[] {
  const links: AuditionApplicationLink[] = audition.application_links ?? [];
  return links.map((link) => {
    const host = urlHost(link.url);
    const fallback = links.length === 1 ? APPLICATION_LINK_DEFAULT_LABEL : host;
    return { key: link.id, url: link.url, text: link.label?.trim() || fallback, host };
  });
}
