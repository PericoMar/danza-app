// types/auditions.ts
import type { CompanyType } from "./company";

// 1) Tipos auxiliares para modos y JSON

export type DeadlineMode = "fixed_date" | "asap" | "always_open";

export type AuditionScheduleMode =
  | "single_date"
  | "to_be_arranged"
  | "various_dates";

export type AuditionScheduleEntry = {
  date: string;            // 'YYYY-MM-DD'
  label?: string;          // texto corto opcional
  extra_info?: string | null; // detalles extra opcionales
};

export type AuditionGender = "male" | "female" | "other";

// Género al que queda restringida una audición cuando solo admite uno.
export type AuditionGenderRestriction = Exclude<AuditionGender, "other">;

// Requisito de altura/género embebido en cada audición por la vista
// `companies_enriched` (sin `audition_id`, a diferencia de `HeightReq`).
// Semántica: sin filas => audición abierta a todos; con filas => restringida
// a esos géneros.
export type AuditionHeightRequirement = {
  gender: AuditionGender;
  min_height_cm: number | null;
  max_height_cm: number | null;
};

// 2) List item (lo que usas en listados / landing)

export type AuditionListItem = {
  id: string;
  company_id: string;
  company_name: string;      // viene de companies
  summary: string | null;
  location: string | null;   // usamos la de audition

  // Fechas "clásicas"
  audition_date: string | null;  // YYYY-MM-DD (date) - solo para 'single_date'
  deadline_date: string | null;  // YYYY-MM-DD (date) - solo para 'fixed_date'

  website_url: string | null;

  // Nuevos modos
  deadline_mode: DeadlineMode;
  audition_schedule_mode: AuditionScheduleMode;

  // Campos extra según el modo
  audition_schedule_note: string | null;           // para 'to_be_arranged'
  audition_schedule_entries: AuditionScheduleEntry[] | null; // para 'various_dates'

  // Requisitos de altura/género (vía companies_enriched)
  height_requirements?: AuditionHeightRequirement[] | null;
};

// 3) Detalle completo (pantalla de audition)

export type Audition = {
  id: string;
  company_id: string;

  // Fechas "clásicas"
  deadline_date: string | null;
  audition_date: string | null;

  // Nuevos modos
  deadline_mode: DeadlineMode;
  audition_schedule_mode: AuditionScheduleMode;

  // Campos extra según el modo
  audition_schedule_note: string | null;
  audition_schedule_entries: AuditionScheduleEntry[] | null;

  // Requisitos de altura/género (vía companies_enriched)
  height_requirements?: AuditionHeightRequirement[] | null;

  email: string | null;
  summary: string | null;
  website_url: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;            // automático: cualquier UPDATE en la fila
  content_updated_at: string | null; // manual: última actualización real de la información (se muestra en el front)
  description: string | null;
  is_active: boolean; // manual: si es false la audición no se muestra en la página de la compañía
};

// 4) Resto de tipos igual que antes

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

export type CompanyMinimal = {
  id: string;
  name: string;
  type: CompanyType;
  current_audition_id?: string | null; // si más tarde lo añades
};
