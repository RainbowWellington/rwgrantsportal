import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema.js'

let _db: NeonHttpDatabase<typeof schema> | null = null

export function getDatabase() {
  if (_db) return _db
  const connectionString = process.env.NITRO_POSTGRES_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    throw new Error('No database connection string found.')
  }
  const sql = neon(connectionString)
  _db = drizzle(sql, { schema })
  return _db
}

// Keep db export for backwards compatibility
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    return getDatabase()[prop as keyof NeonHttpDatabase<typeof schema>]
  }
})
