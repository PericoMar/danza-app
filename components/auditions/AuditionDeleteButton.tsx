// components/auditions/AuditionDeleteButton.tsx
import React, { useState } from "react";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import IconButton from "@/components/common/IconButton";
import { deleteAudition } from "@/services/auditions";
import type { Audition } from "@/types/audition";
import { Colors } from "@/theme/colors";

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
      const msg = e?.message || "Couldn't delete the audition";
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton
        name="trash-outline"
        size={16}
        color={Colors.dangerText}
        accessibilityLabel="Delete audition"
        onPress={handlePress}
        style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.dangerSoft }}
      />
      <ConfirmDialog
        visible={open}
        title="Delete audition"
        message={`${audition.summary || "(Untitled)"} — This can't be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
