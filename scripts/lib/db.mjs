// SQL for the maintenance scripts. Netlify Database hands outside tools only a read-only connection, so statements go
// through the site's /api/db-script (runs them on the site's own connection). Needs DB_SCRIPT_TOKEN in .env.local.
//   import { sql, revalidate } from './lib/db.mjs'
//   const rows = await sql`select data from vacancies where id = ${id}`      // or sql.query(text, params)
//   await revalidate(['vacancies'])                                           // refresh the cached pages after writes
const base = process.env.SCRIPT_SITE_URL || 'https://europeservice.com.ua'
const token = process.env.DB_SCRIPT_TOKEN
if (!token) throw new Error('DB_SCRIPT_TOKEN missing — run with --env-file=.env.local')

async function call(body) {
  const r = await fetch(`${base}/api/db-script`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }))
  if (!r.ok) throw new Error(`[db] ${j.error ?? r.status}`)
  return j.rows
}

const query = (text, params = []) => call({ query: text, params })

/** Tagged template like the neon client: sql`… ${value} …` → parameterised query */
export const sql = Object.assign((strings, ...values) => query(strings.reduce((q, s, i) => q + s + (i < values.length ? `$${i + 1}` : ''), ''), values), { query })

export const revalidate = (tags) => call({ revalidate: tags })
