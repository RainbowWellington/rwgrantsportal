// db/index.ts
// Replaced: import { neon } from '@netlify/database'
// Now uses @vercel/postgres which provides the same Neon-backed Postgres connection.
// Set POSTGRES_URL in your Vercel project environment variables
// (added automatically when you link a Vercel Postgres database).

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema.js'

const sql = neon(process.env.POSTGRES_URL!)

export const db = drizzle(sql, { schema })
