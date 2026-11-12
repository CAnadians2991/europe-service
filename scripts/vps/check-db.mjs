// Our own server (Docker build, scripts/vps): runs before `next build`, like scripts/check-netlify-db.mjs on Netlify —
// applies the idempotent schema files and stops the build if the database (DATABASE_URL, sites-db on the server)
// is unreachable or has no vacancies, so the site is never built from an empty database.
import fs from 'node:fs'
import path from 'node:path'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('[db-check] DATABASE_URL is not set — stopping the build')
  process.exit(1)
}
const sql = postgres(url, { max: 1, connect_timeout: 15, prepare: false, onnotice: () => {} })
try {
  const dir = path.resolve(import.meta.dirname, '../../netlify/database/migrations')
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).sort()) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8')
      for (const stmt of text.split(/;\s*$/m).map((s) => s.replace(/--.*$/gm, '').trim()).filter(Boolean)) await sql.unsafe(stmt)
    }
  }
  const [{ n }] = await sql`select count(*)::int as n from vacancies`
  if (!n) {
    console.error('[db-check] the database has no vacancies — stopping the build')
    process.exit(1)
  }
  console.log(`[db-check] database: ${n} vacancies`)
} catch (e) {
  console.error('[db-check] database error — stopping the build:', e.message)
  process.exit(1)
} finally {
  await sql.end({ timeout: 5 }).catch(() => {})
}
