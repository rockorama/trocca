'use server';

/**
 * Server actions for signed-in holdings. Each resolves the current user and the
 * collection (by slug) and delegates to the holdings repo. When Clerk is
 * disabled or no one is signed in they no-op gracefully so the offline tracker
 * keeps working.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { collections } from '@/db/schema';
import { getCurrentUserId } from '@/lib/auth';
import { getHoldings, setItemCount, mergeLocalHoldings } from '@/db/holdings-repo';
import type { Holdings } from '@/domain/collection';

async function collectionIdBySlug(slug: string): Promise<string | null> {
  const [row] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);
  return row?.id ?? null;
}

/** The signed-in user's stored holdings for a collection (empty if signed out). */
export async function getMyHoldings(slug: string): Promise<Holdings> {
  const userId = await getCurrentUserId();
  if (!userId) return {};
  const collectionId = await collectionIdBySlug(slug);
  if (!collectionId) return {};
  return getHoldings(db, userId, collectionId);
}

/** Persist a single item's count for the signed-in user. */
export async function setMyItemCount(slug: string, code: string, count: number): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not signed in');
  const collectionId = await collectionIdBySlug(slug);
  if (!collectionId) throw new Error(`Unknown collection "${slug}"`);
  await setItemCount(db, userId, collectionId, code, count);
}

/** Merge offline holdings into the account on sign-in; returns the merged set. */
export async function mergeMyHoldings(slug: string, local: Holdings): Promise<Holdings> {
  const userId = await getCurrentUserId();
  if (!userId) return local;
  const collectionId = await collectionIdBySlug(slug);
  if (!collectionId) return local;
  return mergeLocalHoldings(db, userId, collectionId, local);
}
