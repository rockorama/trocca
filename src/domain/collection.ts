/**
 * Pure collection-tracking domain logic.
 *
 * A "collection" (a.k.a. album) is a catalog of items, each identified by a
 * stable string id (e.g. a sticker number like "WC26-017"). A user's holdings
 * map each item id to the number of copies they physically own:
 *
 *   count === 0  -> missing (needed)
 *   count === 1  -> owned, nothing to trade
 *   count >= 2   -> owned, with (count - 1) spare copies to trade
 *
 * Items absent from the holdings map are treated as count 0 (missing).
 *
 * These functions are intentionally framework-free and side-effect-free so the
 * business rules can be exhaustively unit-tested in isolation.
 */

export type Holdings = Record<string, number>;

export interface CollectionStats {
  /** Total distinct items in the catalog. */
  total: number;
  /** Distinct catalog items the user owns at least one of. */
  owned: number;
  /** Distinct catalog items the user is still missing. */
  missing: number;
  /** Total number of spare copies available to trade (sum of count-1, count>=2). */
  extras: number;
  /** Completion ratio in [0, 1]. 1 for an empty catalog. */
  completion: number;
}

/** Normalize a raw count into a safe, non-negative integer. */
function normalizeCount(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

/**
 * Items the user still needs: catalog items with a count of 0 (or absent).
 * Returned sorted for deterministic output.
 */
export function neededItems(catalog: string[], holdings: Holdings): string[] {
  const unique = new Set(catalog);
  return [...unique]
    .filter((id) => normalizeCount(holdings[id]) === 0)
    .sort();
}

/**
 * Items the user can give away: any held item with 2+ copies.
 *
 * Note this is independent of the catalog — a user may hold (and offer) an item
 * that is not part of a given catalog, which matters when the same physical
 * holdings are matched against multiple collections. Returned sorted.
 */
export function extraItems(holdings: Holdings): string[] {
  return Object.keys(holdings)
    .filter((id) => normalizeCount(holdings[id]) >= 2)
    .sort();
}

/** Total number of spare copies (sum of count-1 over items with count>=2). */
export function totalExtras(holdings: Holdings): number {
  return Object.values(holdings).reduce((sum, raw) => {
    const count = normalizeCount(raw);
    return count >= 2 ? sum + (count - 1) : sum;
  }, 0);
}

/** Compute aggregate completion statistics for a user against a catalog. */
export function collectionStats(catalog: string[], holdings: Holdings): CollectionStats {
  const unique = [...new Set(catalog)];
  const total = unique.length;
  const owned = unique.filter((id) => normalizeCount(holdings[id]) >= 1).length;
  const missing = total - owned;
  const extras = totalExtras(holdings);
  const completion = total === 0 ? 1 : owned / total;

  return { total, owned, missing, extras, completion };
}
