export type AuditionListItem = {
  id: string;
  company_id: string;
  company_name: string;              // viene de companies
  summary: string | null;
  location: string | null;           // usamos la de audition
  audition_date: string | null;      // YYYY-MM-DD (date)
  deadline_date: string | null;      // YYYY-MM-DD (date)
  website_url: string | null;
};

// types/auditions.ts
export type Audition = {
  id: string;
  company_id: string;
  deadline_date: string | null;
  audition_date: string | null;
  email: string | null;
  summary: string | null;
  website_url: string | null;
  location: string | null;
  created_at: string;
  description: string | null;
};

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

