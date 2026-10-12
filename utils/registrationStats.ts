import { RegistrationBucket, RegistrationGranularity, RegistrationStats } from '@/types/adminStats';

// Caps how far back each granularity renders, so a multi-year-old account
// base doesn't force a 1000-bar chart — cumulative totals stay correct
// (computed before trimming), only the visible window shrinks.
const MAX_BUCKETS: Record<RegistrationGranularity, number> = {
  [RegistrationGranularity.DAY]: 90,
  [RegistrationGranularity.WEEK]: 52,
  [RegistrationGranularity.MONTH]: 36,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  const dow = (day.getDay() + 6) % 7; // Monday = 0
  day.setDate(day.getDate() - dow);
  return day;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function bucketStart(d: Date, granularity: RegistrationGranularity): Date {
  switch (granularity) {
    case RegistrationGranularity.WEEK:
      return startOfWeek(d);
    case RegistrationGranularity.MONTH:
      return startOfMonth(d);
    case RegistrationGranularity.DAY:
    default:
      return startOfDay(d);
  }
}

function bucketLabel(d: Date, granularity: RegistrationGranularity): string {
  switch (granularity) {
    case RegistrationGranularity.WEEK:
      return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
    case RegistrationGranularity.MONTH:
      return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    case RegistrationGranularity.DAY:
    default:
      return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
  }
}

/**
 * Buckets raw registration timestamps into a contiguous, gap-filled time
 * series (empty buckets are kept as 0 so the chart shows real lulls, not a
 * compressed axis) plus the headline totals shown in the stat tiles.
 */
export function buildRegistrationStats(
  isoDates: string[],
  granularity: RegistrationGranularity
): RegistrationStats {
  const totalUsers = isoDates.length;
  const now = new Date();

  const last7Days = isoDates.filter((iso) => now.getTime() - new Date(iso).getTime() <= 7 * DAY_MS).length;
  const last30Days = isoDates.filter((iso) => now.getTime() - new Date(iso).getTime() <= 30 * DAY_MS).length;
  const prev30Days = isoDates.filter((iso) => {
    const age = now.getTime() - new Date(iso).getTime();
    return age > 30 * DAY_MS && age <= 60 * DAY_MS;
  }).length;
  const growthPct = prev30Days > 0 ? ((last30Days - prev30Days) / prev30Days) * 100 : null;

  if (isoDates.length === 0) {
    return { buckets: [], totalUsers, last7Days, last30Days, growthPct };
  }

  const counts = new Map<number, number>();
  for (const iso of isoDates) {
    const key = bucketStart(new Date(iso), granularity).getTime();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const firstKey = bucketStart(new Date(isoDates[0]), granularity).getTime();
  const lastKey = bucketStart(now, granularity).getTime();

  const buckets: RegistrationBucket[] = [];
  let cumulative = 0;
  const cursor = new Date(firstKey);

  while (cursor.getTime() <= lastKey) {
    const key = cursor.getTime();
    const count = counts.get(key) ?? 0;
    cumulative += count;
    buckets.push({ date: new Date(cursor), label: bucketLabel(cursor, granularity), count, cumulative });

    if (granularity === RegistrationGranularity.WEEK) cursor.setDate(cursor.getDate() + 7);
    else if (granularity === RegistrationGranularity.MONTH) cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }

  const maxBuckets = MAX_BUCKETS[granularity];
  const visibleBuckets = buckets.length > maxBuckets ? buckets.slice(-maxBuckets) : buckets;

  return { buckets: visibleBuckets, totalUsers, last7Days, last30Days, growthPct };
}
