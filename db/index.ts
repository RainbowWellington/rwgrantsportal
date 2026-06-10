import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema.js'

const connectionString = process.env.POSTGRES_URL 
  || process.env.DATABASE_URL
  || process.env.POSTGRES_PRISMA_URL

if (!connectionString) {
  throw new Error('No database connection string found. Set POSTGRES_URL in environment variables.')
}

const sql = neon(connectionString)
export const db = drizzle(sql, { schema })
