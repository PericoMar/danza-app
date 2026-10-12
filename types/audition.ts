// types/audition.ts
// Modelo del calendario de una audición (docs/adr/0001-audition-schedule-tree.md):
// una audición tiene 1-N deadlines y cada deadline 1-N fechas de audición.
import type { CompanyType } from "./company";

// Estado derivado en la vista `auditions_enriched` (enum `audition_status`).
export const AuditionStatus = {
  OPEN_CALL: "open_call",
  POST_DEADLINE: "post_deadline",
  PAST: "past",
} as const;

export type AuditionStatus = (typeof AuditionStatus)[keyof typeof AuditionStatus];

// Formato de una fecha de audición (enum `audition_date_format`).
export const AuditionDateFormat = {
  IN_PERSON: "in_person",
  ONLINE: "online",
} as const;

export type AuditionDateFormat = (typeof AuditionDateFormat)[keyof typeof AuditionDateFormat];

export const AUDITION_DATE_FORMAT_OPTIONS: { value: AuditionDateFormat; label: string }[] = [
  { value: AuditionDateFormat.IN_PERSON, label: "In person" },
  { value: AuditionDateFormat.ONLINE, label: "Online" },
];

export type AuditionGender = "male" | "female" | "other";

// Género al que queda restringida una audición cuando solo admite uno.
export type AuditionGenderRestriction = Exclude<AuditionGender, "other">;

// Requisito de altura/género embebido en cada audición por las vistas
// (sin `audition_id`, a diferencia de `HeightReq`).
// Semántica: sin filas => audición abierta a todos; con filas => restringida
// a esos géneros.
export type AuditionHeightRequirement = {
  gender: AuditionGender;
  min_height_cm: number | null;
  max_height_cm: number | null;
};

/**
 * Un día o un rango de hasta 60 días (start = end para un solo día) en un
 * lugar. `date_label`, si existe, se muestra en lugar de las fechas; `notes`
 * se muestra junto a ellas.
 */
export type AuditionDate = {
  id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  format: AuditionDateFormat;
  place: string;
  country_iso_code: string | null; // null si es online
  date_label: string | null;
  notes: string | null;
};

/** Último día para apuntarse a las fechas que cuelgan de ella. */
export type AuditionDeadline = {
  id: string;
  date: string; // YYYY-MM-DD
  date_label: string | null; // se muestra en lugar de la fecha ("ASAP")
  notes: string | null;
  dates: AuditionDate[]; // ordenadas por inicio
};

/** Una fila de `auditions_enriched` (también cada audición de `companies_enriched`). */
export type Audition = {
  id: string;
  company_id: string;
  email: string | null;
  summary: string | null;
  website_url: string | null;
  description: string | null;
  schedule_label: string | null; // resumen que sustituye la lista de fechas en las cards
  is_active: boolean; // manual: si es false la audición no se muestra en la página de la compañía
  content_updated_at: string | null; // manual: última actualización real de la información (se muestra en el front)
  created_at: string;
  updated_at: string; // automático: cualquier UPDATE en la fila

  deadlines: AuditionDeadline[]; // ordenadas por fecha
  height_requirements: AuditionHeightRequirement[];

  // Derivados en la vista a partir de las fechas ("hoy" = fecha UTC).
  status: AuditionStatus;
  next_deadline_date: string | null; // deadline más próxima de hoy en adelante
  next_audition_date: string | null; // inicio de la primera fecha que aún no ha terminado
  last_audition_end_date: string | null;
};

/** Audición con el nombre de su compañía (listados fuera de la ficha de compañía). */
export type AuditionWithCompany = Audition & { company_name: string };

/** Payload de la RPC `save_audition`: la audición completa en una sola escritura. */
export type SaveAuditionPayload = {
  id: string | null; // null => alta
  company_id: string;
  email: string | null;
  summary: string | null;
  website_url: string | null;
  description: string | null;
  schedule_label: string | null;
  is_active: boolean;
  content_updated_at?: string; // omitido => se conserva (edición) / now() (alta)
  deadlines: {
    id?: string;
    date: string;
    date_label: string | null;
    notes: string | null;
    dates: {
      id?: string;
      start_date: string;
      end_date: string;
      format: AuditionDateFormat;
      place: string | null; // null => el de la compañía (presencial) / "Online"
      country_iso_code: string | null;
      date_label: string | null;
      notes: string | null;
    }[];
  }[];
  height_requirements?: AuditionHeightRequirement[]; // omitido => no se tocan
  participating_company_ids?: string[]; // omitido => no se tocan
};

export type HeightReq = AuditionHeightRequirement & {
  audition_id: string;
};

// Compañías participantes de una audición organizada por una compañía de
// tipo 'events' (relación muchos-a-muchos vía `audition_participating_companies`).
export type AuditionParticipatingCompany = {
  audition_id: string;
  company_id: string;
};

// Slice mínimo para pintar el listado de participantes (nombre + logo).
export type ParticipatingCompanySummary = {
  id: string;
  name: string;
  image: string | null;
};

// Lo que el formulario de audición necesita de la compañía dueña: el tipo
// (participantes) y su lugar/país (valores por defecto de las fechas presenciales).
export type CompanyMinimal = {
  id: string;
  name: string;
  type: CompanyType;
  location: string | null;
  country_iso_code: string | null;
};
