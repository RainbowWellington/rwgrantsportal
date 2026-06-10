import { useUser, useClerk, useSignIn } from '@clerk/tanstack-react-start'

export type IdentityUser = {
  id: string
  email: string
  name?: string
}

export type IdentityContextValue = {
  user: IdentityUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export function useIdentity(): IdentityContextValue {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { signIn } = useSignIn()

  const login = async (email: string, password: string) => {
    if (!signIn) throw new Error('signIn not available')
    await signIn.create({ identifier: email, password })
  }

  const logout = async () => {
    await signOut()
  }

  const identityUser: IdentityUser | null = user
    ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? '',
        name: user.fullName ?? undefined,
      }
    : null

  return {
    user: identityUser,
    isLoading: !isLoaded,
    login,
    logout,
  }
}

export { ClerkProvider as IdentityProvider } from '@clerk/tanstack-react-start'
