import { useCallback, useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { EMPTY_PROFILE, isSameProfile, type ProfileFields } from "@/services/profile";
import { SAVE_STATUS, type SaveStatus } from "@/types/profile";
import { SAVE_SUCCESS_VISIBLE_MS } from "@/constants/profile";

type SaveOutcome = typeof SAVE_STATUS.SAVED | typeof SAVE_STATUS.ERROR;

/**
 * Draft state for the /profile form: starts from the stored profile, tracks
 * whether anything changed, and saves through `useProfile`.
 */
export function useProfileForm() {
  const { email, profile, isLoading, loadError, save } = useProfile();
  const [values, setValues] = useState<ProfileFields>(EMPTY_PROFILE);
  // Tracked locally (not via the mutation's isPending) so the switch from
  // "saving" to "saved" lands in a single render.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);
  // What the last save stored, used as the "clean" reference until the query
  // cache's new profile reaches this hook (React Query notifies a tick later).
  const [lastSaved, setLastSaved] = useState<ProfileFields | null>(null);

  // The green confirmation is temporary.
  useEffect(() => {
    if (outcome !== SAVE_STATUS.SAVED) return;
    const timer = setTimeout(() => setOutcome(null), SAVE_SUCCESS_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [outcome]);

  // Adopt fresh server data (first load, background refetch) only while the
  // draft still matches what it was seeded from — never clobber typing.
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const seededFromRef = useRef<ProfileFields | null>(null);

  useEffect(() => {
    if (!profile) return;
    setLastSaved(null);
    const seededFrom = seededFromRef.current;
    const hasEdits = seededFrom !== null && !isSameProfile(valuesRef.current, seededFrom);
    seededFromRef.current = profile;
    if (!hasEdits) setValues(profile);
  }, [profile]);

  const setField = useCallback((key: keyof ProfileFields, value: string) => {
    setOutcome(null);
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isDirty = !!profile && !isSameProfile(values, lastSaved ?? profile);
  const nameError = values.name.trim() ? null : "First name is required.";
  const canSave = isDirty && !nameError && !isSubmitting;

  const saveStatus: SaveStatus = isSubmitting
    ? SAVE_STATUS.SAVING
    : outcome === SAVE_STATUS.ERROR && isDirty
      ? SAVE_STATUS.ERROR
      : isDirty
        ? SAVE_STATUS.DIRTY
        : outcome === SAVE_STATUS.SAVED
          ? SAVE_STATUS.SAVED
          : SAVE_STATUS.CLEAN;

  const submit = useCallback(async () => {
    if (!canSave) return;
    setOutcome(null);
    setIsSubmitting(true);
    try {
      // Show what was actually stored (trimmed, blanks cleared).
      const saved = await save(values);
      setValues(saved);
      setLastSaved(saved);
      setOutcome(SAVE_STATUS.SAVED);
    } catch {
      setOutcome(SAVE_STATUS.ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSave, save, values]);

  const reset = useCallback(() => {
    setOutcome(null);
    if (profile) setValues(profile);
  }, [profile]);

  return {
    email,
    values,
    setField,
    nameError,
    saveStatus,
    canSave,
    isLoading,
    loadError,
    submit,
    reset,
  };
}
