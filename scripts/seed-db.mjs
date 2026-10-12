// Fills an empty Netlify Database with the vacancies imported from Tilda (src/data/vacancies.seed.json) through the
// site's /api/db-script. Existing rows are never overwritten (insert … on conflict do nothing).
// --refresh: also rewrites imported rows nobody touched in the admin (no vacancy_history) — after a re-import
// (translations, photos, fixes). Rows edited or created in the admin are left alone.
// Run: node --env-file=.env.local scripts/seed-db.mjs [--refresh]
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
let refreshed = 0
if (process.argv.includes('--refresh')) {
  for (let i = 0; i < seed.length; i += 50) {
    const chunk = seed.slice(i, i + 50)
    const params = []
    const values = chunk.map((v, k) => {
      params.push(v.id, v.active, v.order, JSON.stringify(v))
      const b = k * 4
      return `($${b + 1}, $${b + 2}::boolean, $${b + 3}::int, $${b + 4}::jsonb)`
    })
    const rows = await sql.query(
      // the order stays the admin's («Порядок на сайті» renumbers rows without history entries)
      `update vacancies t set data = s.data || jsonb_build_object('order', t.sort), active = s.active, updated_at = now()
       from (values ${values.join(', ')}) as s(id, active, sort, data)
       where t.id = s.id and t.data is distinct from (s.data || jsonb_build_object('order', t.sort))
         and not exists (select 1 from vacancy_history h where h.vacancy_id = t.id)
       returning t.id`,
      params,
    )
    refreshed += rows.length
  }
}
await revalidate(['vacancies'])
console.log('added', added, 'refreshed', refreshed, 'of', seed.length)
