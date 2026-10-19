// components/modals/NewsletterModal.tsx
import { usePathname, router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { NewsletterPopup, NEWSLETTER_POPUP_DESIGNS } from "@/components/newsletter/popup";
import { useNewsletterPopupForm } from "@/hooks/useNewsletterPopupForm";
import { useNewsletterPopupSchedule } from "@/hooks/useNewsletterPopupSchedule";
import {
  ACTIVE_NEWSLETTER_POPUP_DESIGN,
  NEWSLETTER_POPUP_AUTO_CLOSE_MS,
  NEWSLETTER_POPUP_EXCLUDED_PATHS,
  type NewsletterPopupCloseReason,
} from "@/constants/newsletterPopup";
import { REGISTER_ROUTE } from "@/constants/routes";

/** The audition-alerts popup real visitors get, a few seconds into their visit. */
export default function NewsletterModal() {
  const { session, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const userEmail = session?.user?.email ?? null;
  const isExcludedPath = NEWSLETTER_POPUP_EXCLUDED_PATHS.some((p) => pathname?.startsWith(p));

  const { isOpen, close, markSubscribed } = useNewsletterPopupSchedule({
    isEnabled: !authLoading && !isExcludedPath,
    userEmail,
  });

  if (!isOpen) return null;

  return (
    <OpenNewsletterPopup userEmail={userEmail} onClose={close} onSubscribed={markSubscribed} />
  );
}

type OpenNewsletterPopupProps = {
  userEmail: string | null;
  onClose: (reason: NewsletterPopupCloseReason) => void;
  onSubscribed: () => void;
};

// Mounted only while open, so every opening starts from an empty form.
function OpenNewsletterPopup({ userEmail, onClose, onSubscribed }: OpenNewsletterPopupProps) {
  const design = ACTIVE_NEWSLETTER_POPUP_DESIGN;
  const form = useNewsletterPopupForm({
    lockedEmail: userEmail,
    consentMode: NEWSLETTER_POPUP_DESIGNS[design].consentMode,
    onSubscribed,
  });

  return (
    <NewsletterPopup
      design={design}
      form={form}
      onClose={onClose}
      onCreateAccount={() =>
        router.push(`${REGISTER_ROUTE}?email=${encodeURIComponent(form.subscribedEmail)}`)
      }
      autoCloseAfterSuccessMs={
        userEmail ? NEWSLETTER_POPUP_AUTO_CLOSE_MS.SIGNED_IN : NEWSLETTER_POPUP_AUTO_CLOSE_MS.GUEST
      }
    />
  );
}
