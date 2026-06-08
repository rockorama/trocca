/**
 * Proxy (Next.js 16's renamed Middleware). Runs next-intl locale routing on
 * every request, wrapped in Clerk's auth context when Clerk is configured.
 *
 * When Clerk keys aren't set we skip Clerk entirely and run plain locale
 * routing, so the app works offline / in CI without credentials.
 */
import { clerkMiddleware } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default clerkEnabled
  ? clerkMiddleware((_auth, req) => intlMiddleware(req))
  : intlMiddleware;

export const config = {
  // Match all pathnames except for static assets, API routes and Next internals.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
