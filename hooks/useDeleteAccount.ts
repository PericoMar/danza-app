import { useCallback, useState } from "react";
import { router } from "expo-router";
import { deleteMyAccount } from "@/services/account";

/** Confirmation + submission state for the delete-account screen. */
export function useDeleteAccount() {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(async () => {
    if (!isAcknowledged || isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteMyAccount();
      router.replace("/login");
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  }, [isAcknowledged, isDeleting]);

  return {
    isAcknowledged,
    toggleAcknowledged: useCallback(() => setIsAcknowledged((v) => !v), []),
    isDeleting,
    error,
    confirm,
  };
}
