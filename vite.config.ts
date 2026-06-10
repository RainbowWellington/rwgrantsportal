import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// Removed: import netlify from '@netlify/vite-plugin-tanstack-start'
// TanStack Start on Vercel uses the built-in Vercel deployment preset.
// Set VITE_TANSTACK_START_PRESET=vercel in your Vercel environment variables,
// or pass the preset option below if using @tanstack/react-start >= 1.168.

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      // Tells TanStack Start to emit Vercel-compatible output
      deployment: {
        preset: 'vercel',
      },
    }),
    viteReact(),
  ],
})

export default config
