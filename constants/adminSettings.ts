// /admin/settings groups every admin tool on one page, one tab each. The open
// tab rides in the URL (?tab=…) so a reload or a shared link lands on it.

export const AdminSettingsTab = {
  USERS: "users",
  LANDING: "landing",
  NEWSLETTER_POPUP: "newsletter-popup",
  APPEARANCE: "appearance",
} as const;

export type AdminSettingsTab = (typeof AdminSettingsTab)[keyof typeof AdminSettingsTab];

/** Order of the tab bar. The first one is what /admin/settings opens on. */
export const ADMIN_SETTINGS_TABS: readonly AdminSettingsTab[] = [
  AdminSettingsTab.USERS,
  AdminSettingsTab.LANDING,
  AdminSettingsTab.NEWSLETTER_POPUP,
  AdminSettingsTab.APPEARANCE,
];

export const ADMIN_SETTINGS_TAB_PARAM = "tab";

/** The tab a `?tab=` value names, or the first one for a missing or unknown value. */
export function toAdminSettingsTab(value: string | string[] | undefined): AdminSettingsTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return ADMIN_SETTINGS_TABS.find((tab) => tab === raw) ?? ADMIN_SETTINGS_TABS[0];
}
