import { createMiddleware } from '@tanstack/react-start'
import { auth, clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { getDatabase } from '../../db/index.js'
import { adminUsers } from '../../db/schema.js'
import { eq } from 'drizzle-orm'

export const identityMiddleware = clerkMiddleware()

export const requireAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const { userId } = await auth()

  if (!userId) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const { createClerkClient } = await import('@clerk/backend')
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  })
  const clerkUser = await clerkClient.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress

  if (!email) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const adminUser = await getDatabase()
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1)

  if (adminUser.length === 0) {
    throw new Response('Forbidden', { status: 403 })
  }

  return next({ context: { userId, email } })
})
export const requireAdminRoleMiddleware = createMiddleware().server(async ({ next }) => {
  const { userId } = await auth()

  if (!userId) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const { createClerkClient } = await import('@clerk/backend')
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  })
  const clerkUser = await clerkClient.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress

  if (!email) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const adminUser = await getDatabase()
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1)

  if (adminUser.length === 0) {
    throw new Response('Forbidden', { status: 403 })
  }

  if (adminUser[0].role !== 'admin') {
    throw new Response('Forbidden', { status: 403 })
  }

  return next({ context: { userId, email } })
})
