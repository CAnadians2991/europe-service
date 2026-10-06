import 'server-only'
import { neon } from '@neondatabase/serverless'
import { getDatabase } from '@netlify/database'

type Sql = ReturnType<typeof neon>

/** Netlify Database (Neon under the hood, same HTTP driver) — on Netlify it's configured automatically */
function netlifyDatabase(): Sql | null {
  try {
    const db = getDatabase()
    return db.driver === 'serverless' ? (db.httpClient as Sql) : neon(db.connectionString)
  } catch {
    return null
  }
}

// NETLIFY_DB_URL in .env.local gives `next dev` the same database
const client = netlifyDatabase() ?? (process.env.NETLIFY_DB_URL ? neon(process.env.NETLIFY_DB_URL) : null)

export const hasDb = Boolean(client)

/** Tagged-template SQL client (HTTP, works in serverless). Throws if no database is configured. */
export const sql: Sql =
  client ??
  ((() => {
    throw new Error('Database is not configured')
  }) as unknown as Sql)
