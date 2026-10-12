// utils/auditionDisplay.ts
// Texto listo para pintar a partir de una audición. Compartido por la ficha
// pública (Insights) y el panel de admin para que ambos digan lo mismo.

import type {
  Audition,
  AuditionHeightRequirement,
  AuditionScheduleEntry,
} from "@/types/audition";

/**
 * `label` es la línea completa ("Round 1 · 12/11/2026"); `entryLabel` es solo el
 * nombre de la entrada en modo `various_dates`, para quien pinte la fecha aparte.
 */
export type AuditionScheduleRow = { label: string; date: Date | null; entryLabel?: string };
export type AuditionSpec = { k: string; v: string };

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

export function getDeadlineDisplay(audition: Audition): string | null {
  const mode = audition.deadline_mode ?? "fixed_date";
  if (mode === "asap") return "ASAP";
  if (mode === "always_open") return "Always open";
  if (audition.deadline_date) return formatAuditionDate(audition.deadline_date);
  return null;
}

export function getAuditionScheduleRows(audition: Audition): AuditionScheduleRow[] {
  const rows: AuditionScheduleRow[] = [];
  const mode =
    audition.audition_schedule_mode ?? (audition.audition_date ? "single_date" : null);

  if (mode === "to_be_arranged") {
    const note = audition.audition_schedule_note?.trim();
    rows.push({ label: note && note.length > 0 ? note : "To be arranged", date: null });
    return rows;
  }

  if (mode === "various_dates") {
    const entries = (audition.audition_schedule_entries ?? []) as AuditionScheduleEntry[];
    for (const entry of entries) {
      if (!entry.date) continue;
      const label = entry.label?.trim() || "Audition";
      rows.push({
        label: `${label} · ${formatAuditionDate(entry.date)}`,
        date: new Date(entry.date),
        entryLabel: label,
      });
    }
    if (rows.length === 0) rows.push({ label: "Multiple dates", date: null });
    return rows;
  }

  if (audition.audition_date) {
    rows.push({
      label: formatAuditionDate(audition.audition_date),
      date: new Date(audition.audition_date),
    });
  }
  return rows;
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
