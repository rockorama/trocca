"use client";

/**
 * localStorage-backed holdings store for the offline tracker.
 *
 * Built on `useSyncExternalStore` so it reads the persisted value at render time
 * without a `setState`-in-`useEffect` hydration dance (which both triggers
 * cascading renders and trips `react-hooks/set-state-in-effect`). The server
 * snapshot is an empty store, and React reconciles to the real client value
 * after hydration without a mismatch warning.
 *
 * The shape maps 1:1 onto the `user_items` table for later server sync.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Holdings } from "@/domain/collection";

const storageKey = (slug: string) => `trocca:holdings:${slug}`;

// Same-document writes don't fire the `storage` event (that's cross-tab only),
// so we keep our own subscriber set and notify it explicitly after each write.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const EMPTY = "{}";

function readRaw(slug: string): string {
  if (typeof window === "undefined") return EMPTY;
  return window.localStorage.getItem(storageKey(slug)) ?? EMPTY;
}

function parse(raw: string): Holdings {
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" ? (value as Holdings) : {};
  } catch {
    return {};
  }
}

/** Read the persisted offline holdings for a slug (outside React). */
export function readLocalHoldings(slug: string): Holdings {
  return parse(readRaw(slug));
}

/** Clear offline holdings for a slug (e.g. after merging them into an account). */
export function clearLocalHoldings(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(slug));
  notify();
}

/**
 * Returns the persisted holdings for `slug` and a setter for a single item's
 * count (clamped to a non-negative integer). Re-renders all hook users on write.
 */
export function useLocalHoldings(
  slug: string,
): [Holdings, (code: string, count: number) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    listeners.add(onChange);
    window.addEventListener("storage", onChange);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const getSnapshot = useCallback(() => readRaw(slug), [slug]);
  // String snapshots compare by value, so unchanged storage yields no re-render.
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const holdings = useMemo(() => parse(raw), [raw]);

  const setCount = useCallback(
    (code: string, count: number) => {
      const next = { ...parse(readRaw(slug)), [code]: Math.max(0, Math.floor(count)) };
      window.localStorage.setItem(storageKey(slug), JSON.stringify(next));
      notify();
    },
    [slug],
  );

  return [holdings, setCount];
}
