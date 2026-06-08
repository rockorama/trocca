/**
 * Sync a Clerk identity into our local `users` table.
 *
 * We don't use Clerk webhooks for the MVP; instead we lazily upsert the user on
 * their first authenticated request. Clerk remains the source of truth for auth,
 * while the local row gives us a stable internal id to hang holdings, trades and
 * ratings off (and lets us store app-specific fields like locale/region).
 */

import { eq } from 'drizzle-orm';
import type { Db } from '@/db/index';
import { users } from '@/db/schema';

export interface ClerkIdentity {
  clerkId: string;
  email: string;
  name: string;
}

/**
 * Return the internal user id for a Clerk identity, creating the row on first
 * sight and keeping email/name fresh on subsequent logins. Safe under races via
 * an upsert on the unique `clerk_id`.
 */
export async function ensureUser(db: Db, identity: ClerkIdentity): Promise<string> {
  // Fast path: already linked.
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, identity.clerkId))
    .limit(1);
  if (existing[0]) return existing[0].id;

  const [row] = await db
    .insert(users)
    .values({
      clerkId: identity.clerkId,
      email: identity.email,
      name: identity.name,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email: identity.email, name: identity.name },
    })
    .returning({ id: users.id });

  return row.id;
}
