import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Toast, type ToastAction } from "@/components/toast/Toast";
import type { ToastToneStyle } from "@/components/toast/tones";
import type { ToastTone } from "@/constants/toast";

/** What a caller asks to show. The tone picks colour and icon unless a palette replaces them. */
export type ToastRequest = {
  message: string;
  tone: ToastTone;
  palette?: ToastToneStyle;
  /** In ms; the default suits a one-line notice. */
  duration?: number;
  action?: ToastAction;
};

type ToastContextValue = {
  /** Shows a toast, replacing the one on screen if there is one. */
  showToast: (toast: ToastRequest) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Owns the one toast on screen, above the navigator. A screen that shows a
 * toast and then navigates away — logging in, signing up, saving — no longer
 * takes the toast down with it, because the toast was never the screen's.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<(ToastRequest & { id: number }) | null>(null);
  const lastIdRef = useRef(0);

  const showToast = useCallback((toast: ToastRequest) => {
    lastIdRef.current += 1;
    setCurrent({ ...toast, id: lastIdRef.current });
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {current && (
        <Toast
          // A new id remounts the toast, so a replacement starts its own clock.
          key={current.id}
          message={current.message}
          tone={current.tone}
          palette={current.palette}
          duration={current.duration}
          action={current.action}
          // Only clears its own toast, never one that replaced it.
          onClose={() => setCurrent((shown) => (shown?.id === current.id ? null : shown))}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
