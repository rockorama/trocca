/**
 * Server-side auth helpers bridging Clerk and our user table.
 *
 * `clerkEnabled` lets the whole app degrade gracefully to the offline/local
 * experience when Clerk keys aren't configured (e.g. local dev, CI, preview
 * without secrets) — so nothing here is called and `npm run build` never needs
 * credentials. When keys are present, auth + server persistence light up.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db/index';
import { ensureUser } from './user-sync';

export const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Whether a database is configured. When false, pages fall back to seed data. */
export const dbEnabled = Boolean(process.env.DATABASE_URL);

/**
 * Resolve the signed-in user's internal id, lazily syncing their Clerk identity
 * into our `users` table. Returns null when Clerk is disabled or no one is
 * signed in.
 */
export async function getCurrentUserId(): Promise<string | null> {
  if (!clerkEnabled) return null;

  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    `${clerkId}@clerk.local`; // satisfies NOT NULL/UNIQUE when no email is exposed
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    email;

  return ensureUser(db, { clerkId, email, name });
}
