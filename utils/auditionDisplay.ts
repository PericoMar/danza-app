// utils/auditionDisplay.ts
// Texto listo para pintar a partir de una audición. Compartido por la ficha
// pública (Insights) y el panel de admin para que ambos digan lo mismo.
//
// Regla de los labels: un `date_label` se muestra EN LUGAR de la fecha (la
// fecha real o estimada sigue debajo para estados y filtros); las `notes` de
// una fecha de audición se muestran JUNTO a ella.

import { CARD_LABEL_FALLBACK, CARD_LABEL_MAX_CHARS } from "@/constants/auditions";
import type {
  Audition,
  AuditionDate,
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

/**
 * Deadlines en orden de fecha. Las que llevan el mismo `date_label` (p. ej. una
 * "ASAP" por cada fecha de audición) se muestran una sola vez.
 */
export function getDeadlineRows(audition: Pick<Audition, "deadlines">): DeadlineRow[] {
  const rows = new Map<string, DeadlineRow & { allNotes: (string | null)[] }>();
  for (const d of audition.deadlines ?? []) {
    const key = d.date_label ? `label:${d.date_label}` : `date:${d.date}`;
    const row = rows.get(key);
    if (row) {
      row.allNotes.push(d.notes);
      continue;
    }
    rows.set(key, {
      key,
      text: d.date_label ?? FULL.format(parseIsoDate(d.date)),
      date: d.date_label ? null : parseIsoDate(d.date),
      notes: null,
      allNotes: [d.notes],
    });
  }
  return [...rows.values()].map(({ allNotes, ...row }) => ({ ...row, notes: joinDistinct(allNotes) }));
}

/** Todas las fechas de audición, de la primera a la última. */
export function getAuditionDates(audition: Pick<Audition, "deadlines">): AuditionDate[] {
  return (audition.deadlines ?? [])
    .flatMap((d) => d.dates ?? [])
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.id.localeCompare(b.id));
}

export function getAuditionDateRows(audition: Pick<Audition, "deadlines">): AuditionDateRow[] {
  return getAuditionDates(audition).map((x) => ({
    key: x.id,
    when: x.date_label ?? formatDateRange(x.start_date, x.end_date),
    place: x.place,
    notes: x.notes,
    start: x.date_label ? null : parseIsoDate(x.start_date),
    end: x.date_label ? null : parseIsoDate(x.end_date),
  }));
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
