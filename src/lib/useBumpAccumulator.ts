"use client";

import { useState, useRef, useCallback } from "react";

export interface BumpEntry {
  label: string;
  total: number;
}

export interface BumpAccumulatorState {
  entries: Record<string, BumpEntry>;
  lockedPairs: Array<[string, string]>;
}

export interface BumpAccumulator {
  isActive: boolean;
  entries: Record<string, BumpEntry>;
  lockedPairs: Array<[string, string]>;
  recordBump: (
    key: string,
    label: string,
    deltaMin: number,
    adjacentPairs?: Array<[string, string]>
  ) => void;
  dismiss: () => void;
}

const DISMISS_DELAY_MS = 4000;

export function useBumpAccumulator(): BumpAccumulator {
  const [state, setState] = useState<BumpAccumulatorState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setState(null);
  }, []);

  const recordBump = useCallback(
    (
      key: string,
      label: string,
      deltaMin: number,
      adjacentPairs?: Array<[string, string]>
    ) => {
      // Reset auto-dismiss timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(dismiss, DISMISS_DELAY_MS);

      setState((prev) => {
        const existing = prev?.entries[key];
        const newTotal = (existing?.total ?? 0) + deltaMin;
        return {
          entries: {
            ...(prev?.entries ?? {}),
            [key]: { label, total: newTotal },
          },
          // Lock pairs only on first bump (when prev is null)
          lockedPairs: prev ? prev.lockedPairs : (adjacentPairs ?? []),
        };
      });
    },
    [dismiss]
  );

  return {
    isActive: state !== null,
    entries: state?.entries ?? {},
    lockedPairs: state?.lockedPairs ?? [],
    recordBump,
    dismiss,
  };
}
