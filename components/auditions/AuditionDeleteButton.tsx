// components/auditions/AuditionDeleteButton.tsx
import React, { useState } from "react";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import IconButton from "@/components/common/IconButton";
import { deleteAudition } from "@/services/auditions";
import type { Audition } from "@/types/audition";

type Props = {
  audition: Audition;
  onDeleted?: (auditionId: string) => void;  // opcional: refrescar lista, Snackbar, etc.
  onError?: (message: string) => void;       // opcional: manejar errores en UI superior si quieres
};

export default function AuditionDeleteButton({ audition, onDeleted, onError }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePress = () => setOpen(true);
  const handleCancel = () => {
    if (!loading) setOpen(false);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await deleteAudition(audition.id);
      setOpen(false);
      onDeleted?.(audition.id);
    } catch (e: any) {
      const msg = e?.message || "No se pudo eliminar la audición";
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton
        name="trash-outline"
        color="#c2410c"
        accessibilityLabel="Eliminar audición"
        onPress={handlePress}
      />
      <ConfirmDialog
        visible={open}
        title="Eliminar audición"
        message={`${audition.summary || "(Sin título)"} — Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
