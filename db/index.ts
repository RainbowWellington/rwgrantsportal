import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema.js'

export type DB = NeonHttpDatabase<typeof schema>

function createDb(): DB {
  const connectionString = process.env.NITRO_POSTGRES_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    throw new Error('No database connection string found.')
  }
  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

export function getDatabase(): DB {
  return createDb()
}

export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    return createDb()[prop as keyof DB]
  }
})
