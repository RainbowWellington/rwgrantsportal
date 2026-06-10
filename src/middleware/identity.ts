// src/middleware/identity.ts
// Replaced: Netlify Identity nf_jwt cookie validation
// Now uses Clerk's server-side auth to protect routes.

import { createMiddleware } from '@tanstack/react-start'
import { getAuth, clerkMiddleware } from '@clerk/tanstack-start/server'
import { getWebRequest } from '@tanstack/react-start/server'
import { db } from '../../db/index.js'
import { adminUsers } from '../../db/schema.js'
import { eq } from 'drizzle-orm'

/**
 * identityMiddleware — attaches Clerk auth state to context.
 * Replaces the old middleware that parsed the nf_jwt cookie.
 */
export const identityMiddleware = clerkMiddleware()

/**
 * requireAuthMiddleware — throws a 401 if not logged in AND not in admin_users table.
 * Same contract as before: checks Clerk session, then cross-references admin_users.
 */
export const requireAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getWebRequest()
  const { userId } = await getAuth(request)

  if (!userId) {
    throw new Response('Unauthorized', { status: 401 })
  }

  // Look up the user's email via Clerk backend client
  // (imported lazily to avoid bundling in client code)
  const { createClerkClient } = await import('@clerk/backend')
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  })
  const clerkUser = await clerkClient.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress

  if (!email) {
    throw new Response('Unauthorized', { status: 401 })
  }

  // Check admin_users table — same logic as before
  const adminUser = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1)

  if (adminUser.length === 0) {
    throw new Response('Forbidden', { status: 403 })
  }

  return next({ context: { userId, email } })
})
