import { NewsletterPopupDesign } from '@/constants/newsletterPopup';

// How the admin design picker describes each popup design. Copy only: the
// designs themselves live in components/newsletter/popup/designs.

/** Where on screen a design sits, for the picker's little schematic. */
export const PopupPlacement = {
  CENTER: 'center',
  CORNER: 'corner',
  SHEET: 'sheet',
  BANNER: 'banner',
} as const;

export type PopupPlacement = (typeof PopupPlacement)[keyof typeof PopupPlacement];

/** What the popup's surface looks like in the schematic. */
export const PopupSurface = {
  LIGHT: 'light',
  DARK: 'dark',
  PHOTO: 'photo',
  INBOX: 'inbox',
} as const;

export type PopupSurface = (typeof PopupSurface)[keyof typeof PopupSurface];

export type NewsletterPopupCatalogEntry = {
  name: string;
  pitch: string;
  placement: PopupPlacement;
  surface: PopupSurface;
  /** Dims the page and holds focus until it's answered. */
  blocksPage: boolean;
};

export const NEWSLETTER_POPUP_CATALOG: Record<NewsletterPopupDesign, NewsletterPopupCatalogEntry> = {
  [NewsletterPopupDesign.CLASSIC]: {
    name: 'Current',
    pitch: 'Centered card over a dark backdrop. What visitors get today, kept here to compare.',
    placement: PopupPlacement.CENTER,
    surface: PopupSurface.LIGHT,
    blocksPage: true,
  },
  [NewsletterPopupDesign.FLOATING_CARD]: {
    name: 'Floating card',
    pitch: 'A small card in the corner. The page stays usable, and the email field only appears after “Get alerts”.',
    placement: PopupPlacement.CORNER,
    surface: PopupSurface.LIGHT,
    blocksPage: false,
  },
  [NewsletterPopupDesign.PUSH_NOTIFICATION]: {
    name: 'Push notification',
    pitch: 'Drops in like a phone notification. Tap to expand it, swipe it up to dismiss.',
    placement: PopupPlacement.BANNER,
    surface: PopupSurface.LIGHT,
    blocksPage: false,
  },
  [NewsletterPopupDesign.BOTTOM_SHEET]: {
    name: 'Bottom sheet',
    pitch: 'Slides up from the bottom like a native app sheet, with a light backdrop. Drag it down to dismiss.',
    placement: PopupPlacement.SHEET,
    surface: PopupSurface.LIGHT,
    blocksPage: true,
  },
  [NewsletterPopupDesign.INBOX_PREVIEW]: {
    name: 'Inbox preview',
    pitch: 'Shows this week’s real auditions the way the Sunday email lists them. Shows the value instead of describing it.',
    placement: PopupPlacement.CENTER,
    surface: PopupSurface.INBOX,
    blocksPage: true,
  },
  [NewsletterPopupDesign.EDITORIAL_SPLIT]: {
    name: 'Editorial',
    pitch: 'Magazine-style split: a dance photo on one side, oversized type and an underlined field on the other.',
    placement: PopupPlacement.CENTER,
    surface: PopupSurface.PHOTO,
    blocksPage: true,
  },
  [NewsletterPopupDesign.MIDNIGHT_CHROME]: {
    name: 'Midnight chrome',
    pitch: 'Dark brushed-metal card with the app’s chrome accents and a silver headline. The premium option.',
    placement: PopupPlacement.CENTER,
    surface: PopupSurface.DARK,
    blocksPage: true,
  },
};

/** Picker order: the current design first, then from least to most intrusive. */
export const NEWSLETTER_POPUP_PICKER_ORDER = Object.keys(NEWSLETTER_POPUP_CATALOG) as NewsletterPopupDesign[];
