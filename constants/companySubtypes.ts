// The subtype catalogue changes only when an admin edits it, so one read per
// session is plenty.
export const COMPANY_SUBTYPE_GROUPS_STALE_TIME_MS = 30 * 60 * 1000;
