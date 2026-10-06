// Runs on Netlify before `next build`: applies the schema, and on the very first deploy fills the empty Netlify Database
// with the vacancies imported from Tilda (src/data/vacancies.seed.json). Stops the deploy if the database is unreachable,
// so the site never goes live without its data.
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { getConnectionString } from '@netlify/database'

if (!process.env.NETLIFY || process.env.NETLIFY_LOCAL) {
  console.log('[db-check] not a Netlify CI build — skipped')
  process.exit(0)
}
let url
try {
  url = getConnectionString()
} catch {
  console.error('[db-check] Netlify Database is not available in the build — stopping the deploy')
  process.exit(1)
}
const sql = neon(url)
const root = path.resolve(import.meta.dirname, '..')
// schema (idempotent)
for (const f of fs.readdirSync(path.join(root, 'netlify/database/migrations')).sort()) {
  const text = fs.readFileSync(path.join(root, 'netlify/database/migrations', f), 'utf8')
  for (const stmt of text.split(/;\s*$/m).map((s) => s.replace(/--.*$/gm, '').trim()).filter(Boolean)) await sql.query(stmt)
}
const [{ n }] = await sql.query('select count(*)::int as n from vacancies')
if (!n) {
  const seed = [
    ...JSON.parse(fs.readFileSync(path.join(root, 'src/data/vacancies.seed.json'), 'utf8')),
    ...JSON.parse(fs.readFileSync(path.join(root, 'data/vacancies.closed.json'), 'utf8')),
  ]
  for (const v of seed) {
    await sql.query('insert into vacancies (id, path, active, sort, data) values ($1, $2, $3, $4, $5) on conflict do nothing', [v.id, v.path, v.active, v.order, JSON.stringify(v)])
  }
  console.log(`[db-check] empty database — seeded ${seed.length} vacancies from the Tilda import`)
} else {
  console.log(`[db-check] Netlify Database: ${n} vacancies`)
}
