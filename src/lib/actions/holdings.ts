'use server';

/**
 * Server actions for signed-in holdings. Each resolves the current user and the
 * collection (by slug) and delegates to the holdings repo. When Clerk is
 * disabled or no one is signed in they no-op gracefully so the offline tracker
 * keeps working.
 */

import { db } from '@/db/index';
import { getCurrentUserId } from '@/lib/auth';
import { collectionIdByVisibleSlug } from '@/db/collections-repo';
import { getHoldings, setItemCount, mergeLocalHoldings } from '@/db/holdings-repo';
import type { Holdings } from '@/domain/collection';

/** The signed-in user's stored holdings for a collection (empty if signed out). */
export async function getMyHoldings(slug: string): Promise<Holdings> {
  const userId = await getCurrentUserId();
  if (!userId) return {};
  const collectionId = await collectionIdByVisibleSlug(db, slug, userId);
  if (!collectionId) return {};
  return getHoldings(db, userId, collectionId);
}

/** Persist a single item's count for the signed-in user. */
export async function setMyItemCount(slug: string, code: string, count: number): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not signed in');
  const collectionId = await collectionIdByVisibleSlug(db, slug, userId);
  if (!collectionId) throw new Error(`Unknown or inaccessible collection "${slug}"`);
  await setItemCount(db, userId, collectionId, code, count);
}

/** Merge offline holdings into the account on sign-in; returns the merged set. */
export async function mergeMyHoldings(slug: string, local: Holdings): Promise<Holdings> {
  const userId = await getCurrentUserId();
  if (!userId) return local;
  const collectionId = await collectionIdByVisibleSlug(db, slug, userId);
  if (!collectionId) return local;
  return mergeLocalHoldings(db, userId, collectionId, local);
}
