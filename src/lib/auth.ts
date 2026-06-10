import { getAuth } from '@clerk/tanstack-react-start/server'
import { getWebRequest } from '@tanstack/react-start/server'

export type ServerUser = {
  id: string
  email: string
  name?: string
}

export async function getServerUser(): Promise<ServerUser | null> {
  const request = getWebRequest()
  const { userId } = await getAuth(request)

  if (!userId) return null

  return { id: userId, email: '' }
}
