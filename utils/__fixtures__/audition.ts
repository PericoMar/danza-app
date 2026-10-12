import type { Audition } from "@/types/audition";

/** Audición mínima para tests; `overrides` fija solo lo que importa al caso. */
export function audition(id: string, overrides: Partial<Audition> = {}): Audition {
  return {
    id,
    company_id: "company-1",
    deadline_date: null,
    audition_date: null,
    deadline_mode: "fixed_date",
    audition_schedule_mode: "single_date",
    audition_schedule_note: null,
    audition_schedule_entries: null,
    email: null,
    summary: null,
    website_url: null,
    location: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    content_updated_at: null,
    description: null,
    is_active: true,
    ...overrides,
  };
}
