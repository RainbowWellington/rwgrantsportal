import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema.js'

const connectionString = process.env.NITRO_POSTGRES_URL || process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error('No database connection string found.')
}

const sql = neon(connectionString)
export const db = drizzle(sql, { schema })
