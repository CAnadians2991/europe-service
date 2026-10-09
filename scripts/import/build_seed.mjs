// out/vacancies.raw.json (extract_es_vacancies.py) -> src/data/vacancies.seed.json + WebP photos in public/media/v.
// Photos come from Tilda's CDN (static.tildacdn.com); out/media-map.json remembers what is already converted.
// Run: node scripts/import/build_seed.mjs
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { distinctTitles, fixVacancy, sanitizeVacancy } from './sanitize.mjs'

const HERE = import.meta.dirname
const EXPORT = path.resolve(HERE, '../../../tilda-export/project1613842')
const RAW = JSON.parse(fs.readFileSync(path.join(HERE, 'out/vacancies.raw.json'), 'utf8'))
const MAP_FILE = path.join(HERE, 'out/media-map.json')
const OUT = path.resolve(HERE, '../../src/data/vacancies.seed.json')
// closed vacancies (Tilda kept their pages online): straight into the database, not bundled with the site
const OUT_CLOSED = path.resolve(HERE, '../../data/vacancies.closed.json')
const PUBLIC = path.resolve(HERE, '../../public')
// Tilda Feeds post «descr» (10 posts had one) = the post page's meta description on Tilda — kept one-to-one (owner, 2026-10)
const POSTS_DIR = path.resolve(HERE, '../../../tilda-data/posts')
const tildaDescr = (uid) => {
  const f = uid && path.join(POSTS_DIR, `${uid}.json`)
  if (!f || !fs.existsSync(f)) return ''
  const d = String(JSON.parse(fs.readFileSync(f, 'utf8')).descr || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[\u200b\u2800]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return d.length >= 3 ? d : ''
}

const mediaMap = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {}
const saveMap = () => fs.writeFileSync(MAP_FILE, JSON.stringify(mediaMap, null, 1))

async function loadSource(src) {
  if (/^https?:/.test(src)) {
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 ES-migration' } })
        if (!r.ok) throw new Error(`${r.status} ${src}`)
        return Buffer.from(await r.arrayBuffer())
      } catch (e) {
        if (i === 2) throw e
        await new Promise((res) => setTimeout(res, 1500 * (i + 1)))
      }
    }
  }
  return fs.readFileSync(path.join(EXPORT, src))
}

/** closed vacancy: one 800-px WebP file (not a variant set) */
async function single(src, folder) {
  const k = 'single:' + src
  if (mediaMap[k]) return mediaMap[k]
  const buf = await loadSource(src)
  const img = sharp(buf, { failOn: 'none' }).rotate()
  const hash = crypto.createHash('sha1').update(src).digest('hex').slice(0, 10)
  const file = `/media/v/old/${hash}.webp`
  fs.mkdirSync(path.join(PUBLIC, 'media/v/old'), { recursive: true })
  if (!fs.existsSync(path.join(PUBLIC, file))) await img.resize({ width: 800, withoutEnlargement: true }).webp({ quality: 68 }).toFile(path.join(PUBLIC, file))
  mediaMap[k] = file
  return file
}

/** -> base URL; variants live at `${base}-480.webp`, `-800.webp` and `-1200.webp` */
async function media(src, folder) {
  if (mediaMap[src]) return mediaMap[src]
  const buf = await loadSource(src)
  const img = sharp(buf, { failOn: 'none' }).rotate()
  const fp = await img.clone().resize(12, 12, { fit: 'fill' }).greyscale().raw().toBuffer()
  const hash = crypto.createHash('sha1').update(fp).digest('hex').slice(0, 10)
  const base = `/media/v/${folder}/${hash}`
  fs.mkdirSync(path.join(PUBLIC, path.dirname(base)), { recursive: true })
  for (const [w, q] of [[480, 70], [800, 72], [1200, 76]]) {
    const out = path.join(PUBLIC, `${base}-${w}.webp`)
    if (!fs.existsSync(out)) await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: q }).toFile(out)
  }
  mediaMap[src] = base
  return base
}

async function pool(items, n, fn) {
  const res = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++
        res[k] = await fn(items[k], k)
      }
    }),
  )
  return res
}

const clean = (s) => (s || '').replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim()

// Default order: main markets first, Tilda order (newest first) inside each country
const RANK = { pl: 0, de: 1, cz: 2, lt: 3, nl: 4, sk: 5, ro: 6, hu: 7, gr: 8, it: 9, be: 10, lv: 11, at: 12, gb: 13, fr: 14, ca: 15 }
const now = new Date().toISOString()
const vacancies = []
let n = 0
const closed = []
const work = async (r) => {
  const photos = r.active
    ? [...new Set((await pool(r.photos || [], 4, (s) => media(s, r.id).catch((e) => (console.warn('!', e.message), null)))).filter(Boolean))]
    : (await pool((r.photos || []).slice(0, 1), 1, (s) => single(s, r.id).catch((e) => (console.warn('!', e.message), null)))).filter(Boolean)
  const housingPhotos = r.active
    ? [...new Set((await pool(r.housingPhotos || [], 4, (s) => media(s, r.id).catch(() => null))).filter(Boolean))].filter((u) => !photos.includes(u))
    : []
  return { photos, housingPhotos }
}
// closed vacancies first, 6 at a time (one picture each)
const closedRaw = RAW.filter((r) => !r.active)
const closedMedia = await pool(closedRaw, 6, async (r, i) => {
  const m = await work(r)
  if (i % 50 === 0) {
    saveMap()
    process.stdout.write(`closed ${i}/${closedRaw.length}\n`)
  }
  return m
})
saveMap()
const closedById = new Map(closedRaw.map((r, i) => [r.id, closedMedia[i]]))
for (const r of RAW) {
  n++
  const { photos, housingPhotos } = r.active ? await work(r) : closedById.get(r.id)
  saveMap()
  // catalog cards without a post (their Tilda link is dead) are old evergreen listings — not «new»
  const created = r.date ? `${r.date}T09:00:00.000Z` : '2021-09-01T09:00:00.000Z'
  ;(r.active ? vacancies : closed).push({
    id: r.id,
    path: r.path,
    active: r.active,
    hot: r.hot,
    order: (RANK[r.country] ?? 20) * 1000 + n,
    country: r.country,
    title: clean(r.title),
    company: clean(r.company),
    city: clean(r.city),
    ...(r.hubCity ? { hubCity: r.hubCity } : {}),
    category: r.category,
    genders: ['men', 'women', 'couples'],
    salary: { ...r.salary, text: clean(r.salary.text) },
    schedule: clean(r.schedule),
    contract: clean(r.contract),
    housing: clean(r.housing),
    housingFree: r.housingFree,
    headline: '',
    intro: clean(r.intro),
    sections: r.sections.map((s) => ({ title: clean(s.title), items: s.items.map(clean).filter(Boolean) })).filter((s) => s.items.length),
    photos,
    housingPhotos,
    housingNote: clean(r.housingNote),
    ...(r.videos?.length ? { videos: r.videos } : {}),
    logo: '',
    reviews: (r.reviews || []).map((x) => ({ name: clean(x.name), text: clean(x.text), ...(x.rating ? { rating: x.rating } : {}) })),
    seoTitle: '',
    seoDescription: tildaDescr(r.tildaUid),
    tildaUid: r.tildaUid ?? undefined,
    ...(r.lang === 'ru' ? { lang: 'ru' } : {}),
    createdAt: created,
    updatedAt: now,
  })
  if (r.active) process.stdout.write(`${r.id} photos:${photos.length} housing:${housingPhotos.length}\n`)
}

// Russian texts of the open vacancies (out/vacancies.ru.json, keyed by id) → data.ru → pages at /ru + Tilda address
const RU_FILE = path.join(HERE, 'out/vacancies.ru.json')
if (fs.existsSync(RU_FILE)) {
  const ru = JSON.parse(fs.readFileSync(RU_FILE, 'utf8'))
  let k = 0
  for (const v of vacancies) if (ru[v.id]?.title && v.lang !== 'ru') (v.ru = sanitizeVacancy(ru[v.id])), k++
  console.log('ru texts', k)
}
// photos from the agency's Telegram: housing → the housing block only, workplace → the gallery (after Tilda's)
const TG = (f) => (fs.existsSync(path.join(HERE, 'out', f)) ? JSON.parse(fs.readFileSync(path.join(HERE, 'out', f), 'utf8')) : {})
const tgHousing = TG('telegram-housing.json')
const tgWork = TG('telegram-work.json')
const noteRu = (s) =>
  s.replace('Варіант житла на одному з заїздів під цю вакансію', 'Вариант жилья на одном из заездов по этой вакансии').replace('фото надіслали наші клієнти', 'фото прислали наши клиенты').replace('Фото з місця роботи від наших клієнтів', 'Фото с места работы от наших клиентов')
for (const v of vacancies) {
  const h = tgHousing[v.id]
  if (h?.photos?.length) {
    v.housingPhotos = [...new Set([...v.housingPhotos, ...h.photos])]
    if (!v.housingNote && h.note) {
      v.housingNote = h.note
      if (v.ru) v.ru.housingNote = noteRu(h.note)
    }
  }
  const w = tgWork[v.id]
  if (w?.photos?.length) v.photos = [...new Set([...v.photos, ...w.photos])]
}
for (const list of [vacancies, closed]) for (let i = 0; i < list.length; i++) list[i] = fixVacancy({ ...sanitizeVacancy(list[i]), ...(list[i].ru ? { ru: list[i].ru } : {}) })
// a fix may close a vacancy (duplicate copies) — it moves to the archive, its page stays
for (let i = vacancies.length - 1; i >= 0; i--) if (!vacancies[i].active) closed.push(...vacancies.splice(i, 1))
// descriptions written from each vacancy's own facts where Tilda had none (out/intros.json, 2026-10-06)
const INTROS = fs.existsSync(path.join(HERE, 'out/intros.json')) ? JSON.parse(fs.readFileSync(path.join(HERE, 'out/intros.json'), 'utf8')) : {}
for (const v of [...vacancies, ...closed]) {
  const x = INTROS[v.id]
  if (!x) continue
  if (!v.intro?.trim() || v.intro.trim().split(/\s+/).length < 8) v.intro = x.intro
  if (x.introRu && v.ru && !(v.ru.intro || '').trim()) v.ru.intro = x.introRu
  if (x.sections?.length && !v.sections.length) v.sections = x.sections
}
console.log('distinct titles for duplicates', distinctTitles([vacancies, closed]))
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(vacancies, null, 1))
fs.mkdirSync(path.dirname(OUT_CLOSED), { recursive: true })
fs.writeFileSync(OUT_CLOSED, JSON.stringify(closed))
console.log('written', vacancies.length, '->', OUT, '| closed', closed.length, '->', OUT_CLOSED)
