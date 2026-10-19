import { useEffect, useState } from 'react';
import { useNavigationContainerRef } from 'expo-router';

/**
 * Turns true once the root navigator has mounted, so that effects which write
 * to the URL can run again when there is navigation to write to. It never
 * turns back: whoever navigates still has to check `isReady()` at the time.
 *
 * Not `!!useRootNavigationState()?.key`, which used to do this job. That hook
 * re-reads the root state on every render and compares it by identity, and
 * while a nested navigator (a layout with a <Slot/>) hasn't navigated yet,
 * React Navigation assembles a new root state object on every read. A
 * component that reads it next to `usePathname()` sees its own snapshot go
 * stale during render, and React renders it again — forever.
 */
export function useNavigationReady(): boolean {
  const navigationRef = useNavigationContainerRef();
  const [ready, setReady] = useState(() => navigationRef.isReady());

  useEffect(() => {
    if (ready) return;
    const check = () => {
      if (navigationRef.isReady()) setReady(true);
    };
    // The container announces its first state once the root navigator is in.
    const unsubscribe = navigationRef.addListener('state', check);
    check();
    return unsubscribe;
  }, [ready, navigationRef]);

  return ready;
}
