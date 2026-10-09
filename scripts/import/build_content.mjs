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

/* Tilda URLs stay exactly as they were (years of bought links point at them):
   - feed posts (articles) keep /news/tpost/<uid>-<slug>, /ru/tpost/… — the address in Tilda's sitemap-feed-*.xml;
   - landings keep /vakansii/hungary, /ru/vacanciesrabota_v_polshe_mekanikom …, duplicates included. */
const TILDA_DATA = path.resolve(HERE, '../../../tilda-data')
const sitemapPath = {}
for (const f of fs.readdirSync(path.join(TILDA_DATA, 'sitemaps')).filter((x) => x.startsWith('sitemap-feed-'))) {
  for (const m of fs.readFileSync(path.join(TILDA_DATA, 'sitemaps', f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const uid = m[1].match(/\/tpost\/([a-z0-9]+)-/)?.[1]
    if (uid) sitemapPath[uid] = m[1].replace(/^https?:\/\/[^/]+/, '')
  }
}
const tildaAliases = new Set(JSON.parse(fs.readFileSync(path.join(TILDA_DATA, 'pages.json'), 'utf8')).filter((p) => p.alias).map((p) => '/' + p.alias))
const rename = new Map() // new path the import invented -> Tilda path
const articleTpost = {} // uid -> page that answers it
for (const r of articles.redirects || []) {
  const uid = r.source.match(/\/tpost\/([a-z0-9]+)-/)?.[1]
  if (!uid) continue
  const canonical = sitemapPath[uid] || r.source
  if (tildaAliases.has(r.destination)) articleTpost[uid] = r.destination // teaser post of a page article
  else {
    rename.set(r.destination, canonical)
    articleTpost[uid] = canonical
  }
}
for (const l of landings.landings) if (l.oldPath && l.oldPath !== l.path) rename.set(l.path, l.oldPath)
const renamePaths = (node) => {
  if (typeof node === 'string') {
    if (rename.has(node)) return rename.get(node)
    return node.replace(/\]\((\/[^)\s]+)\)/g, (m, p) => (rename.has(p) ? `](${rename.get(p)})` : m))
  }
  if (Array.isArray(node)) return node.map(renamePaths)
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, renamePaths(v)]))
  return node
}
articles.articles = renamePaths(articles.articles)
landings.landings = renamePaths(landings.landings).map(({ oldPath, duplicateOf, ...l }) => l)
landings.redirects = []
console.log('paths restored to Tilda:', rename.size)

// ---- language QA (out/lang-fix.json): whole fields replaced per page, home by dotted path ----
const setPath = (obj, dotted, val) => {
  const keys = dotted.split('.')
  let o = obj
  for (const k of keys.slice(0, -1)) o = o?.[/^\d+$/.test(k) ? +k : k]
  if (o && typeof o === 'object') o[keys.at(-1)] = val
}
const patchByPath = (list, patch = {}) => {
  let n = 0
  for (const x of list) if (patch[x.path]) Object.assign(x, patch[x.path]), n++
  return n
}
const extra = { home: null, pages: null }
// Pages that keep the text Tilda had, in Tilda's language (owner, 2026-10: old pages keep their SEO text one-to-one);
// only the interface language follows the address.
const KEEP_TILDA_TEXT = new Set([
  '/vacancies/chekhiia/brno',
  '/ru/vacancies/rabota_v_polshe_po_biometrii',
  '/ru/rabota-za-granicej-vsya-vazhnaya-informaciya-dlya-ukraincev',
  '/ru/ua_kontrakt',
  // the language QA rewrote most of these texts / their Tilda headings
  '/ru/vacancies/greece',
  '/news/tpost/51a3b7jb7r-yak-zdisniti-oplatu-v-dodatku-privat24',
  '/tpost/x2djeolmbn-mogu-li-ya-viehat-na-rabotu-v-polshu-esl',
  '/tpost/l84rx32a91-scho-robiti-z-grivnyami-ta-ukranskimi-ra',
])
const onlyLang = (patch = {}) =>
  Object.fromEntries(Object.entries(patch).map(([p, v]) => [p, KEEP_TILDA_TEXT.has(p) ? (v.lang ? { lang: v.lang } : {}) : v]))
if (exists('lang-fix.json')) {
  const fix = read('lang-fix.json')
  console.log('lang-fix landings', patchByPath(landings.landings, onlyLang(fix.landings)), 'articles', patchByPath(articles.articles, onlyLang(fix.articles)))
  extra.pages = fix.pages
  extra.home = fix.home
}
// ---- SEO pass 2026 (out/seo.*.json): texts for thin pages appended (Tilda text stays first), new pages added ----
if (exists('seo.patch.landings.json')) {
  const P = read('seo.patch.landings.json')
  let n = 0
  for (const l of landings.landings) {
    const p = P[l.path]
    if (!p) continue
    const { blocksAppend, faq, ...rest } = p
    // only what the Tilda page did not have: its title, description and intro stay as on Tilda (owner, 2026-10)
    for (const [k, v] of Object.entries(rest)) if (!l[k]) l[k] = v
    if (blocksAppend?.length) l.blocks = [...(l.blocks ?? []), ...blocksAppend]
    if (faq?.length) {
      const have = new Set((l.faq ?? []).map((f) => f.q))
      l.faq = [...(l.faq ?? []), ...faq.filter((f) => !have.has(f.q))]
    }
    n++
  }
  console.log('seo patch', n, 'of', Object.keys(P).length)
}
if (exists('seo.new-landings.json')) {
  const have = new Set(landings.landings.map((l) => l.path))
  const add = read('seo.new-landings.json').filter((l) => !have.has(l.path))
  // the free-housing hub lists only vacancies with free housing
  for (const l of add) if (/\/(z-zhytlom|s-zhilem)$/.test(l.path)) l.filter = { ...l.filter, housingFree: true }
  landings.landings.push(...add)
  console.log('seo new pages', add.length)
}
// Tilda text records the landing import lost (out/tilda-meta.json → restore, see extract_tilda_meta.py): back in front
if (exists('tilda-meta.json')) {
  const R = read('tilda-meta.json').restore ?? {}
  for (const l of landings.landings) if (R[l.path]?.blocks?.length) l.blocks = [...R[l.path].blocks, ...(l.blocks ?? [])]
  console.log('tilda text restored', Object.keys(R).filter((p) => landings.landings.some((l) => l.path === p)).length)
}
// Tilda's near-copies: both stay online, one is canonical
const CANONICAL = { '/vacancies/chekhiia/brno': '/vacancies/chekhiia/robota_v_brno' }
for (const l of landings.landings) if (CANONICAL[l.path]) l.canonical = CANONICAL[l.path]

await build('articles', { articles: articles.articles })
await build('landings', { landings: landings.landings })
// the Tilda privacy template cited a Russian law — Ukrainian company, Ukrainian law
const LEGAL_FIX = [['Федерального закону від 27.07.2006. №152-ФЗ «Про персональні дані»', 'Закону України «Про захист персональних даних» від 01.06.2010 № 2297-VI']]
const patchFile = (f, data) => {
  // the visa package: 15 000 грн since 2026-10 (owner), with its own landing
  if (f === 'services')
    for (const [lang, title, href] of [['uk', 'Польська робоча віза на 1 рік', '/robocha-viza-v-polshchu'], ['ru', 'Польская рабочая виза на 1 год', '/ru/rabochaya-viza-v-polshu']])
      for (const p of data[lang]?.packages ?? []) if (p.title === title) Object.assign(p, { price: '15 000 грн', href })
  if (f === 'legal') {
    let s = JSON.stringify(data)
    for (const [a, b] of LEGAL_FIX) s = s.split(a).join(b)
    data = JSON.parse(s)
  }
  if (f === 'pages' && extra.pages) for (const [k, v] of Object.entries(extra.pages)) if (data[k]) Object.assign(data[k], v)
  if (f === 'home' && extra.home) for (const [lang, fields] of Object.entries(extra.home)) for (const [k, v] of Object.entries(fields)) setPath(data[lang], k, v)
  return data
}
// reviews from the agency's Telegram (out/telegram-reviews.json, real message dates) go first, newest on top
const dmy = (d) => (d && /^\d{2}\.\d{2}\.\d{4}$/.test(d) ? d.split('.').reverse().join('') : '')
const withTelegram = (list) => {
  if (!exists('telegram-reviews.json')) return list
  const tg = read('telegram-reviews.json').map(({ _src, _note, poster, employer, country, ...r }) => ({
    ...r,
    vacancy: employer && r.vacancy && !r.vacancy.includes(employer) ? `${r.vacancy} ${employer}` : r.vacancy || employer,
  }))
  return [...tg, ...list].sort((a, b) => dmy(b.date).localeCompare(dmy(a.date))).map(ruStamp)
}
// the stamp under a Russian review (vacancy · place) in Russian
const RU_STAMP = {
  'Офіціант у готелі': 'Официант в отеле',
  'Покоївка в готелі Lake Hill Mazury': 'Горничная в отеле Lake Hill Mazury',
  'Покоївка на віллах': 'Горничная на виллах',
  'Працівник птахофабрики': 'Работник птицефабрики',
  'Працівник складу брендового одягу': 'Работник склада брендовой одежды',
  'Працівник складу брендового одягу ID Logistics (Zara)': 'Работник склада брендовой одежды ID Logistics (Zara)',
  'Різноробочий на фабрику з упаковки курячого мʼяса': 'Разнорабочий на фабрику по упаковке куриного мяса',
  'о. Наксос': 'о. Наксос',
  'околиці Мюнхена': 'окрестности Мюнхена',
  'Збирач замовлень на складі зоотоварів Dirks': 'Сборщик заказов на складе зоотоваров Dirks',
  'Оператор верстатів з ЧПУ на автозавод D&H': 'Оператор станков с ЧПУ на автозавод D&H',
  'Покоївка в готелі': 'Горничная в отеле',
  'Працівник виробництва FORVIA': 'Работник производства FORVIA',
  'Працівник виробництва сухих сніданків SANTE': 'Работник производства сухих завтраков SANTE',
  'Працівник готелю': 'Работник отеля',
  'Працівник на виробництво картону': 'Работник на производство картона',
  'Працівник на виробництві пінопласту Amitec': 'Работник на производстве пенопласта Amitec',
  'Працівник складу косметики Notino': 'Работник склада косметики Notino',
  'Працівник складу одягу Shein': 'Работник склада одежды Shein',
  'Працівник складу продуктового інтернет-магазину Kifli': 'Работник склада продуктового интернет-магазина Kifli',
  'о. Крит': 'о. Крит',
}
// Russian reviews and the video reviews (shown on both sites)
function ruStamp(r) {
  if (r.lang !== 'ru' && !r.video) return r
  const out = { ...r }
  if (r.vacancy && RU_STAMP[r.vacancy]) out.vacancyRu = RU_STAMP[r.vacancy]
  if (r.city && RU_STAMP[r.city]) out.cityRu = RU_STAMP[r.city]
  return out
}
for (const f of ['home', 'pages', 'services', 'reviews', 'legal', 'quizzes'])
  if (exists(`${f}.json`)) await build(f, patchFile(f, renamePaths(f === 'reviews' ? withTelegram(read(`${f}.json`)) : read(`${f}.json`))))

// ---- hreflang pairs: uk path -> ru path (landings + articles that carry `twin`) ----
const twins = {}
for (const x of [...landings.landings, ...articles.articles]) {
  if (!x.twin) continue
  if (x.lang === 'uk') twins[x.path] = x.twin
  else if (!Object.values(twins).includes(x.path)) twins[x.twin] = x.path
}
// Russian pages of translated vacancies (/ru + Tilda address) — ukTwin needs the list without loading the seed
const SEED = path.join(DATA, 'vacancies.seed.json')
if (fs.existsSync(SEED)) twins.vacancyRu = JSON.parse(fs.readFileSync(SEED, 'utf8')).filter((v) => v.ru?.title && v.lang !== 'ru').map((v) => '/ru' + v.path)
fs.writeFileSync(path.join(OUTDIR, 'twins.json'), JSON.stringify(twins, null, 1))
console.log('twins', Object.keys(twins).length)

// ---- redirects ----
// exact old paths -> new paths (Tilda page files, technical pages, /vakansii/*, landing/article path changes)
const live = new Set([...landings.landings.map((l) => l.path), ...articles.articles.map((a) => a.path), '/vacancies/aktualni_vakansii', '/ru/vacancies/aktualni_vakansii'])
const redirects = new Map()
const add = (source, destination) => {
  if (!source || !destination) return
  const s = source.replace(/\/+$/, '') || '/'
  let d = destination.replace(/\/+$/, '') || '/'
  d = rename.get(d) ?? (d === '/vacancies/all' ? '/vacancies/aktualni_vakansii' : d === '/ru/vacancies/all' ? '/ru/vacancies/aktualni_vakansii' : d)
  if (s === d || s === '/' || live.has(s)) return
  if (/\/tpost\//.test(s)) return // handled by tpost-redirects.json (by post uid)
  if (!redirects.has(s.toLowerCase())) redirects.set(s.toLowerCase(), { source: s, destination: d })
}
for (const r of landings.redirects || []) add(r.source, r.destination)
if (exists('redirects_pages.json')) for (const r of read('redirects_pages.json')) add(r.source, r.destination)
// links inside old articles to Tilda store pages that no longer exist (QA crawl 2026-10-06)
add('/vacancies/h-m', '/vacancies/hm')
add('/ru/vacancies/rhenusgroup', '/ru/vacancies/aktualni_vakansii')
// (article redirects are now handled per post uid in tpost-redirects.json)
// a destination that itself redirects → follow it (no chains)
const list = [...redirects.values()].map((r) => {
  let d = r.destination
  for (let i = 0; i < 5 && redirects.has(d.toLowerCase()); i++) d = redirects.get(d.toLowerCase()).destination
  return { source: r.source, destination: d }
})
fs.writeFileSync(path.join(DATA, 'legacy-redirects.json'), JSON.stringify(list, null, 1))
console.log('legacy redirects', list.length)

// tpost uid -> new path (vacancies: active page or country page; articles: new article path)
const tpost = { ...(exists('tpost-redirects.vacancies.json') ? read('tpost-redirects.vacancies.json') : {}), ...articleTpost }
// a post whose Tilda address was broken (spaces, emoji) — see FIX_FN in sanitize.mjs
tpost.o9yca9j201 = '/tpost/o9yca9j201-legalnaya-rabota-v-gdine-dlya-ukrain'
fs.writeFileSync(path.join(DATA, 'tpost-redirects.json'), JSON.stringify(tpost))
console.log('tpost redirects', Object.keys(tpost).length, 'images', jobs)
await import('./apply_ru_pages.mjs')
await import('./fix_texts.mjs')
// last: Tilda's title / description / H1 / heading levels / robots on every old address, then Tilda's own 301 rules
await import('./tilda_parity.mjs')
await import('./tilda_301.mjs')
