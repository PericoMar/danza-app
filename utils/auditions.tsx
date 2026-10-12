// utils/auditions.ts

import type { Company } from "@/hooks/useCompanies";
import { Audition, AuditionGenderRestriction, AuditionStatus } from "@/types/audition";
import { getAuditionDates } from "@/utils/auditionDisplay";

type StatusBadge = {
  label: string;
  textColor: string;
  bgColor: string;
};

/**
 * ¿La audición está restringida a un único género?
 * Sin `height_requirements` (o vacío), o con filas de ambos géneros => no hay
 * restricción que mostrar. Con filas de un solo género ("male" o "female")
 * => esa es la restricción a destacar sutilmente en la card.
 */
export function getAuditionGenderRestriction(
  audition: Pick<Audition, "height_requirements"> | null | undefined,
): AuditionGenderRestriction | null {
  const reqs = audition?.height_requirements;
  if (!reqs || reqs.length === 0) return null;
  const genders = new Set(reqs.map((r) => r.gender));
  if (genders.has("male") && !genders.has("female")) return "male";
  if (genders.has("female") && !genders.has("male")) return "female";
  return null;
}

// El estado lo calcula la vista `auditions_enriched`; aquí solo se pinta.
const STATUS_BADGES: Record<AuditionStatus, StatusBadge> = {
  [AuditionStatus.OPEN_CALL]: {
    label: "Open call",
    textColor: "#047857", // emerald-700
    bgColor: "rgba(16, 185, 129, 0.14)",
  },
  [AuditionStatus.POST_DEADLINE]: {
    label: "Post-deadline",
    textColor: "#aea00bff", // amber-800
    bgColor: "rgba(245, 158, 11, 0.16)",
  },
  [AuditionStatus.PAST]: {
    label: "Past audition",
    textColor: "#B91C1C", // red-700
    bgColor: "rgba(248, 113, 113, 0.18)",
  },
};

export function getStatusBadge(audition: Pick<Audition, "status"> | null): StatusBadge | null {
  return audition ? STATUS_BADGES[audition.status] ?? null : null;
}

/** Viva: activa y aún no pasada (open call o post-deadline). */
export function isLiveAudition(audition: Pick<Audition, "is_active" | "status">): boolean {
  return audition.is_active && audition.status !== AuditionStatus.PAST;
}

// ---------------------------------------------------------------------------
// Orden de relevancia de las audiciones, para el público y para el admin.
// Primero por estado (lo calcula la vista) y, dentro de cada uno, lo que tiene
// fecha real (sin label) va antes que lo que solo tiene label: la fecha que hay
// debajo de un "ASAP" o un "To be arranged" es una estimación.
//
//   open_call      1  deadline real                  la más próxima primero
//                  2  deadline con label + fecha real la fecha de audición más próxima primero
//                  3  solo labels (ASAP + TBA…)       la actualizada más recientemente primero
//   post_deadline  4  queda una fecha real            la más próxima primero
//                  5  solo TBA, deadline real         la deadline más reciente primero
//                  6  solo labels                     la actualizada más recientemente primero
//   past           7  deadline real                   la más reciente primero
//                  8  deadline con label + fecha real la que terminó más recientemente primero
//                  9  solo labels                     la actualizada más recientemente primero
//
// "La deadline" es la que encabeza la audición (la próxima o, si no queda
// ninguna, la última), la misma que enseña la card. En empate, la creada más
// recientemente primero. Solo usa campos de la vista, así que no depende del
// reloj del dispositivo.
// ---------------------------------------------------------------------------
const RelevanceGroup = {
  OPEN_REAL_DEADLINE: 0,
  OPEN_REAL_AUDITION: 1,
  OPEN_LABELS_ONLY: 2,
  POST_REAL_AUDITION: 3,
  POST_REAL_DEADLINE: 4,
  POST_LABELS_ONLY: 5,
  PAST_REAL_DEADLINE: 6,
  PAST_REAL_AUDITION: 7,
  PAST_LABELS_ONLY: 8,
} as const;
type RelevanceGroup = (typeof RelevanceGroup)[keyof typeof RelevanceGroup];

/** Grupo y, dentro de él, `order`: menor = antes. */
type RelevanceKey = { group: RelevanceGroup; order: number };

const isReal = (item: { date_label: string | null }) => !item.date_label;

const isoMs = (iso: string) => {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
};

const earliest = (isos: string[]) => (isos.length ? isos.reduce((a, b) => (b < a ? b : a)) : null);
const latest = (isos: string[]) => (isos.length ? isos.reduce((a, b) => (b > a ? b : a)) : null);

/** La deadline que encabeza la audición tiene fecha real (no solo label). */
function headlineDeadlineIsReal(audition: Audition, headlineDate: string): boolean {
  return (audition.deadlines ?? []).some((d) => d.date === headlineDate && isReal(d));
}

/**
 * Inicio de la primera fecha real que aún no ha terminado. `next_audition_date`
 * (la primera que no ha terminado, con o sin label) hace de "hoy".
 */
function nextRealAuditionStart(audition: Audition): string | null {
  const from = audition.next_audition_date;
  if (!from) return null;
  const upcoming = getAuditionDates(audition).filter((x) => isReal(x) && x.end_date >= from);
  return earliest(upcoming.map((x) => x.start_date));
}

function lastRealAuditionEnd(audition: Audition): string | null {
  return latest(getAuditionDates(audition).filter(isReal).map((x) => x.end_date));
}

function relevanceKey(audition: Audition): RelevanceKey {
  // Lo más reciente primero: el orden va al revés que la fecha.
  const lastUpdate = -isoMs(audition.content_updated_at ?? audition.created_at);
  const lastDeadline = latest((audition.deadlines ?? []).map((d) => d.date));

  switch (audition.status) {
    case AuditionStatus.OPEN_CALL: {
      const nextDeadline = audition.next_deadline_date;
      if (nextDeadline && headlineDeadlineIsReal(audition, nextDeadline))
        return { group: RelevanceGroup.OPEN_REAL_DEADLINE, order: isoMs(nextDeadline) };
      const nextReal = nextRealAuditionStart(audition);
      return nextReal
        ? { group: RelevanceGroup.OPEN_REAL_AUDITION, order: isoMs(nextReal) }
        : { group: RelevanceGroup.OPEN_LABELS_ONLY, order: lastUpdate };
    }
    case AuditionStatus.POST_DEADLINE: {
      const nextReal = nextRealAuditionStart(audition);
      if (nextReal) return { group: RelevanceGroup.POST_REAL_AUDITION, order: isoMs(nextReal) };
      return lastDeadline && headlineDeadlineIsReal(audition, lastDeadline)
        ? { group: RelevanceGroup.POST_REAL_DEADLINE, order: -isoMs(lastDeadline) }
        : { group: RelevanceGroup.POST_LABELS_ONLY, order: lastUpdate };
    }
    default: {
      if (lastDeadline && headlineDeadlineIsReal(audition, lastDeadline))
        return { group: RelevanceGroup.PAST_REAL_DEADLINE, order: -isoMs(lastDeadline) };
      const lastRealEnd = lastRealAuditionEnd(audition);
      return lastRealEnd
        ? { group: RelevanceGroup.PAST_REAL_AUDITION, order: -isoMs(lastRealEnd) }
        : { group: RelevanceGroup.PAST_LABELS_ONLY, order: lastUpdate };
    }
  }
}

function createdAtMs(audition: Audition): number {
  return isoMs(audition.created_at);
}

export function compareAuditionsByRelevance(a: Audition, b: Audition): number {
  const ka = relevanceKey(a);
  const kb = relevanceKey(b);
  return ka.group - kb.group || ka.order - kb.order || createdAtMs(b) - createdAtMs(a);
}

/** Audiciones de la más a la menos relevante (no modifica la lista recibida). */
export function sortAuditionsByRelevance<T extends Audition>(auditions: T[]): T[] {
  return [...auditions].sort(compareAuditionsByRelevance);
}

function auditionsOf(company: Pick<Company, "auditions">): Audition[] {
  return Array.isArray(company.auditions) ? company.auditions : [];
}

/**
 * Audiciones activas de una compañía, de la más a la menos relevante. La
 * primera es la principal.
 */
export function getActiveAuditionsByRelevance(company: Pick<Company, "auditions">): Audition[] {
  return sortAuditionsByRelevance(auditionsOf(company).filter((a) => a.is_active));
}

/**
 * La audición que representa a la compañía en la UI (card, ficha, contadores):
 * su audición activa más relevante, la misma que decide su posición cuando se
 * ordena por audiciones.
 */
export function getPrimaryAudition(company: Pick<Company, "auditions">): Audition | null {
  return getActiveAuditionsByRelevance(company)[0] ?? null;
}

/** Compara compañías por su audición principal; las que no tienen ninguna, al final. */
export function compareByPrimaryAudition(a: Audition | null, b: Audition | null): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return compareAuditionsByRelevance(a, b);
}

/** Compañías con alguna audición viva (filtro "Upcoming auditions"). */
export function filterCompaniesByUpcomingAuditions(companies: Company[]): Company[] {
  return companies.filter((c) => c.has_live_audition);
}
