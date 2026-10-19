import {
  NewsletterConsentMode,
  NewsletterPopupDesign,
} from "@/constants/newsletterPopup";
import type { NewsletterPopupDesignEntry } from "./types";
import { ClassicPopup } from "./designs/ClassicPopup";
import { FloatingCardPopup } from "./designs/FloatingCardPopup";
import { BottomSheetPopup } from "./designs/BottomSheetPopup";
import { PushNotificationPopup } from "./designs/PushNotificationPopup";
import { EditorialSplitPopup } from "./designs/EditorialSplitPopup";
import { MidnightChromePopup } from "./designs/MidnightChromePopup";
import { InboxPreviewPopup } from "./designs/InboxPreviewPopup";

/** Every popup design, and how each one asks for consent. */
export const NEWSLETTER_POPUP_DESIGNS: Record<NewsletterPopupDesign, NewsletterPopupDesignEntry> = {
  [NewsletterPopupDesign.CLASSIC]: {
    View: ClassicPopup,
    consentMode: NewsletterConsentMode.CHECKBOX,
  },
  [NewsletterPopupDesign.FLOATING_CARD]: {
    View: FloatingCardPopup,
    consentMode: NewsletterConsentMode.INLINE,
  },
  [NewsletterPopupDesign.BOTTOM_SHEET]: {
    View: BottomSheetPopup,
    consentMode: NewsletterConsentMode.INLINE,
  },
  [NewsletterPopupDesign.PUSH_NOTIFICATION]: {
    View: PushNotificationPopup,
    consentMode: NewsletterConsentMode.INLINE,
  },
  [NewsletterPopupDesign.EDITORIAL_SPLIT]: {
    View: EditorialSplitPopup,
    consentMode: NewsletterConsentMode.INLINE,
  },
  [NewsletterPopupDesign.MIDNIGHT_CHROME]: {
    View: MidnightChromePopup,
    consentMode: NewsletterConsentMode.INLINE,
  },
  [NewsletterPopupDesign.INBOX_PREVIEW]: {
    View: InboxPreviewPopup,
    consentMode: NewsletterConsentMode.INLINE,
  },
};
