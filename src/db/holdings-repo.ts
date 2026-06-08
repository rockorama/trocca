/**
 * Server-side holdings persistence.
 *
 * Holdings are stored in `user_items` keyed by item *id*, but the offline tracker
 * and UI work in item *codes* (e.g. "BRA-01"), which are stable and human-facing.
 * This repo bridges the two: it reads/writes per (user, collection) using codes,
 * resolving them to ids against the collection's catalog.
 *
 * The merge math lives in the pure, tested `mergeHoldings` (domain/holdings.ts);
 * this layer only handles I/O.
 */

import { and, eq, inArray } from 'drizzle-orm';
import type { Db } from './index';
import { items, userItems } from './schema';
import { mergeHoldings } from '@/domain/holdings';
import type { Holdings } from '@/domain/collection';

/** Map item codes to their ids within a collection. Unknown codes are omitted. */
async function resolveCodes(
  db: Db,
  collectionId: string,
  codes: string[],
): Promise<Map<string, string>> {
  if (codes.length === 0) return new Map();
  const rows = await db
    .select({ id: items.id, code: items.code })
    .from(items)
    .where(and(eq(items.collectionId, collectionId), inArray(items.code, codes)));
  return new Map(rows.map((r) => [r.code, r.id]));
}

/** All of a user's owned items in a collection, as code -> count (count >= 1). */
export async function getHoldings(
  db: Db,
  userId: string,
  collectionId: string,
): Promise<Holdings> {
  const rows = await db
    .select({ code: items.code, count: userItems.count })
    .from(userItems)
    .innerJoin(items, eq(items.id, userItems.itemId))
    .where(and(eq(userItems.userId, userId), eq(items.collectionId, collectionId)));

  const out: Holdings = {};
  for (const r of rows) if (r.count > 0) out[r.code] = r.count;
  return out;
}

/** Upsert a single item's count for a user. Count is clamped to a non-negative int. */
export async function setItemCount(
  db: Db,
  userId: string,
  collectionId: string,
  code: string,
  count: number,
): Promise<void> {
  const itemId = (await resolveCodes(db, collectionId, [code])).get(code);
  if (!itemId) throw new Error(`Unknown item code "${code}" in collection ${collectionId}`);
  const safe = Math.max(0, Math.floor(count));
  await db
    .insert(userItems)
    .values({ userId, itemId, count: safe })
    .onConflictDoUpdate({
      target: [userItems.userId, userItems.itemId],
      set: { count: safe, updatedAt: new Date() },
    });
}

/**
 * Reconcile a user's offline (local) holdings into their stored holdings using a
 * per-item max (see mergeHoldings). Only items whose merged count differs from
 * the stored value are written. Returns the merged result (code -> count).
 */
export async function mergeLocalHoldings(
  db: Db,
  userId: string,
  collectionId: string,
  local: Holdings,
): Promise<Holdings> {
  const server = await getHoldings(db, userId, collectionId);
  const merged = mergeHoldings(server, local);

  const changed = Object.entries(merged).filter(([code, count]) => (server[code] ?? 0) !== count);
  if (changed.length === 0) return merged; // all keys came from `server`, so all valid

  const ids = await resolveCodes(db, collectionId, changed.map(([code]) => code));
  await db.transaction(async (tx) => {
    for (const [code, count] of changed) {
      const itemId = ids.get(code);
      if (!itemId) continue; // local-only code not in this catalog — skip
      await tx
        .insert(userItems)
        .values({ userId, itemId, count })
        .onConflictDoUpdate({
          target: [userItems.userId, userItems.itemId],
          set: { count, updatedAt: new Date() },
        });
    }
  });

  // Only return codes that exist in the collection: server keys are valid by
  // construction; changed keys are valid iff they resolved to an item id. This
  // prevents the client from briefly showing items that aren't in the catalog.
  const result: Holdings = {};
  for (const [code, count] of Object.entries(merged)) {
    if (code in server || ids.has(code)) result[code] = count;
  }
  return result;
}
