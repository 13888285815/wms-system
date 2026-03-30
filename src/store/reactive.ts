import { useState, useCallback } from 'react';

/**
 * Tiny reactive hook — returns a refresh() function.
 * Call refresh() after any store write to trigger re-render.
 */
export function useRefresh(): () => void {
  const [, setTick] = useState(0);
  return useCallback(() => setTick(t => t + 1), []);
}
