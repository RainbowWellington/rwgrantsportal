import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  // Clerk handles password reset via email link automatically.
  // This page is no longer needed — redirect to login.
  navigate({ to: '/login' })
  return null
}
