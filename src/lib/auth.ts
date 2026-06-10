import { auth } from '@clerk/tanstack-react-start/server'
import { createClerkClient } from '@clerk/backend'

export type ServerUser = {
  id: string
  email: string
  name?: string
}

export async function getServerUser(): Promise<ServerUser | null> {
  const { userId } = await auth()

  if (!userId) return null

  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  })

  const clerkUser = await clerkClient.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  const name = clerkUser.fullName ?? undefined

  return { id: userId, email, name }
}
