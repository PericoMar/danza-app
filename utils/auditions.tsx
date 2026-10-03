// utils/auditions.ts

import { Company } from "@/hooks/useCompanies";
import { Audition, AuditionScheduleEntry } from "@/types/audition";

type Status = {
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
): "male" | "female" | null {
  const reqs = audition?.height_requirements;
  if (!reqs || reqs.length === 0) return null;
  const genders = new Set(reqs.map((r) => r.gender));
  if (genders.has("male") && !genders.has("female")) return "male";
  if (genders.has("female") && !genders.has("male")) return "female";
  return null;
}

export function hasOpenAudition(company: Company): boolean {

  return Boolean(company.auditions && company.auditions.length > 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const auditions = Array.isArray(company.auditions) ? company.auditions : [];

  // OJO: aquí en tu comentario hablas de "deadline", pero en el código
  // estabas usando `audition_date`. Si la regla es ocultar cuando
  // *deadline* ya pasó, usa `deadline_date`:
  const nextAudition = auditions.find((a) => {
    if (!a?.audition_date) return true; // sin deadline -> la mostramos
    const d = new Date(a.audition_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() >= today.getTime();
  });

  return Boolean(nextAudition);
}

export function computeStatus(audition: Audition | null): Status | null {
  if (!audition) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineMode = audition.deadline_mode ?? "fixed_date";
  const scheduleMode = audition.audition_schedule_mode ?? "single_date";

  // ---- DEADLINE ----
  let hasDeadline = false;
  let deadlinePassed = false;

  if (deadlineMode === "fixed_date") {
    if (audition.deadline_date) {
      hasDeadline = true;
      const d = new Date(audition.deadline_date);
      d.setHours(0, 0, 0, 0);
      deadlinePassed = d.getTime() < today.getTime();
    }
  } else if (deadlineMode === "asap" || deadlineMode === "always_open") {
    hasDeadline = true;
    deadlinePassed = false; // por definición no "pasa"
  } else if (audition.deadline_date) {
    // compat legacy: sin modo pero con fecha
    hasDeadline = true;
    const d = new Date(audition.deadline_date);
    d.setHours(0, 0, 0, 0);
    deadlinePassed = d.getTime() < today.getTime();
  }

  // ---- AUDITION DATES ----
  let hasAnyAudition = false;
  let hasFutureAudition = false;
  let allAuditionsPast = false;

  if (scheduleMode === "single_date" || (!scheduleMode && audition.audition_date)) {
    if (audition.audition_date) {
      hasAnyAudition = true;
      const a = new Date(audition.audition_date);
      a.setHours(0, 0, 0, 0);
      if (a.getTime() >= today.getTime()) {
        hasFutureAudition = true;
        allAuditionsPast = false;
      } else {
        hasFutureAudition = false;
        allAuditionsPast = true;
      }
    }
  } else if (scheduleMode === "various_dates") {
    const entries = (audition.audition_schedule_entries ??
      []) as AuditionScheduleEntry[];

    if (entries.length > 0) {
      hasAnyAudition = true;
      let anyFuture = false;
      let anyPast = false;

      for (const entry of entries) {
        if (!entry.date) continue;
        const d = new Date(entry.date);
        if (Number.isNaN(d.getTime())) continue;
        d.setHours(0, 0, 0, 0);
        if (d.getTime() >= today.getTime()) {
          anyFuture = true;
        } else {
          anyPast = true;
        }
      }

      hasFutureAudition = anyFuture;
      allAuditionsPast = anyPast && !anyFuture;
    }
  } else if (scheduleMode === "to_be_arranged") {
    // No fechas explícitas, se usa solo en combinación con deadline
    hasAnyAudition = false;
    hasFutureAudition = false;
    allAuditionsPast = false;
  }

  const green: Status = {
    label: "Open call",
    textColor: "#047857", // emerald-700
    bgColor: "rgba(16, 185, 129, 0.14)",
  };

  const yellow: Status = {
    label: "Post-deadline",
    textColor: "#aea00bff", // amber-800
    bgColor: "rgba(245, 158, 11, 0.16)",
  };

  const redClosed: Status = {
    label: "Closed",
    textColor: "#B91C1C", // red-700
    bgColor: "rgba(248, 113, 113, 0.18)",
  };

  const redPast: Status = {
    label: "Past audition",
    textColor: "#B91C1C", // red-700
    bgColor: "rgba(248, 113, 113, 0.18)",
  };

  // Si no hay ningún tipo de info, no mostramos nada
  if (!hasDeadline && !hasAnyAudition && scheduleMode !== "to_be_arranged") {
    return null;
  }

  // Deadline NO pasada (fixed futura, ASAP o Always open)
  if (!deadlinePassed) {
    const isOpenEnded = deadlineMode === "asap" || deadlineMode === "always_open";

    // Tier 6) ASAP / Always open + solo fechas de audición pasadas -> Rojo.
    // (Con deadline fija futura seguimos en verde aunque las fechas hayan
    //  pasado: la convocatoria sigue abierta.)
    if (isOpenEnded && allAuditionsPast) {
      return redPast;
    }

    // Tiers 1,2,3) hay audición futura, o TBA, o deadline fija futura -> Verde
    return green;
  }

  // A partir de aquí: deadline pasada

  // 4) Deadline pasada, auditions NO pasadas todas (hay al menos una futura) -> Amarillo
  if (hasFutureAudition) {
    return yellow;
  }

  // 5) Deadline pasada y audition to be arranged -> Close / Rojo
  if (scheduleMode === "to_be_arranged") {
    return redClosed;
  }

  // 6) Deadline pasada y audition pasada (todas las dates pasadas o ninguna pero sin TBA) -> Rojo
  if (allAuditionsPast || !hasAnyAudition) {
    return redPast;
  }

  // Fallback por si se escapa algo raro
  return null;
}


function atMidnight(d: Date) {
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEarliestFutureAuditionDate(
  audition: Audition,
  today: Date
): Date | null {
  const mode = audition.audition_schedule_mode ?? "single_date";

  if ((mode === "single_date" || !mode) && audition.audition_date) {
    const d = atMidnight(new Date(audition.audition_date));
    if (Number.isNaN(d.getTime())) return null;
    return d.getTime() >= today.getTime() ? d : null;
  }

  if (mode === "various_dates") {
    const entries = (audition.audition_schedule_entries ??
      []) as AuditionScheduleEntry[];

    let best: Date | null = null;
    for (const entry of entries) {
      if (!entry.date) continue;
      const d = atMidnight(new Date(entry.date));
      if (Number.isNaN(d.getTime())) continue;
      if (d.getTime() < today.getTime()) continue;
      if (!best || d.getTime() < best.getTime()) {
        best = d;
      }
    }
    return best;
  }

  // to_be_arranged: no fecha concreta
  return null;
}

/** Fecha de audición pasada más reciente (la más cercana a hoy). */
function getLatestPastAuditionDate(
  audition: Audition,
  today: Date
): Date | null {
  const mode = audition.audition_schedule_mode ?? "single_date";

  if ((mode === "single_date" || !mode) && audition.audition_date) {
    const d = atMidnight(new Date(audition.audition_date));
    if (Number.isNaN(d.getTime())) return null;
    return d.getTime() < today.getTime() ? d : null;
  }

  if (mode === "various_dates") {
    const entries = (audition.audition_schedule_entries ??
      []) as AuditionScheduleEntry[];

    let best: Date | null = null;
    for (const entry of entries) {
      if (!entry.date) continue;
      const d = atMidnight(new Date(entry.date));
      if (Number.isNaN(d.getTime())) continue;
      if (d.getTime() >= today.getTime()) continue;
      if (!best || d.getTime() > best.getTime()) {
        best = d;
      }
    }
    return best;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Orden de la lista de compañías cuando el filtro "Upcoming auditions" está
// activo. Se ordena ascendente por `bucket * BUCKET_SIZE + innerTs`, así que
// un bucket menor siempre va por delante.
//
//   1  VERDE     Deadline fija futura
//                -> innerTs = fecha de deadline (la más próxima primero)
//   2  VERDE     ASAP / Always open + fecha de audición futura (1 o varias)
//                -> innerTs = fecha de audición más próxima
//   3  VERDE     ASAP / Always open + TBA (sin fecha concreta)
//                -> innerTs por `content_updated_at` desc (lo último actualizado primero)
//   4  AMARILLO  Deadline fija pasada + alguna audición futura
//                -> innerTs = fecha de audición más próxima
//   5  ROJO      Deadline fija pasada + (TBA | audición pasada | sin fecha)
//                -> innerTs por deadline: la más cercana a hoy primero
//   6  ROJO      ASAP / Always open + solo fechas de audición pasadas
//                -> innerTs por audición: la más cercana a hoy primero
//   99 sin ninguna información de audiciones -> siempre al final
// ---------------------------------------------------------------------------
const BUCKET_SIZE = 10 ** 13;
const HALF_BUCKET = BUCKET_SIZE / 2;

const B_GREEN_DEADLINE = 1;
const B_GREEN_OPEN_DATED = 2;
const B_GREEN_OPEN_TBA = 3;
const B_YELLOW_POST_DEADLINE = 4;
const B_RED_CLOSED = 5;
const B_RED_OPEN_PAST = 6;

// Bucket especial para compañías SIN ninguna información de audiciones
const NO_INFO_BUCKET = 99; // Siempre al final

// Umbral por encima del cual una compañía se considera "cerrada" y sale del
// filtro "upcoming": buckets 5, 6 y 99.
const CLOSED_THRESHOLD = B_RED_CLOSED * BUCKET_SIZE;

/**
 * innerTs para grupos ordenados "por recencia": el evento pasado (deadline o
 * audición) más cercano a hoy va primero. Cuanto menos tiempo hace que pasó,
 * menor es el valor. Acotado a [0, HALF_BUCKET) para no invadir buckets vecinos.
 */
function recencyInnerTs(pastDate: Date | null, today: Date): number {
  if (!pastDate) return HALF_BUCKET - 1;
  const diff = today.getTime() - pastDate.getTime();
  if (Number.isNaN(diff)) return HALF_BUCKET - 1;
  return Math.min(HALF_BUCKET - 1, Math.max(0, diff));
}

/**
 * innerTs para el grupo "ASAP / Always open + TBA": ordena por
 * `content_updated_at` descendente (lo más recién actualizado primero); las
 * audiciones sin `content_updated_at` van al final del grupo.
 */
function openTbaInnerTs(audition: Audition, today: Date): number {
  const updatedMs = audition.content_updated_at
    ? new Date(audition.content_updated_at).getTime()
    : NaN;
  return Number.isNaN(updatedMs)
    ? HALF_BUCKET - 1
    : Math.min(HALF_BUCKET - 1, Math.max(0, today.getTime() - updatedMs));
}

/**
 * Timestamp "de orden" para una audición según la tabla de arriba.
 * Devuelve `null` si la audición no aporta ninguna información utilizable
 * (se considera cerrada / sin datos para "upcoming").
 */
export function getUpcomingTimestampForAudition(
  audition: Audition,
  todayRef?: Date
): number | null {
  const today = todayRef ? atMidnight(new Date(todayRef)) : atMidnight(new Date());

  const deadlineMode = audition.deadline_mode ?? "fixed_date";
  const isOpenEnded = deadlineMode === "asap" || deadlineMode === "always_open";

  // ---- DEADLINE fija (solo "fixed_date" / legacy tienen fecha que puede pasar) ----
  let hasFixedDeadline = false;
  let deadlinePassed = false;
  let deadlineDate: Date | null = null;

  if (!isOpenEnded && audition.deadline_date) {
    const d = atMidnight(new Date(audition.deadline_date));
    if (!Number.isNaN(d.getTime())) {
      hasFixedDeadline = true;
      deadlineDate = d;
      deadlinePassed = d.getTime() < today.getTime();
    }
  }

  // ---- FECHAS DE AUDICIÓN ----
  const earliestFuture = getEarliestFutureAuditionDate(audition, today);
  const latestPast = getLatestPastAuditionDate(audition, today);

  // ===================== DEADLINE ABIERTA (ASAP / Always open) =====================
  if (isOpenEnded) {
    // 2º VERDE: fecha de audición futura -> por esa fecha
    if (earliestFuture) {
      return B_GREEN_OPEN_DATED * BUCKET_SIZE + earliestFuture.getTime();
    }
    // 6º ROJO: solo fechas pasadas -> la más cercana a hoy primero
    if (latestPast) {
      return B_RED_OPEN_PAST * BUCKET_SIZE + recencyInnerTs(latestPast, today);
    }
    // 3º VERDE: TBA / sin fecha -> por content_updated_at desc
    return B_GREEN_OPEN_TBA * BUCKET_SIZE + openTbaInnerTs(audition, today);
  }

  // ===================== DEADLINE FIJA =====================

  // 1º VERDE: deadline futura -> por fecha de deadline (la más próxima primero)
  if (hasFixedDeadline && !deadlinePassed && deadlineDate) {
    return B_GREEN_DEADLINE * BUCKET_SIZE + deadlineDate.getTime();
  }

  // Sin deadline declarada pero con audición futura: la tratamos como abierta (1º).
  if (!hasFixedDeadline && earliestFuture) {
    return B_GREEN_DEADLINE * BUCKET_SIZE + earliestFuture.getTime();
  }

  if (hasFixedDeadline && deadlinePassed) {
    // 4º AMARILLO: deadline pasada + audición futura -> por fecha de audición
    if (earliestFuture) {
      return B_YELLOW_POST_DEADLINE * BUCKET_SIZE + earliestFuture.getTime();
    }
    // 5º ROJO: deadline pasada + (TBA | audición pasada | sin fecha)
    //         -> deadline más cercana a hoy primero
    return B_RED_CLOSED * BUCKET_SIZE + recencyInnerTs(deadlineDate, today);
  }

  // Cualquier otro caso (sin deadline, sin fechas, sin TBA) -> sin información
  return null;
}

/**
 * Devuelve el timestamp "más próximo" de entre las audiciones de una compañía.
 * Las compañías SIN ninguna información de audiciones van al final (NO_INFO_BUCKET).
 */
export function getUpcomingTimestampForCompany(
  company: Company,
  todayRef?: Date
): number {
  const auditions = company.auditions ?? [];
  const today = todayRef ?? new Date();
  atMidnight(today);

  // Compañías sin audiciones -> al final absoluto
  if (!Array.isArray(auditions) || auditions.length === 0) {
    return NO_INFO_BUCKET * BUCKET_SIZE + today.getTime();
  }

  const timestamps = auditions
    .map((a) => getUpcomingTimestampForAudition(a as any, today))
    .filter((ts): ts is number => ts !== null);

  // Ninguna audición tiene información relevante -> al final
  if (!timestamps.length) {
    return NO_INFO_BUCKET * BUCKET_SIZE + today.getTime();
  }

  return Math.min(...timestamps);
}

/**
 * Comparador para usar en .sort() por próximas audiciones.
 * Respeta el orden de la tabla (1º deadline fija futura, 2º ASAP/Always open con
 * fecha, 3º ASAP/Always open TBA, 4º post-deadline amarillo, 5º/6º rojos).
 * Las compañías sin información siempre van al final.
 */
export function compareCompaniesByUpcomingAuditions(
  a: Company,
  b: Company
): number {
  const ta = getUpcomingTimestampForCompany(a);
  const tb = getUpcomingTimestampForCompany(b);
  return ta - tb;
}

/**
 * Filtra compañías que tienen alguna audición "upcoming" (activa, no cerrada).
 * Excluye compañías sin info y las que están en buckets cerrados (5, 6, 99).
 */
export function filterCompaniesByUpcomingAuditions(
  companies: Company[]
): Company[] {
  return companies.filter((c) => getUpcomingTimestampForCompany(c) < CLOSED_THRESHOLD);
}
