// hooks/useAuditionForm.ts
// Estado del formulario de audición: carga (edición), validación y guardado
// con la RPC `save_audition`. La UI vive en components/auditions/AuditionForm.
import { useEffect, useMemo, useState } from "react";
import { fetchAudition, fetchParticipatingCompanies, saveAudition } from "@/services/auditions";
import { useCompanyMinimal } from "@/hooks/useCompany";
import { CompanyType } from "@/types/company";
import type { ParticipatingCompanySummary, SaveAuditionPayload } from "@/types/audition";
import {
  AgeRangeDraft,
  DeadlineDraft,
  FormErrors,
  HeightDrafts,
  PlaceDefaults,
  ageRangeDraftFrom,
  ageRangeForPayload,
  deadlinesFromAudition,
  emptyDeadline,
  heightDraftsFrom,
  heightsForPayload,
  isValidIsoDate,
  scheduleForPayload,
  todayIsoDate,
  validateAgeRange,
  validateHeights,
  validateSchedule,
} from "@/utils/auditionForm";

export const AUDITION_TEXT_LIMITS = {
  summary: 160,
  email: 120,
  website_url: 160,
  schedule_label: 80,
  description: 3000,
} as const;

export type AuditionTextFields = Record<keyof typeof AUDITION_TEXT_LIMITS, string>;

const EMPTY_TEXT: AuditionTextFields = {
  summary: "",
  email: "",
  website_url: "",
  schedule_label: "",
  description: "",
};

type Feedback = { type: "success" | "error"; message: string } | null;

export function useAuditionForm(companyId: string, auditionId?: string) {
  const isEdit = !!auditionId;

  // Solo relevante cuando la compañía dueña es de tipo 'events': permite
  // relacionar la audición con las compañías participantes.
  const { company } = useCompanyMinimal(companyId);
  const isEventsCompany = company?.type === CompanyType.EVENTS;
  const placeDefaults: PlaceDefaults = useMemo(
    () => ({ place: company?.location ?? "", country_iso_code: company?.country_iso_code ?? "" }),
    [company?.location, company?.country_iso_code]
  );

  const [text, setText] = useState<AuditionTextFields>(EMPTY_TEXT);
  const [isActive, setIsActive] = useState(true);
  const [deadlines, setDeadlines] = useState<DeadlineDraft[]>([]);
  const [heights, setHeights] = useState<HeightDrafts>(heightDraftsFrom());
  const [ageRange, setAgeRange] = useState<AgeRangeDraft>(ageRangeDraftFrom());
  const [participatingCompanies, setParticipatingCompanies] = useState<ParticipatingCompanySummary[]>([]);

  // "Última actualización de la información" (manual, se muestra en el front).
  // Marcada por defecto: al guardar se sella con la fecha indicada. Si se
  // desmarca, no se toca content_updated_at (correcciones internas).
  const [markContentUpdate, setMarkContentUpdate] = useState(true);
  const [contentUpdatedDate, setContentUpdatedDate] = useState(todayIsoDate());

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Alta: un primer deadline con una fecha, ya con el lugar de la compañía.
  useEffect(() => {
    if (isEdit || !company) return;
    setDeadlines((prev) => (prev.length ? prev : [emptyDeadline(placeDefaults)]));
  }, [isEdit, company, placeDefaults]);

  useEffect(() => {
    if (!auditionId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFeedback(null);
      try {
        const audition = await fetchAudition(auditionId);
        if (cancelled) return;
        if (!audition) {
          setFeedback({ type: "error", message: "Audition not found." });
          return;
        }
        setText({
          summary: audition.summary ?? "",
          email: audition.email ?? "",
          website_url: audition.website_url ?? "",
          schedule_label: audition.schedule_label ?? "",
          description: audition.description ?? "",
        });
        setIsActive(audition.is_active);
        setDeadlines(deadlinesFromAudition(audition));
        setHeights(heightDraftsFrom(audition.height_requirements));
        setAgeRange(ageRangeDraftFrom(audition));
        setContentUpdatedDate(audition.content_updated_at?.slice(0, 10) ?? todayIsoDate());
      } catch (e: any) {
        if (!cancelled) setFeedback({ type: "error", message: e.message ?? "Error loading audition." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auditionId]);

  useEffect(() => {
    if (!auditionId || !isEventsCompany) return;
    fetchParticipatingCompanies(auditionId)
      .then(setParticipatingCompanies)
      .catch((e: any) =>
        setFeedback({ type: "error", message: e.message ?? "Error loading participating companies." })
      );
  }, [auditionId, isEventsCompany]);

  function validate(): boolean {
    const e: FormErrors = { ...validateSchedule(deadlines), ...validateAgeRange(ageRange) };
    for (const key of Object.keys(AUDITION_TEXT_LIMITS) as (keyof AuditionTextFields)[]) {
      if (text[key].length > AUDITION_TEXT_LIMITS[key]) e[key] = `Max ${AUDITION_TEXT_LIMITS[key]} chars.`;
    }
    if (markContentUpdate && !isValidIsoDate(contentUpdatedDate)) e.content_updated_at = "Use YYYY-MM-DD";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /** Guarda la audición; devuelve true si ha ido bien. */
  async function save(): Promise<boolean> {
    if (!validate()) {
      setFeedback({ type: "error", message: "Check the highlighted fields." });
      return false;
    }
    const heightError = validateHeights(heights);
    if (heightError) {
      setFeedback({ type: "error", message: heightError });
      return false;
    }

    const payload: SaveAuditionPayload = {
      id: auditionId ?? null,
      company_id: companyId,
      email: text.email || null,
      summary: text.summary || null,
      website_url: text.website_url || null,
      description: text.description || null,
      schedule_label: text.schedule_label || null,
      is_active: isActive,
      ...(markContentUpdate
        ? { content_updated_at: new Date(`${contentUpdatedDate}T12:00:00`).toISOString() }
        : {}),
      deadlines: scheduleForPayload(deadlines),
      height_requirements: heightsForPayload(heights),
      ...ageRangeForPayload(ageRange),
      ...(isEventsCompany ? { participating_company_ids: participatingCompanies.map((c) => c.id) } : {}),
    };

    setSaving(true);
    setFeedback(null);
    try {
      await saveAudition(payload);
      setFeedback({ type: "success", message: isEdit ? "Audition updated!" : "Audition created!" });
      return true;
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message ?? "Unexpected error." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    isEdit,
    isEventsCompany,
    placeDefaults,
    text,
    setTextField: <K extends keyof AuditionTextFields>(key: K, value: string) =>
      setText((prev) => ({ ...prev, [key]: value })),
    isActive,
    setIsActive,
    deadlines,
    setDeadlines,
    heights,
    setHeights,
    ageRange,
    setAgeRange,
    participatingCompanies,
    setParticipatingCompanies,
    markContentUpdate,
    setMarkContentUpdate,
    contentUpdatedDate,
    setContentUpdatedDate,
    errors,
    loading,
    saving,
    feedback,
    save,
  };
}
