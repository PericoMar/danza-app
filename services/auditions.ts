// services/auditions.ts
import { supabase } from "@/services/supabase";
import { AUDITION_COMPANY_EMBED, RPC, TABLES, VIEWS } from "@/constants/tables";
import {
  Audition,
  AuditionStatus,
  AuditionWithCompany,
  CompanyMinimal,
  ParticipatingCompanySummary,
  SaveAuditionPayload,
} from "@/types/audition";

export async function fetchCompanyMinimal(companyId: string) {
  const { data, error } = await supabase
    .from(TABLES.COMPANIES)
    .select("id, name, type, location, country_iso_code")
    .eq("id", companyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as CompanyMinimal | null;
}

// Busca compañías por nombre (para el selector de compañías participantes)
export async function searchCompaniesByName(query: string, excludeCompanyId?: string) {
  let q = supabase
    .from(TABLES.COMPANIES)
    .select("id, name, image")
    .order("name", { ascending: true })
    .limit(20);

  if (query.trim()) q = q.ilike("name", `%${query.trim()}%`);
  if (excludeCompanyId) q = q.neq("id", excludeCompanyId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as ParticipatingCompanySummary[];
}

// Audiciones de una compañía con su calendario, alturas y estado.
export async function fetchAuditionsByCompany(companyId: string) {
  const { data, error } = await supabase
    .from(VIEWS.AUDITIONS_ENRICHED)
    .select("*")
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
  return (data ?? []) as Audition[];
}

export async function fetchAudition(auditionId: string) {
  const { data, error } = await supabase
    .from(VIEWS.AUDITIONS_ENRICHED)
    .select("*")
    .eq("id", auditionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as Audition | null;
}

// Audiciones vivas (activas y no pasadas) de cualquier compañía, sin orden: el
// orden de relevancia se aplica en el cliente (utils/auditions).
export async function fetchLiveAuditions() {
  const { data, error } = await supabase
    .from(VIEWS.AUDITIONS_ENRICHED)
    .select(`*, company:${AUDITION_COMPANY_EMBED}(name)`)
    .eq("is_active", true)
    .in("status", [AuditionStatus.OPEN_CALL, AuditionStatus.POST_DEADLINE]);

  if (error) throw new Error(error.message);
  return (data ?? []).map(({ company, ...audition }: any) => ({
    ...audition,
    company_name: company?.name ?? "—",
  })) as AuditionWithCompany[];
}

/**
 * Guarda la audición completa (datos, deadlines, fechas, alturas y
 * participantes) en una sola transacción. Devuelve su id.
 */
export async function saveAudition(payload: SaveAuditionPayload) {
  const { data, error } = await supabase.rpc(RPC.SAVE_AUDITION, { p: payload });
  if (error) throw new Error(error.message);
  return data as string;
}

// Compañías participantes de una audición organizada por una compañía de tipo 'events'
export async function fetchParticipatingCompanies(auditionId: string) {
  const { data, error } = await supabase
    .from(TABLES.AUDITION_PARTICIPATING_COMPANIES)
    .select("companies(id, name, image)")
    .eq("audition_id", auditionId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((r: any) => r.companies)
    .filter(Boolean) as ParticipatingCompanySummary[];
}

// Borra una audición; deadlines, fechas, alturas y participantes caen en cascada.
export async function deleteAudition(auditionId: string) {
  const { error } = await supabase.from(TABLES.AUDITIONS).delete().eq("id", auditionId);

  if (error) throw new Error(error.message);

  return true;
}
