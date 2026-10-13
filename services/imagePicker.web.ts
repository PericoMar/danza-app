import type { PickedImage } from '@/types/media';

export type PickImageOptions = {
  /** Native only: crop to a square in the system editor. The browser has no crop UI. */
  square?: boolean;
};

/**
 * Opens the browser's file dialog for a single image. Resolves with the picked
 * File, or null when the dialog is dismissed.
 */
export function pickImage(_options: PickImageOptions = {}): Promise<PickedImage | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}
