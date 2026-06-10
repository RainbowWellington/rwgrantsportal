// src/components/CallbackHandler.tsx
// Previously handled OAuth redirect tokens in the URL hash for Netlify Identity.
// Clerk handles OAuth callbacks automatically via its own redirect flow —
// this component is no longer needed but kept as a no-op to avoid import errors
// until you clean up the __root.tsx import.

export function CallbackHandler() {
  // Clerk handles OAuth redirects internally. No action needed here.
  return null
}
