import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema.js'

export type DB = NeonHttpDatabase<typeof schema>

let _db: DB | null = null

export function getDatabase(): DB {
  if (_db) return _db
  const connectionString = process.env.NITRO_POSTGRES_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    throw new Error('No database connection string found.')
  }
  const sql = neon(connectionString)
  _db = drizzle(sql, { schema })
  return _db
}

export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    return getDatabase()[prop as keyof DB]
  }
})
