/**
 * Tiny reactive store wrapper — lets React components re-render when store mutates.
 * Usage:  const [tick, refresh] = useRefresh();
 *         call refresh() after any store write.
 */
import { useState, useCallback } from 'react';

export function useRefresh(): [number, () => void] {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);
  return [tick, refresh];
}
