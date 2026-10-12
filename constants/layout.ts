export const MOBILE_BREAKPOINT = 600;
export const TABLET_BREAKPOINT = 900;
export const LARGE_SCREEN_BREAKPOINT = 1350;
export const SMALL_SCREEN_BREAKPOINT = 550;
export const SCREEN_SIDE_PADDING_RATIO = 0.15;
export const MAX_NEW_REVIEW_MODAL_HEIGHT_RATIO = 0.75;

export const GRID_COLS_LARGE = 3;
export const GRID_COLS_MEDIUM = 2;
export const GRID_COLS_SMALL = 1;

// ─── Companies page (Claude Design "Companies.html") ───
export const PAGE_CONTENT_MAX_WIDTH = 1320; // .wrap max-width
export const PAGE_H_PADDING = 40;           // .wrap padding
export const PAGE_H_PADDING_COMPACT = 22;   // .wrap padding <= 720px
export const PAGE_H_PADDING_BREAKPOINT = 720;

export const COMPANIES_NAV_HIDDEN_MAX_WIDTH = 900; // nav links collapse
export const COMPANIES_GRID_3COL_MIN_WIDTH = 1080; // 3 cols above this
export const COMPANIES_GRID_2COL_MIN_WIDTH = 680;  // 2 cols above this, 1 below
export const COMPANIES_FILTERS_ICON_ONLY_MAX_WIDTH = 560; // favorites/sex pills drop their label
export const COMPANIES_HERO_COMPACT_MAX_WIDTH = 560; // hero image ring shrinks to sit beside the title

// Country + type selectors: shrink together so they never wrap onto two
// lines on narrow phones (iPhone SE/XS and similar ~375px widths).
export const COMPANIES_SELECTOR_GAP = 14;
export const COMPANIES_SELECTOR_DEFAULT_WIDTH = 150; // was 170
export const COMPANIES_SELECTOR_MIN_WIDTH = 104;
export const COMPANIES_SELECTOR_HEIGHT = 43; // was 48 (-10%)

export const COMPANIES_PER_PAGE = 9;

// ─── Company Insights page (Claude Design "Company Insights v3.html") ───
export const INSIGHTS_CONTENT_MAX_WIDTH = 980; // .col max-width
export const LANDING_NAV_HEIGHT = 72;          // LandingNavbar inner height

// Sticky company header ("chead") collapses as the page scrolls.
export const INSIGHTS_HEADER_MAX_HEIGHT = 84;
export const INSIGHTS_HEADER_MIN_HEIGHT = 60;
export const INSIGHTS_HEADER_MAX_FONT = 30;
export const INSIGHTS_HEADER_MIN_FONT = 17;
export const INSIGHTS_HEADER_SCROLL_RANGE = 90; // px of scroll for a full collapse

// Below this width the company / audition descriptions clamp with a "view more".
export const INSIGHTS_COMPACT_BREAKPOINT = 760;
// Audition timeline nodes stack (2-col, no connecting rail) at/below this width.
export const INSIGHTS_TIMELINE_STACK_MAX_WIDTH = 820;

export const DESCRIPTION_CLAMP_MIN_CHARS = 140;
export const REVIEW_SECTION_CLAMP_MIN_CHARS = 300;

// ─── Newsletter page (editorial black-on-white hero) ───
export const NEWSLETTER_CONTENT_MAX_WIDTH = 1120; // oversized headline + field column max-width

// ─── Auth pages (login / register / reset-password) ───
export const AUTH_CARD_MAX_WIDTH = 560; // auth screen content width

// ─── Profile / account pages (newsletter-style editorial layout) ───
export const PROFILE_CONTENT_MAX_WIDTH = 1040;  // hero + settings sections column
export const PROFILE_SECTION_LABEL_WIDTH = 280; // left "label" column of each section on wide screens
export const PROFILE_SECTION_GAP = 48;          // gap between that label column and the fields
export const ACCOUNT_DIALOG_MAX_WIDTH = 760;    // delete-account confirmation column
export const SAVE_BUBBLE_BOTTOM_OFFSET = 20;    // gap between the floating save bubble and the screen bottom
export const SAVE_BUBBLE_CLEARANCE = 104;       // extra scroll padding so the last content clears the bubble
