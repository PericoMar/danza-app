// Registration-stats granularity — centralized so the toggle, the bucketing
// util, and the chart labels never drift out of sync.
export const RegistrationGranularity = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;

export type RegistrationGranularity =
  (typeof RegistrationGranularity)[keyof typeof RegistrationGranularity];

export interface RegistrationBucket {
  /** Bucket start, used for sorting/keys. */
  date: Date;
  /** Short axis label, e.g. "12 Sep", "W37", "Sep 2026". */
  label: string;
  /** New registrations within this bucket. */
  count: number;
  /** Running total of all registrations up to and including this bucket. */
  cumulative: number;
}

export interface RegistrationStats {
  buckets: RegistrationBucket[];
  totalUsers: number;
  last7Days: number;
  last30Days: number;
  /** % change of last30Days vs the 30 days before that; null if not enough history. */
  growthPct: number | null;
}
