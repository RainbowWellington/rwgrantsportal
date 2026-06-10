import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema.js'

function getDb() {
  const connectionString = process.env.NITRO_POSTGRES_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    throw new Error('No database connection string found.')
  }
  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof getDb>]
  }
})
