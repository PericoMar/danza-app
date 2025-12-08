// types/auditions.ts

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

  email: string | null;
  summary: string | null;
  website_url: string | null;
  location: string | null;
  created_at: string;
  description: string | null;
};

// 4) Resto de tipos igual que antes

export type HeightReq = {
  audition_id: string;
  gender: "male" | "female" | "other";
  min_height_cm: number | null;
  max_height_cm: number | null;
};

export type CompanyMinimal = {
  id: string;
  name: string;
  current_audition_id?: string | null; // si más tarde lo añades
};

export type AuditionFilter = "upcoming" | "deadline_open" | "past" | "all";
