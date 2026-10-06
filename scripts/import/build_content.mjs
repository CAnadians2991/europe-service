// scripts/import/out/*.json (extract_*.py) -> src/data/content/*.json with images converted to WebP in public/media/c,
// plus the hreflang pairs (twins.json) and the redirect maps for old Tilda URLs.
// Run: node scripts/import/build_content.mjs
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'

const HERE = import.meta.dirname
const EXPORT = path.resolve(HERE, '../../../tilda-export/project1613842')
const PUBLIC = path.resolve(HERE, '../../public')
const OUTDIR = path.resolve(HERE, '../../src/data/content')
const DATA = path.resolve(HERE, '../../src/data')
const OUT = path.join(HERE, 'out')
fs.mkdirSync(OUTDIR, { recursive: true })

const MAP_FILE = path.join(OUT, 'content-media-map.json')
const cache = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {}
const save = () => fs.writeFileSync(MAP_FILE, JSON.stringify(cache, null, 1))
const read = (f) => JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'))
const exists = (f) => fs.existsSync(path.join(OUT, f))

async function load(src) {
  if (/^https?:/.test(src)) {
    const url = src.replace('static.tildacdn.one', 'static.tildacdn.com')
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 ES-migration' } })
        if (!r.ok) throw new Error(`${r.status} ${url}`)
        return Buffer.from(await r.arrayBuffer())
      } catch (e) {
        if (i === 2) throw e
        await new Promise((res) => setTimeout(res, 1500 * (i + 1)))
      }
    }
  }
  return fs.readFileSync(path.join(EXPORT, src))
}

const isImageRef = (s) =>
  typeof s === 'string' &&
  (/^images\/[^\s]+\.(png|jpe?g|webp|gif|svg)$/i.test(s) || /^https?:\/\/(static|thb)\.tildacdn\.(com|one)\/[^\s]+\.(png|jpe?g|webp|gif|svg)$/i.test(s))
const isFileRef = (s) => typeof s === 'string' && /^files\/[^\s]+$/.test(s)

async function convert(src) {
  if (cache[src]) return cache[src]
  try {
    if (/\.svg$/i.test(src)) {
      const buf = await load(src)
      const name = path.basename(src).replace(/^tild[0-9a-f-]+__/, '')
      const dest = `/media/c/${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8)}-${name}`
      fs.mkdirSync(path.join(PUBLIC, 'media/c'), { recursive: true })
      fs.writeFileSync(path.join(PUBLIC, dest), buf)
      return (cache[src] = dest)
    }
    const buf = await load(src)
    const img = sharp(buf, { failOn: 'none', animated: false }).rotate()
    const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10)
    const base = `/media/c/${hash}`
    fs.mkdirSync(path.join(PUBLIC, 'media/c'), { recursive: true })
    for (const [w, q] of [[480, 72], [800, 74], [1200, 76]]) {
      const out = path.join(PUBLIC, `${base}-${w}.webp`)
      if (!fs.existsSync(out)) await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: q }).toFile(out)
    }
    return (cache[src] = base)
  } catch (e) {
    console.warn('! image', src, e.message)
    return (cache[src] = '')
  }
}

function copyFile(rel) {
  const from = path.join(EXPORT, rel)
  if (!fs.existsSync(from)) return rel
  const dest = `/files/${path.basename(rel)}`
  fs.mkdirSync(path.join(PUBLIC, 'files'), { recursive: true })
  if (!fs.existsSync(path.join(PUBLIC, dest))) fs.copyFileSync(from, path.join(PUBLIC, dest))
  return dest
}

let jobs = 0
async function walk(node) {
  if (isImageRef(node)) {
    jobs++
    return convert(node)
  }
  if (isFileRef(node)) return copyFile(node)
  if (Array.isArray(node)) {
    const out = []
    for (const x of node) out.push(await walk(x))
    // image blocks whose picture failed to convert are dropped
    return out.filter((x) => !(x && typeof x === 'object' && x.type === 'img' && !x.src))
  }
  if (node && typeof node === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(node)) {
      if (k === 'source' || k === '_source') continue
      out[k] = await walk(v)
    }
    return out
  }
  return node
}

async function build(name, data) {
  const res = await walk(data)
  fs.writeFileSync(path.join(OUTDIR, `${name}.json`), JSON.stringify(res, null, 1))
  save()
  console.log(name, 'ok')
  return res
}

// ---- content files ----
const articles = exists('articles.json') ? read('articles.json') : { articles: [], redirects: [] }
const landings = exists('landings.json') ? read('landings.json') : { landings: [], redirects: [] }
// a page that only copies another one (wrong-language text at a Tilda address) → 301 to the original
for (const l of landings.landings.filter((x) => x.duplicateOf)) (landings.redirects ||= []).push({ source: l.path, destination: l.duplicateOf })
landings.landings = landings.landings.filter((x) => !x.duplicateOf)
await build('articles', { articles: articles.articles })
await build('landings', { landings: landings.landings })
for (const f of ['home', 'pages', 'services', 'reviews', 'legal', 'quizzes']) if (exists(`${f}.json`)) await build(f, read(`${f}.json`))

// ---- hreflang pairs: uk path -> ru path (landings + articles that carry `twin`) ----
const twins = {}
for (const x of [...landings.landings, ...articles.articles]) {
  if (!x.twin) continue
  if (x.lang === 'uk') twins[x.path] = x.twin
  else if (!Object.values(twins).includes(x.path)) twins[x.twin] = x.path
}
fs.writeFileSync(path.join(OUTDIR, 'twins.json'), JSON.stringify(twins, null, 1))
console.log('twins', Object.keys(twins).length)

// ---- redirects ----
// exact old paths -> new paths (Tilda page files, technical pages, /vakansii/*, landing/article path changes)
const live = new Set([...landings.landings.map((l) => l.path), ...articles.articles.map((a) => a.path)])
const redirects = new Map()
const add = (source, destination) => {
  if (!source || !destination) return
  const s = source.replace(/\/+$/, '') || '/'
  const d = destination.replace(/\/+$/, '') || '/'
  if (s === d || s === '/' || live.has(s)) return
  if (/\/tpost\//.test(s)) return // handled by tpost-redirects.json (by post uid)
  if (!redirects.has(s.toLowerCase())) redirects.set(s.toLowerCase(), { source: s, destination: d })
}
for (const r of landings.redirects || []) add(r.source, r.destination)
if (exists('redirects_pages.json')) for (const r of read('redirects_pages.json')) add(r.source, r.destination)
for (const r of articles.redirects || []) add(r.source, r.destination)
// a destination that itself redirects → follow it (no chains)
const list = [...redirects.values()].map((r) => {
  let d = r.destination
  for (let i = 0; i < 5 && redirects.has(d.toLowerCase()); i++) d = redirects.get(d.toLowerCase()).destination
  return { source: r.source, destination: d }
})
fs.writeFileSync(path.join(DATA, 'legacy-redirects.json'), JSON.stringify(list, null, 1))
console.log('legacy redirects', list.length)

// tpost uid -> new path (vacancies: active page or country page; articles: new article path)
const tpost = exists('tpost-redirects.vacancies.json') ? read('tpost-redirects.vacancies.json') : {}
for (const r of articles.redirects || []) {
  const m = r.source.match(/\/tpost\/([a-z0-9]+)-/)
  if (m) tpost[m[1]] = r.destination
}
fs.writeFileSync(path.join(DATA, 'tpost-redirects.json'), JSON.stringify(tpost))
console.log('tpost redirects', Object.keys(tpost).length, 'images', jobs)
