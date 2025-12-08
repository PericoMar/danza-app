// hooks/useAuditions.ts
import { useEffect, useState } from "react";
import type { AuditionListItem } from "@/types/audition";
import { supabase } from "@/services/supabase";

function todayYYYYMMDD() {
  const d = new Date();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Próximas audiciones (audition_date >= hoy) con nombre de compañía.
 */
export function useAuditions(limit = 5) {
  const [data, setData] = useState<AuditionListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (limit <= 0) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const today = todayYYYYMMDD();

        // Nota: requiere FK auditions.company_id -> companies.id
        // Ajusta "name" si tu columna se llama distinto (p.ej. "company_name" o "title").
        const { data: rows, error } = await supabase
          .from("auditions")
          .select(`
            id,
            company_id,
            audition_date,
            deadline_date,
            website_url,
            summary,
            location,
            description,
            companies:company_id (
              name
            )
          `)
          .not("audition_date", "is", null)
          .gte("audition_date", today)
          .order("audition_date", { ascending: true })
          .limit(limit);

        if (error) throw error;

        const mapped: AuditionListItem[] = (rows ?? []).map((r: any) => ({
          id: String(r.id),
          company_id: r.company_id ?? "",
          company_name: r?.companies?.name ?? "—",
          summary: r.summary ?? null,
          location: r.location ?? null,
          audition_date: r.audition_date ?? null,
          deadline_date: r.deadline_date ?? null,
          website_url: r.website_url ?? null,
          deadline_mode: r.deadline_mode ?? "fixed_date",
          audition_schedule_mode: r.audition_schedule_mode ?? "single_date",
          audition_schedule_note: r.audition_schedule_note ?? null,
          audition_schedule_entries: r.audition_schedule_entries ?? null,
        }));

        if (!cancelled) setData(mapped);
      } catch (e: any) {
        console.warn("useAuditions:", e?.message || e);
        if (!cancelled) {
          setError(e?.message || "Failed to load auditions");
           setData([
            {
              id: "fallback-1",
              company_id: "demo",
              company_name: "National Ballet",
              summary: "Season casting",
              location: "Amsterdam, NL",
              audition_date: "2025-11-03",
              deadline_date: "2025-10-25",
              website_url: "#",
              deadline_mode: "fixed_date",
              audition_schedule_mode: "single_date",
              audition_schedule_note: null,
              audition_schedule_entries: null,
            },
            {
              id: "fallback-2",
              company_id: "demo",
              company_name: "Opera House Ballet",
              summary: "Winter program",
              location: "Zurich, CH",
              audition_date: "2025-11-10",
              deadline_date: "2025-10-30",
              website_url: "#",
              deadline_mode: "fixed_date",
              audition_schedule_mode: "single_date",
              audition_schedule_note: null,
              audition_schedule_entries: null,
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { data, loading, error };
}
