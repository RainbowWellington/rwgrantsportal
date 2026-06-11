import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema.js'

export type DB = NeonHttpDatabase<typeof schema>

export function getDatabase(): DB {
  console.log('ENV KEYS:', Object.keys(process.env).join(', '))
  console.log('POSTGRES_URL defined:', !!process.env.POSTGRES_URL)
  const connectionString =
    process.env.TEST_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL || 
    process.env.NITRO_POSTGRES_URL

  if (!connectionString) {
    throw new Error('No database connection string found.')
  }
  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    return getDatabase()[prop as keyof DB]
  }
})
