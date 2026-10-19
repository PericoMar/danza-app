import { useAuth } from '@/providers/AuthProvider';
import { NewsletterPopup, NEWSLETTER_POPUP_DESIGNS } from '@/components/newsletter/popup';
import { useNewsletterPopupForm } from '@/hooks/useNewsletterPopupForm';
import type { NewsletterPopupDesign } from '@/constants/newsletterPopup';

type NewsletterPopupPreviewProps = {
  design: NewsletterPopupDesign;
  /** Show the guest version (email field) instead of the signed-in one. */
  isGuest: boolean;
  onClose: () => void;
};

const noop = () => {};

/**
 * One popup design, opened on demand for an admin to try. The form runs every
 * check, but the submission is simulated: nobody gets subscribed, nothing is
 * remembered, and it stays open after "subscribing" so the success state can
 * be looked at.
 */
export default function NewsletterPopupPreview({ design, isGuest, onClose }: NewsletterPopupPreviewProps) {
  const { session } = useAuth();
  const form = useNewsletterPopupForm({
    lockedEmail: isGuest ? null : session?.user?.email ?? null,
    consentMode: NEWSLETTER_POPUP_DESIGNS[design].consentMode,
    isSimulated: true,
  });

  return (
    <NewsletterPopup
      design={design}
      form={form}
      onClose={onClose}
      onCreateAccount={noop}
      autoCloseAfterSuccessMs={null}
    />
  );
}
