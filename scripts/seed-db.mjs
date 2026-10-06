// Fills an empty Netlify Database with the vacancies imported from Tilda (src/data/vacancies.seed.json) through the
// site's /api/db-script. Existing rows are never overwritten (insert … on conflict do nothing).
// Run: node --env-file=.env.local scripts/seed-db.mjs
import fs from 'node:fs'
import path from 'node:path'
import { sql, revalidate } from './lib/db.mjs'

const seed = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../src/data/vacancies.seed.json'), 'utf8'))
const [{ n }] = await sql`select count(*)::int as n from vacancies`
console.log('vacancies in the database:', n)
let added = 0
for (const v of seed) {
  const rows = await sql`insert into vacancies (id, path, active, sort, data) values (${v.id}, ${v.path}, ${v.active}, ${v.order}, ${JSON.stringify(v)}::jsonb) on conflict (id) do nothing returning id`
  added += rows.length
}
await revalidate(['vacancies'])
console.log('added', added, 'of', seed.length)
