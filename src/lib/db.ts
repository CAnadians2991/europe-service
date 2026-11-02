import 'server-only'
import { neon } from '@neondatabase/serverless'
import { getDatabase } from '@netlify/database'
import postgres from 'postgres'

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

/** DATABASE_URL — our own Postgres (VPS, TLS): postgres.js behind the same two calls the code uses,
 *  sql`…` and sql.query(text, params), both resolving to the rows. It wins over the Netlify Database.
 *  json/jsonb parameters: the code passes JSON.stringify(…) text, as the Neon driver expects — sent as is, not encoded again. */
function ownDatabase(url: string): Sql {
  const json = { to: 3802, from: [114, 3802], serialize: (x: unknown) => (typeof x === 'string' ? x : JSON.stringify(x)), parse: (x: string) => JSON.parse(x) }
  const pg = postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false, onnotice: () => {}, types: { json } })
  const tag = (strings: TemplateStringsArray, ...values: unknown[]) => pg(strings, ...(values as never[]))
  return Object.assign(tag, { query: (text: string, params: unknown[] = []) => pg.unsafe(text, params as never[]) }) as unknown as Sql
}

// NETLIFY_DB_URL in .env.local gives `next dev` the same database
const client = process.env.DATABASE_URL
  ? ownDatabase(process.env.DATABASE_URL)
  : (netlifyDatabase() ?? (process.env.NETLIFY_DB_URL ? neon(process.env.NETLIFY_DB_URL) : null))

export const hasDb = Boolean(client)

/** Tagged-template SQL client. Throws if no database is configured. */
export const sql: Sql =
  client ??
  ((() => {
    throw new Error('Database is not configured')
  }) as unknown as Sql)
