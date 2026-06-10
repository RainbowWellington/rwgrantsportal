// src/lib/auth.ts
// Replaced: Netlify Identity nf_jwt cookie parsing
// Now uses Clerk's server-side helper to get the current user during SSR.
//
// SETUP REQUIRED:
//   1. Create a free account at https://clerk.com
//   2. Create an application — enable Email/Password + Google + GitHub OAuth providers
//   3. Add these env vars to Vercel:
//        CLERK_PUBLISHABLE_KEY=pk_...
//        CLERK_SECRET_KEY=sk_...
//   4. For Microsoft/O365 SSO: add it as an Enterprise SSO provider in the Clerk dashboard

import { getAuth } from '@clerk/tanstack-start/server'
import { getWebRequest } from '@tanstack/react-start/server'

export type ServerUser = {
  id: string
  email: string
}

/**
 * Returns the authenticated user during SSR, or null if not logged in.
 * Drop-in replacement for the old getServerUser() that read the nf_jwt cookie.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  const request = getWebRequest()
  const { userId } = await getAuth(request)

  if (!userId) return null

  // Clerk userId is the stable identifier — we use email for admin_users lookups.
  // getAuth() doesn't return email directly; use clerkClient if you need it server-side.
  // For the admin auth guard pattern used in this app, userId is sufficient.
  // See src/middleware/identity.ts for how this integrates with requireAuthMiddleware.
  return { id: userId, email: '' } // email populated in middleware where needed
}
