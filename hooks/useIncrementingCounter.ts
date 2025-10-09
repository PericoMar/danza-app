// hooks/useIncrementingCounter.ts
import { useEffect, useMemo, useState } from "react";

/**
 * Deterministic counter that increases by +1 every `periodHours`
 * starting from `startedAtISO`. Returns `base + increments`.
 */
export function useIncrementingCounter(
  base: number,
  periodHours: number,
  startedAtISO: string,
  refreshMs = 30_000
) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  const value = useMemo(() => {
    const start = new Date(startedAtISO).getTime();
    const elapsed = Math.max(0, now - start);
    const periodMs = periodHours * 60 * 60 * 1000;
    const increments = Math.floor(elapsed / periodMs);
    return base + increments;
  }, [base, periodHours, startedAtISO, now]);

  return value;
}
