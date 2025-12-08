// utils/auditions.ts

import { Company } from "@/hooks/useCompanies";
import { Audition, AuditionScheduleEntry } from "@/types/audition";

type Status = {
  label: string;
  textColor: string;
  bgColor: string;
};

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

  // 1,2,3) Deadline NO pasada (fixed, ASAP o Always open) + audition no pasada (o TBA) -> Verde
  if (!deadlinePassed) {
    // "audition no pasada": o hay futura, o es to_be_arranged (sin fecha todavía)
    if (hasFutureAudition || scheduleMode === "to_be_arranged") {
      return green;
    }

    // Deadline no pasada pero todas las fechas de audition son pasadas (dato raro) -> tratamos como past audition
    if (allAuditionsPast) {
      return redPast;
    }

    // Sin fechas ni TBA, pero con deadline futura -> abierto
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

const BUCKET_SIZE = 10 ** 13;

/**
 * Timestamp “de orden” para una audición que sigue activa/relevante
 * según la tabla de filtros del cliente.
 * Si devuelve null, esa audición se considera cerrada para "upcoming".
 *
 * Filtros cliente:
 * 1º Deadline NO pasada
 * 2º Deadline date: ASAP, audition no pasada
 * 3º Deadline date: Always open, audition no pasada
 * 4º Deadline pasada, auditions NO pasadas todas
 * 5º Deadline pasada y audition to be arranged
 * 6º Deadline pasada, audition pasada
 */
export function getUpcomingTimestampForAudition(
  audition: Audition,
  todayRef?: Date
): number | null {
  const today = todayRef ? atMidnight(new Date(todayRef)) : atMidnight(new Date());

  const deadlineMode = audition.deadline_mode ?? "fixed_date";
  const scheduleMode = audition.audition_schedule_mode ?? "single_date";

  // ---- DEADLINE ----
  let hasDeadline = false;
  let deadlinePassed = false;
  let deadlineDate: Date | null = null;

  if (deadlineMode === "fixed_date") {
    if (audition.deadline_date) {
      hasDeadline = true;
      const d = atMidnight(new Date(audition.deadline_date));
      deadlineDate = d;
      deadlinePassed = d.getTime() < today.getTime();
    }
  } else if (deadlineMode === "asap" || deadlineMode === "always_open") {
    hasDeadline = true;
    deadlinePassed = false; // ASAP / Always open no "pasan" como tal
  } else if (audition.deadline_date) {
    // legacy: sin modo pero con fecha
    hasDeadline = true;
    const d = atMidnight(new Date(audition.deadline_date));
    deadlineDate = d;
    deadlinePassed = d.getTime() < today.getTime();
  }

  const earliestFutureAuditionDate = getEarliestFutureAuditionDate(audition, today);
  const hasFutureAudition = !!earliestFutureAuditionDate;

  // ---- APLICAMOS LA TABLA EN ORDEN ----

  // 1º Deadline NO pasada (fecha fija futura)
  if (
    hasDeadline &&
    !deadlinePassed &&
    (deadlineMode === "fixed_date" || (!deadlineMode && deadlineDate))
  ) {
    if (!deadlineDate) return null; // por seguridad
    const innerTs = deadlineDate.getTime();
    return 1 * BUCKET_SIZE + innerTs;
  }

  // Caso especial: NO hay deadline, pero sí audition futura -> las tratamos
  // como "1º" porque tienen fecha concreta (mejor que ASAP/Always open).
  if (!hasDeadline && hasFutureAudition && earliestFutureAuditionDate) {
    const innerTs = earliestFutureAuditionDate.getTime();
    return 1 * BUCKET_SIZE + innerTs;
  }

  // 2º Deadline date: ASAP, audition no pasada
  if (
    deadlineMode === "asap" &&
    !deadlinePassed && // por consistencia, aunque para ASAP siempre es false
    (hasFutureAudition || scheduleMode === "to_be_arranged")
  ) {
    const innerTs =
      (earliestFutureAuditionDate ?? today).getTime();
    return 2 * BUCKET_SIZE + innerTs;
  }

  // 3º Deadline date: Always open, audition no pasada
  if (
    deadlineMode === "always_open" &&
    !deadlinePassed &&
    (hasFutureAudition || scheduleMode === "to_be_arranged")
  ) {
    const innerTs =
      (earliestFutureAuditionDate ?? today).getTime();
    return 3 * BUCKET_SIZE + innerTs;
  }

  // A partir de aquí: deadline pasada (solo sentido si hay fecha fija)
  if (deadlinePassed) {
    // 4º Deadline pasada, auditions NO pasadas todas (hay alguna futura)
    if (hasFutureAudition && earliestFutureAuditionDate) {
      const innerTs = earliestFutureAuditionDate.getTime();
      return 4 * BUCKET_SIZE + innerTs;
    }

    // 5º Deadline pasada y audition to be arranged -> closed (fuera del upcoming)
    if (scheduleMode === "to_be_arranged") {
      return null;
    }

    // 6º Deadline pasada, audition pasada -> closed (fuera del upcoming)
    return null;
  }

  // Cualquier otro caso raro (sin deadline, sin futuras, sin TBA) -> fuera
  return null;
}

/**
 * Devuelve el timestamp "más próximo" de entre las audiciones de una compañía
 * o null si ninguna entra en el filtro de upcoming.
 */
export function getUpcomingTimestampForCompany(
  company: Company,
  todayRef?: Date
): number | null {
  const auditions = company.auditions ?? [];
  if (!Array.isArray(auditions) || auditions.length === 0) return null;

  const today = todayRef ?? new Date();
  atMidnight(today);

  const timestamps = auditions
    .map((a) => getUpcomingTimestampForAudition(a as any, today))
    .filter((ts): ts is number => ts !== null);

  if (!timestamps.length) return null;
  return Math.min(...timestamps);
}

/**
 * Comparador para usar en .sort() por próximas audiciones.
 * Respeta el orden de la tabla (1º deadline con fecha, 2º ASAP, 3º Always open, 4º post-deadline...).
 */
export function compareCompaniesByUpcomingAuditions(
  a: Company,
  b: Company
): number {
  const ta = getUpcomingTimestampForCompany(a);
  const tb = getUpcomingTimestampForCompany(b);

  if (ta === null && tb === null) return 0;
  if (ta === null) return 1;
  if (tb === null) return -1;
  return ta - tb;
}

/**
 * Filtra compañías que tienen alguna audición "upcoming" según la lógica anterior.
 */
export function filterCompaniesByUpcomingAuditions(
  companies: Company[]
): Company[] {
  return companies.filter((c) => getUpcomingTimestampForCompany(c) !== null);
}
