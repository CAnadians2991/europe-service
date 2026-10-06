// Fills an empty Netlify Database with the vacancies imported from Tilda (src/data/vacancies.seed.json) through the
// site's /api/db-script. Existing rows are never overwritten (insert … on conflict do nothing).
// Run: node --env-file=.env.local scripts/seed-db.mjs
import fs from 'node:fs'
import path from 'node:path'
import { sql, revalidate } from './lib/db.mjs'

// open vacancies + the closed Tilda posts (their pages stay online at the old addresses)
const seed = [
  ...JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../src/data/vacancies.seed.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../data/vacancies.closed.json'), 'utf8')),
]
const [{ n }] = await sql`select count(*)::int as n from vacancies`
console.log('vacancies in the database:', n)
let added = 0
// 50 rows per statement (1 400+ rows through /api/db-script)
for (let i = 0; i < seed.length; i += 50) {
  const chunk = seed.slice(i, i + 50)
  const params = []
  const values = chunk.map((v, k) => {
    params.push(v.id, v.path, v.active, v.order, JSON.stringify(v))
    const b = k * 5
    return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}::jsonb)`
  })
  const rows = await sql.query(`insert into vacancies (id, path, active, sort, data) values ${values.join(', ')} on conflict (path) do nothing returning id`, params)
  added += rows.length
}
await revalidate(['vacancies'])
console.log('added', added, 'of', seed.length)
