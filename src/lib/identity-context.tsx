// src/lib/identity-context.tsx
// Replaced: @netlify/identity IdentityProvider + useIdentity() hook
// Now re-exports Clerk's hooks under the same interface so existing components
// that call useIdentity() continue to work with minimal changes.
//
// Original pattern:
//   const { user, login, logout } = useIdentity()
//
// Clerk equivalent (same shape, exported below):
//   const { user, login, logout } = useIdentity()

import { useUser, useClerk, useSignIn } from '@clerk/tanstack-start'

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

/**
 * Drop-in replacement for the old useIdentity() hook.
 * Wraps Clerk's hooks to match the API shape the rest of the app expects.
 */
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

// IdentityProvider is now ClerkProvider — wire it up in src/routes/__root.tsx
// Replace:
//   <IdentityProvider>...</IdentityProvider>
// With:
//   <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
//     ...
//   </ClerkProvider>
//
// VITE_CLERK_PUBLISHABLE_KEY must be set in your .env and Vercel env vars.
export { ClerkProvider as IdentityProvider } from '@clerk/tanstack-start'
