import { AuditionDateFormat, AuditionStatus } from "@/types/audition";
import type { Audition, AuditionDate, AuditionDeadline } from "@/types/audition";

/** Audición mínima para tests; `overrides` fija solo lo que importa al caso. */
export function audition(id: string, overrides: Partial<Audition> = {}): Audition {
  return {
    id,
    company_id: "company-1",
    email: null,
    summary: null,
    website_url: null,
    description: null,
    schedule_label: null,
    is_active: true,
    content_updated_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    deadlines: [],
    height_requirements: [],
    application_links: [],
    min_age: null,
    max_age: null,
    status: AuditionStatus.PAST,
    next_deadline_date: null,
    next_audition_date: null,
    last_audition_end_date: null,
    ...overrides,
  };
}

/** Fecha de audición de un día (o un rango con `end_date`) presencial. */
export function auditionDate(id: string, start: string, overrides: Partial<AuditionDate> = {}): AuditionDate {
  return {
    id,
    start_date: start,
    end_date: start,
    format: AuditionDateFormat.IN_PERSON,
    place: "Madrid, Spain",
    country_iso_code: "ES",
    date_label: null,
    notes: null,
    ...overrides,
  };
}

export function deadline(
  id: string,
  date: string,
  dates: AuditionDate[],
  overrides: Partial<AuditionDeadline> = {}
): AuditionDeadline {
  return { id, date, date_label: null, notes: null, dates, ...overrides };
}

/**
 * Atajos por estado: una deadline y una fecha de audición reales (sin label) en
 * la fecha dada, y las fechas clave que calcularía la vista.
 */
const realSchedule = (id: string, date: string) => [deadline(`${id}-d`, date, [auditionDate(`${id}-x`, date)])];

export const openCall = (id: string, nextDeadline: string, overrides: Partial<Audition> = {}) =>
  audition(id, {
    status: AuditionStatus.OPEN_CALL,
    deadlines: realSchedule(id, nextDeadline),
    next_deadline_date: nextDeadline,
    next_audition_date: nextDeadline,
    last_audition_end_date: nextDeadline,
    ...overrides,
  });

export const postDeadline = (id: string, nextAudition: string, overrides: Partial<Audition> = {}) =>
  audition(id, {
    status: AuditionStatus.POST_DEADLINE,
    deadlines: realSchedule(id, nextAudition),
    next_audition_date: nextAudition,
    last_audition_end_date: nextAudition,
    ...overrides,
  });

export const past = (id: string, lastEnd: string, overrides: Partial<Audition> = {}) =>
  audition(id, {
    status: AuditionStatus.PAST,
    deadlines: realSchedule(id, lastEnd),
    last_audition_end_date: lastEnd,
    ...overrides,
  });
