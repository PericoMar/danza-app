// hooks/useAuditionDeleteHandlers.ts
import { useCallback } from "react";
import { ToastTone } from "@/constants/toast";
import { useToast } from "@/providers/ToastProvider";

/**
 * Devuelve handlers listos para pasarlos a <AuditionCard />
 * - onDeleted: muestra un toast de éxito y (opcional) refresca la lista
 * - onDeleteError: muestra un toast de error
 */
export function useAuditionDeleteHandlers(
  opts?: { refresh?: () => void; successMessage?: string }
) {
  const { showToast } = useToast();

  const onDeleted = useCallback(
    (_auditionId: string) => {
      showToast({
        message: opts?.successMessage ?? "Audición eliminada",
        tone: ToastTone.SUCCESS,
      });
      opts?.refresh?.();
    },
    [opts, showToast]
  );

  const onDeleteError = useCallback(
    (message?: string) => {
      showToast({
        message: message || "No se pudo eliminar la audición",
        tone: ToastTone.ERROR,
      });
    },
    [showToast]
  );

  return { onDeleted, onDeleteError };
}
