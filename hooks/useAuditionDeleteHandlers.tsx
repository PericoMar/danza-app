// hooks/useAuditionDeleteHandlers.ts
import { useCallback } from "react";
import type { SnackbarState } from "@/types/ui";

/**
 * Devuelve handlers listos para pasarlos a <AuditionCard />
 * - onDeleted: muestra snackbar de éxito y (opcional) refresca lista
 * - onDeleteError: muestra snackbar de error
 */
export function useAuditionDeleteHandlers(
  setSnackbar: React.Dispatch<React.SetStateAction<SnackbarState>>,
  opts?: { refresh?: () => void; successMessage?: string }
) {
  const onDeleted = useCallback(
    (_auditionId: string) => {
      setSnackbar({
        message: opts?.successMessage ?? "Audición eliminada",
        color: "#16a34a",
        iconName: "checkmark-circle-outline",
      });
      opts?.refresh?.();
    },
    [opts, setSnackbar]
  );

  const onDeleteError = useCallback(
    (message?: string) => {
      setSnackbar({
        message: message || "No se pudo eliminar la audición",
        color: "#EF4444",
        iconName: "close-circle-outline",
      });
    },
    [setSnackbar]
  );

  return { onDeleted, onDeleteError };
}
