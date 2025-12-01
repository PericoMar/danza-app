// services/auditions.ts
import { supabase } from "@/services/supabase";
import { Audition, HeightReq, CompanyMinimal, AuditionFilter } from "@/types/audition";

export async function fetchCompanyMinimal(companyId: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, current_audition_id")
    .eq("id", companyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as CompanyMinimal | null;
}

function todayYYYYMMDD() {
  const d = new Date();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export async function fetchAuditionsByCompany(companyId: string, filter: AuditionFilter) {
  const todayStr = todayYYYYMMDD();
  let q = supabase.from("auditions").select("*").eq("company_id", companyId);

  if (filter === "upcoming") {
    q = q.gte("audition_date", todayStr).order("audition_date", { ascending: true });
  } else if (filter === "deadline_open") {
    q = q.gte("deadline_date", todayStr).order("deadline_date", { ascending: true });
  } else if (filter === "past") {
    q = q.lt("audition_date", todayStr).order("audition_date", { ascending: false });
  } else {
    q = q.order("audition_date", { ascending: true, nullsFirst: true });
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Audition[];
}

export async function fetchHeightsForAuditions(auditionIds: string[]) {
  if (!auditionIds.length) return {} as Record<string, HeightReq[]>;
  const { data, error } = await supabase
    .from("audition_height_requirements")
    .select("audition_id, gender, min_height_cm, max_height_cm")
    .in("audition_id", auditionIds);

  if (error) throw new Error(error.message);

  const map: Record<string, HeightReq[]> = {};
  (data ?? []).forEach((r: any) => {
    const key = r.audition_id as string;
    if (!map[key]) map[key] = [];
    map[key].push({
      audition_id: r.audition_id,
      gender: r.gender,
      min_height_cm: r.min_height_cm,
      max_height_cm: r.max_height_cm,
    });
  });
  return map;
}

// Carga una audición + sus requisitos de altura
export async function fetchAuditionWithHeights(auditionId: string) {
  const { data: a, error } = await supabase
    .from("auditions")
    .select("*")
    .eq("id", auditionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!a) return { audition: null, heights: [] as HeightReq[] };

  const { data: heights, error: herr } = await supabase
    .from("audition_height_requirements")
    .select("audition_id, gender, min_height_cm, max_height_cm")
    .eq("audition_id", auditionId);

  if (herr) throw new Error(herr.message);

  return { audition: a as Audition, heights: (heights ?? []) as HeightReq[] };
}

// Crea/actualiza audición
export async function upsertAudition(row: Partial<Audition> & { company_id: string }) {
  // si viene id => update; si no => insert
  const toNullableDate = (value?: string | null) =>
    value && value.trim() !== "" ? value : null;

  const payload = {
    ...row,
    audition_date: toNullableDate(row.audition_date),
    deadline_date: toNullableDate(row.deadline_date),
  };

  const q = row.id
    ? supabase.from("auditions").update(payload).eq("id", row.id).select().single()
    : supabase.from("auditions").insert(payload).select().single();

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as Audition;
}

// Reemplaza por completo los requisitos de altura de una audición
export async function replaceHeightRequirements(auditionId: string, list: HeightReq[]) {
  // borra y re-inserta
  const { error: delErr } = await supabase
    .from("audition_height_requirements")
    .delete()
    .eq("audition_id", auditionId);

  if (delErr) throw new Error(delErr.message);

  if (!list.length) return;

  const { error: insErr } = await supabase
    .from("audition_height_requirements")
    .insert(
      list.map((r) => ({
        audition_id: auditionId,
        gender: r.gender,
        min_height_cm: r.min_height_cm ?? null,
        max_height_cm: r.max_height_cm ?? null,
      }))
    );

  if (insErr) throw new Error(insErr.message);
}


// Borra una audición y sus requisitos de altura
export async function deleteAudition(auditionId: string) {
  // Si tu FK no tiene ON DELETE CASCADE, borramos manualmente requisitos primero
  const { error: delReqErr } = await supabase
    .from("audition_height_requirements")
    .delete()
    .eq("audition_id", auditionId);

  if (delReqErr) throw new Error(delReqErr.message);

  const { error: delAudErr } = await supabase
    .from("auditions")
    .delete()
    .eq("id", auditionId);

  if (delAudErr) throw new Error(delAudErr.message);

  return true;
}