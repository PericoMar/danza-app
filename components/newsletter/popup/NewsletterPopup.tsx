import { useState } from "react";
import { Portal } from "react-native-paper";
import PrivacyPolicyModal from "@/components/modals/PrivacyPolicyModal";
import type { NewsletterPopupDesign } from "@/constants/newsletterPopup";
import { NEWSLETTER_POPUP_DESIGNS } from "./registry";
import type { NewsletterPopupViewProps } from "./types";

type NewsletterPopupProps = Omit<NewsletterPopupViewProps, "onOpenPrivacyPolicy"> & {
  design: NewsletterPopupDesign;
};

/**
 * Puts one popup design on screen, above everything, with the Privacy Policy
 * one tap away. Knows nothing about when the popup opens or what it submits.
 */
export function NewsletterPopup({ design, form, ...viewProps }: NewsletterPopupProps) {
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const { View: DesignView } = NEWSLETTER_POPUP_DESIGNS[design];

  return (
    <Portal>
      <DesignView
        form={form}
        onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
        {...viewProps}
      />
      <PrivacyPolicyModal
        visible={isPrivacyPolicyOpen}
        onAccept={() => {
          form.acceptConsent();
          setIsPrivacyPolicyOpen(false);
        }}
        onCancel={() => setIsPrivacyPolicyOpen(false)}
      />
    </Portal>
  );
}
