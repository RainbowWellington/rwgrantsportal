import { auth } from '@clerk/tanstack-react-start/server'

export type ServerUser = {
  id: string
  email: string
  name?: string
}

export async function getServerUser(): Promise<ServerUser | null> {
  const { userId } = await auth()

  if (!userId) return null

  return { id: userId, email: '' }
}
