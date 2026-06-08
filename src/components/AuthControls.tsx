"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

/**
 * Sign-in / account button. Rendered only when Clerk is configured (the parent
 * guards on `clerkEnabled`), so the Clerk context is always present here. Uses
 * `useUser()` rather than <SignedIn>/<SignedOut> control components for
 * compatibility across Clerk versions.
 */
export function AuthControls({ signIn }: { signIn: string }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;

  return isSignedIn ? (
    <UserButton />
  ) : (
    <SignInButton mode="modal">
      <button
        type="button"
        className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        {signIn}
      </button>
    </SignInButton>
  );
}
