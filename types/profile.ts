// State of the /profile form's save flow, shown in the floating save bubble.
export const SAVE_STATUS = {
  CLEAN: "clean",
  DIRTY: "dirty",
  SAVING: "saving",
  /** Just saved — the green confirmation, shown briefly before the bubble leaves. */
  SAVED: "saved",
  ERROR: "error",
} as const;

export type SaveStatus = (typeof SAVE_STATUS)[keyof typeof SAVE_STATUS];
