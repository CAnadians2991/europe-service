// Housing photos for the old Tilda vacancies that have none (owner, 2026-10-09: «find housing photos for them, or take
// random ones from Personal Work and mcpwork.org, repeating is fine»).
//
// The pool (scripts/media/housing_pool.json, built by build_housing_pool.py: real rooms / kitchens / baths / buildings,
// no people, no other brand's marks, our logo burned in) is shared out deterministically: one set per employer + city,
// photos of the vacancy's country first, a room, a kitchen and a bath when there are some. The caption says honestly that
// it is an example and the manager sends the photos of this very housing.
// Skipped: vacancies with their own housing photos (Tilda or our Drive, src/data/vacancy-media.json) and «own housing» ones.
// Idempotent: a vacancy whose housingPhotos come from the pool keeps them (housingPool marks it).
// Run: node scripts/media/assign_housing_pool.mjs   then   node --env-file=.env.local scripts/seed-db.mjs --refresh
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = path.resolve(import.meta.dirname, '../..')
const CLOSED = path.join(ROOT, 'data/vacancies.closed.json')
const POOL = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/media/housing_pool.json'), 'utf8'))
const MEDIA = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/vacancy-media.json'), 'utf8'))
const PER = 5
const NOTE = {
  uk: 'Приклад житла, яке надають роботодавці. Фото житла саме цієї вакансії надішле менеджер.',
  ru: 'Пример жилья, которое предоставляют работодатели. Фото жилья именно этой вакансии пришлёт менеджер.',
}
const OWN = /сво[єеї]\p{L}* житл|своим жиль|власн\p{L}* житл|не надається|не предоставляется|без житла|без жилья/iu

const hash = (s) => crypto.createHash('sha1').update(s).digest()
const norm = (x) => (x || '').toLowerCase().replace(/[^a-zа-яіїєґё0-9]/g, '')

const closed = JSON.parse(fs.readFileSync(CLOSED, 'utf8'))
let added = 0
let kept = 0
for (const v of closed) {
  if (v.housingPool) {
    kept++
    continue
  }
  if (v.housingPhotos?.length || MEDIA[v.path]?.housing?.length) continue
  const houseText = [v.housing, ...(v.sections.find((s) => /^(Проживання|Проживание)$/.test(s.title))?.items ?? [])].join(' ')
  if (OWN.test(houseText) && !v.housingFree) continue
  const local = POOL.filter((p) => p.country === v.country)
  const pool = local.length >= PER * 2 ? local : [...local, ...POOL.filter((p) => p.country !== v.country)]
  // one set per employer + city: the same employer's posts show the same photos
  const seed = hash(`${v.country}|${norm(v.company) || norm(v.title)}|${norm(v.city)}`)
  const order = pool.map((p, i) => ({ p, r: hash(seed.toString('hex') + p.base).readUInt32BE(0), i })).sort((a, b) => a.r - b.r)
  const pick = []
  for (const kind of ['room', 'kitchen', 'bath']) {
    const x = order.find((o) => o.p.kind === kind && !pick.includes(o.p))
    if (x) pick.push(x.p)
  }
  for (const o of order) {
    if (pick.length >= PER) break
    if (!pick.includes(o.p)) pick.push(o.p)
  }
  v.housingPhotos = pick.map((p) => p.base)
  v.housingNote = NOTE[v.lang === 'ru' ? 'ru' : 'uk']
  v.housingPool = true
  added++
}
fs.writeFileSync(CLOSED, JSON.stringify(closed, null, 1) + '\n')
console.log('housing photos from the pool:', added, 'vacancies; already had them:', kept, '; pool:', POOL.length)
