// hooks/useAuditions.ts
import { useEffect, useState } from "react";
import type { Audition } from "@/types/audition";
import { supabase } from "@/services/supabase";

export function useAuditions(limit = 5) {
  const [data, setData] = useState<Audition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (limit <= 0) return; // consumer provided explicit data; skip fetch
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        // Assuming a table "auditions" with columns:
        // id (uuid/text), company (text), city (text), dateISO (timestamptz), url (text)
        const todayISO = new Date().toISOString();

        const { data: rows, error } = await supabase
          .from("auditions")
          .select("id, company, city, dateISO, url")
          .gte("dateISO", todayISO)
          .order("dateISO", { ascending: true })
          .limit(limit);

        if (error) throw error;

        if (!cancelled) {
          setData((rows ?? []) as Audition[]);
        }
      } catch (e: any) {
        console.warn("useAuditions:", e?.message || e);
        if (!cancelled) {
          setError(e?.message || "Failed to load auditions");
          // Fallback demo data (keeps UI working in dev / empty DB)
          setData([
            { id: "fallback-1", company: "National Ballet", city: "Amsterdam, NL", dateISO: "2025-11-03", url: "#" },
            { id: "fallback-2", company: "Opera House Ballet", city: "Zurich, CH", dateISO: "2025-11-10", url: "#" },
            { id: "fallback-3", company: "Med Theatre Co.", city: "Valencia, ES", dateISO: "2025-11-21", url: "#" },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { data, loading, error };
}
