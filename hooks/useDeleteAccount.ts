import { useCallback, useState } from "react";
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
      // deleteMyAccount() signs out. Don't navigate here: the session change
      // remounts AppShell (key={sessionKey}) and AuthNavigator sends the
      // now-guest user from this private route to /login. Calling
      // router.replace now targets the Stack being unmounted, which closed
      // the app on iOS.
      await deleteMyAccount();
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
