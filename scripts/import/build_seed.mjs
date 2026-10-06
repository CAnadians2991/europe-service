// out/vacancies.raw.json (extract_es_vacancies.py) -> src/data/vacancies.seed.json + WebP photos in public/media/v.
// Photos come from Tilda's CDN (static.tildacdn.com); out/media-map.json remembers what is already converted.
// Run: node scripts/import/build_seed.mjs
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'

const HERE = import.meta.dirname
const EXPORT = path.resolve(HERE, '../../../tilda-export/project1613842')
const RAW = JSON.parse(fs.readFileSync(path.join(HERE, 'out/vacancies.raw.json'), 'utf8'))
const MAP_FILE = path.join(HERE, 'out/media-map.json')
const OUT = path.resolve(HERE, '../../src/data/vacancies.seed.json')
const PUBLIC = path.resolve(HERE, '../../public')

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
for (const r of RAW) {
  n++
  const photos = [...new Set((await pool(r.photos || [], 4, (s) => media(s, r.id).catch((e) => (console.warn('!', e.message), null)))).filter(Boolean))]
  const housingPhotos = [...new Set((await pool(r.housingPhotos || [], 4, (s) => media(s, r.id).catch(() => null))).filter(Boolean))].filter(
    (u) => !photos.includes(u),
  )
  saveMap()
  // catalog cards without a post (their Tilda link is dead) are old evergreen listings — not «new»
  const created = r.date ? `${r.date}T09:00:00.000Z` : '2021-09-01T09:00:00.000Z'
  vacancies.push({
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
    seoDescription: '',
    tildaUid: r.tildaUid ?? undefined,
    createdAt: created,
    updatedAt: now,
  })
  process.stdout.write(`${r.id} photos:${photos.length} housing:${housingPhotos.length}\n`)
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(vacancies, null, 1))
console.log('written', vacancies.length, '->', OUT)
