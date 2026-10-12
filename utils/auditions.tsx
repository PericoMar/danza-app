// utils/auditions.ts

import type { Company } from "@/hooks/useCompanies";
import { Audition, AuditionGenderRestriction, AuditionStatus } from "@/types/audition";

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
// Orden de relevancia de las audiciones, para el público y para el admin:
//
//   1  open_call      la deadline más próxima primero
//   2  post_deadline  la fecha de audición más próxima primero
//   3  past           la que terminó más recientemente primero
//
// En empate, la creada más recientemente primero. Solo usa campos que calcula
// la vista, así que no depende del reloj del dispositivo.
// ---------------------------------------------------------------------------
const STATUS_RANK: Record<AuditionStatus, number> = {
  [AuditionStatus.OPEN_CALL]: 0,
  [AuditionStatus.POST_DEADLINE]: 1,
  [AuditionStatus.PAST]: 2,
};

function rankingDate(audition: Audition): string | null {
  switch (audition.status) {
    case AuditionStatus.OPEN_CALL:
      return audition.next_deadline_date;
    case AuditionStatus.POST_DEADLINE:
      return audition.next_audition_date;
    default:
      return audition.last_audition_end_date;
  }
}

/** Fechas YYYY-MM-DD; las que faltan van al final. */
function compareIsoDates(a: string | null, b: string | null, descending: boolean): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return descending ? b.localeCompare(a) : a.localeCompare(b);
}

function createdAtMs(audition: Audition): number {
  const ms = new Date(audition.created_at).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export function compareAuditionsByRelevance(a: Audition, b: Audition): number {
  return (
    STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
    compareIsoDates(rankingDate(a), rankingDate(b), a.status === AuditionStatus.PAST) ||
    createdAtMs(b) - createdAtMs(a)
  );
}

/** Audiciones de la más a la menos relevante (no modifica la lista recibida). */
export function sortAuditionsByRelevance(auditions: Audition[]): Audition[] {
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
