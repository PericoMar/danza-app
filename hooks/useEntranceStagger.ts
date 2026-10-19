import { useEffect, useRef } from 'react';

/**
 * Delays that stagger a list's entrance animation. Only the items new to their
 * slot since the last commit count — just mounted, or moved there by a
 * reorder — and they get increasing delays in list order. So when a
 * recalculation only changes the bottom of a list, the wave starts there
 * instead of waiting behind the items that stayed put. Every other id reads 0.
 *
 * Pairs with `<Entrance replayKey={slot}>`: an item replays exactly when its
 * slot changes, which is when this gives it a delay.
 */
export function useEntranceStagger(
  ids: readonly string[],
  stepMs: number,
  maxSteps: number,
): (id: string) => number {
  // Updated after commit, never during render: a render React throws away
  // must not count as painted.
  const committedIds = useRef<readonly string[]>([]);
  useEffect(() => {
    committedIds.current = ids;
  });

  const delays = new Map<string, number>();
  let step = 0;
  ids.forEach((id, slot) => {
    if (committedIds.current[slot] === id) return;
    delays.set(id, Math.min(step, maxSteps) * stepMs);
    step += 1;
  });
  return (id) => delays.get(id) ?? 0;
}
