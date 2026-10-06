// Proof-reading fixes for vacancy texts → DB (with a version in vacancy_history, restorable from the admin) → seed.
//
//   node --env-file=.env.local scripts/apply-text-fixes.mjs fixes-uk.json fixes-ru.json --dry   # report only
//   node --env-file=.env.local scripts/apply-text-fixes.mjs fixes-uk.json fixes-ru.json         # apply
//
// A fixes file is [{ id, path, old, new, reason }]; path is "sections.2.items.0" or "ru.sections[2].items[0]".
// { remove: true } instead of `new` deletes that list item (e.g. a line that contradicts the rest of the vacancy).
// A fix is applied only if the current value is exactly `old` (null/absent `old` = fill an empty field),
// so anything a manager changed in the admin meanwhile is left alone and reported as stale.
// Only rows that change get a history entry ('update', previous data) and a new data.updatedAt.
import fs from 'node:fs'
import path from 'node:path'
import { revalidate, sql } from './lib/db.mjs'

const DRY = process.argv.includes('--dry')
const files = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const root = path.resolve(import.meta.dirname, '..')
const SEED = path.join(root, 'src/data/vacancies.seed.json')


const keys = (p) => p.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
const get = (o, ks) => ks.reduce((x, k) => (x == null ? undefined : x[k]), o)
function set(o, ks, v) {
  let x = o
  for (const k of ks.slice(0, -1)) x = x[k] ??= {}
  x[ks.at(-1)] = v
}

const fixes = files.flatMap((f) => JSON.parse(fs.readFileSync(f, 'utf8')))
const rows = await sql`select id, data from vacancies`
const byId = new Map(rows.map((r) => [r.id, structuredClone(r.data)]))
const changed = new Set()
const stale = []
const removals = []
let applied = 0

for (const f of fixes) {
  const d = byId.get(f.id)
  if (!d) {
    stale.push({ ...f, why: 'no such vacancy' })
    continue
  }
  const ks = keys(f.path)
  const cur = get(d, ks)
  const fill = f.old == null
  if (fill ? cur != null && cur !== '' : cur !== f.old) {
    stale.push({ ...f, why: 'current text differs', cur })
    continue
  }
  if (f.remove) {
    removals.push({ d, ks })
    changed.add(f.id)
    applied++
    continue
  }
  if (cur === f.new) continue
  set(d, ks, f.new)
  changed.add(f.id)
  applied++
}

// list items are removed last and from the end, so the indexes above stay valid
for (const { d, ks } of removals.sort((a, b) => Number(b.ks.at(-1)) - Number(a.ks.at(-1)))) get(d, ks.slice(0, -1)).splice(Number(ks.at(-1)), 1)

console.log(`${fixes.length} fixes: ${applied} applicable to ${changed.size} vacancies, ${stale.length} stale`)
for (const s of stale.slice(0, 20)) console.log('  stale', s.id, s.path, '—', s.why)
if (DRY) process.exit(0)

const now = new Date().toISOString()
for (const id of changed) {
  const prev = rows.find((r) => r.id === id).data
  const next = { ...byId.get(id), updatedAt: now }
  await sql`insert into vacancy_history (vacancy_id, action, data) values (${id}, 'update', ${JSON.stringify(prev)})`
  await sql`update vacancies set data = ${JSON.stringify(next)}, updated_at = now() where id = ${id}`
}
if (changed.size) await revalidate(['vacancies'])
console.log(`DB: ${changed.size} vacancies updated (previous versions saved to history), site cache refreshed`)

// seed ← DB for the rows the seed already has (never pulls in drafts or test rows), same key order
const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'))
const fresh = new Map((await sql`select id, data from vacancies`).map((r) => [r.id, r.data]))
const reorder = (src, like) =>
  like && typeof like === 'object' && !Array.isArray(like) && src && typeof src === 'object' && !Array.isArray(src)
    ? Object.fromEntries([...Object.keys(like).filter((k) => k in src), ...Object.keys(src).filter((k) => !(k in like))].map((k) => [k, reorder(src[k], like[k])]))
    : Array.isArray(src) && Array.isArray(like)
      ? src.map((x, i) => reorder(x, like[i] ?? like[0]))
      : src
const out = seed.map((v) => (fresh.has(v.id) ? reorder(fresh.get(v.id), v) : v))
fs.writeFileSync(SEED, JSON.stringify(out, null, 1))
console.log(`seed: ${out.length} vacancies rewritten`)
