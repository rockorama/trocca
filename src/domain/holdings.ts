/**
 * Holdings merge logic for sign-in.
 *
 * When a previously-anonymous user signs in, the copies they tracked offline (in
 * localStorage) must be reconciled with whatever their account already holds on
 * the server. Holdings are *snapshots* of how many physical copies a user owns —
 * NOT deltas — so the same stickers tracked on two devices must not be added
 * together. We therefore take the per-item maximum, which is idempotent and
 * never double-counts.
 *
 * Pure and key-agnostic: both maps must use the same key space (the caller is
 * responsible for resolving item codes to ids before merging server + local).
 */

import type { Holdings } from './collection';

/** Normalize to a safe, non-negative integer (mirrors collection.ts). */
function normalize(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

/**
 * Merge two holdings snapshots by taking the larger count for each item.
 * Items present in only one side are kept as-is. Counts of 0 are dropped so the
 * result stays a minimal "owned" map.
 */
export function mergeHoldings(server: Holdings, local: Holdings): Holdings {
  const out: Holdings = {};
  for (const key of new Set([...Object.keys(server), ...Object.keys(local)])) {
    const count = Math.max(normalize(server[key]), normalize(local[key]));
    if (count > 0) out[key] = count;
  }
  return out;
}
