// Owner, 2026-10: every old Tilda address keeps its URL, <title>, meta description, H1–H3, structured data and SEO text
// one-to-one — we only ADD things. Earlier import steps cleaned titles (« | Europe Service», emoji, «!!!»), cut them at
// 70 chars, rewrote descriptions (SEO pass 2026, language QA), promoted Tilda <h3> to <h2> and noindexed Tilda pages.
// This last pass puts Tilda's own values back, from out/tilda-meta.json (scripts/import/extract_tilda_meta.py):
//   title, description (when Tilda had one), the H1 (when ours is not one of Tilda's H1s), h2/h3 levels of the content
//   blocks (when the text is a Tilda heading of a single level) and robots.
// Pages that did not exist on Tilda (Russian copies, new landings, visa pages) are not touched.
// Runs at the end of build_content.mjs; idempotent. Run alone: node scripts/import/tilda_parity.mjs
import fs from 'node:fs'
import path from 'node:path'

const HERE = import.meta.dirname
const C = path.resolve(HERE, '../../src/data/content')
const META = path.join(HERE, 'out/tilda-meta.json')

if (!fs.existsSync(META)) {
  console.log('tilda parity: no out/tilda-meta.json — run scripts/import/extract_tilda_meta.py')
} else {
  const { pages: T, posts: P } = JSON.parse(fs.readFileSync(META, 'utf8'))
  const rd = (f) => JSON.parse(fs.readFileSync(path.join(C, f), 'utf8'))
  const wr = (f, d) => fs.writeFileSync(path.join(C, f), JSON.stringify(d, null, 1))
  const plain = (s) => (s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[\s ]+/g, ' ').trim()
  const key = (s) =>
    plain(s)
      .toLowerCase()
      .replace(/[’‘ʼ`´]/g, "'")
      .replace(/[«»“”„]/g, '"')
  const n = { title: 0, description: 0, h1: 0, levels: 0, robots: 0, related: 0 }
  // Tilda values that belonged to ANOTHER article (copy-paste on Tilda). Owner, 2026-10-12: old pages one-to-one, no
  // exceptions — /skolko-ukraincev-rabotaet-v-polshe-legalno keeps Tilda's «Польща дозволила НЕ проходити обсервацію…»
  // title and /ru/ukraincy-v-polshe-… its (Ukrainian) description. Add a path here only on the owner's word.
  // Owner, 2026-10-13: /ru/vacancies — the year in Tilda's title and description is brought to the current one (2025 → 2026)
  const NOT_TILDA = { '/ru/vacancies': ['title', 'description'] }
  for (const [p, fields] of Object.entries(NOT_TILDA)) for (const f of fields) if (T[p]) T[p][f] = null

  /** h2/h3 blocks (also inside FAQ «details») get the level Tilda gave the same text */
  function fixLevels(blocks, headings) {
    if (!Array.isArray(blocks) || !headings?.length) return
    const lv = new Map()
    for (const [l, t] of headings) {
      const k = key(t)
      if (!lv.has(k)) lv.set(k, new Set())
      lv.get(k).add(l)
    }
    const walk = (list) => {
      for (const b of list) {
        if (b?.type === 'details') walk(b.blocks ?? [])
        if (b?.type !== 'h2' && b?.type !== 'h3') continue
        const ls = [...(lv.get(key(b.text)) ?? [])].filter((l) => l === 2 || l === 3)
        if (ls.length === 1 && b.type !== `h${ls[0]}`) (b.type = `h${ls[0]}`), n.levels++
      }
    }
    walk(blocks)
  }
  const set = (o, k, v, what) => {
    if (v && o[k] !== v) (o[k] = v), n[what]++
  }
  /** our H1 is one of Tilda's H1s, else Tilda's first; a leading content heading that repeats it goes */
  function fixH1(o, k, t, blocksKey = 'blocks') {
    const h1s = t.h1 ?? t.headings?.filter(([l]) => l === 1).map(([, x]) => x) ?? []
    if (!h1s.length || h1s.some((h) => key(h) === key(o[k]))) return
    o[k] = h1s[0]
    n.h1++
    const bl = o[blocksKey]
    if (Array.isArray(bl) && /^h[23]$/.test(bl[0]?.type) && key(bl[0].text) === key(h1s[0])) bl.shift()
  }

  // ---- landings (country / city / job type / profession / ad pages) ----
  const L = rd('landings.json')
  for (const l of L.landings) {
    const t = T[l.path]
    if (!t) continue
    set(l, 'title', t.title, 'title')
    set(l, 'description', t.description, 'description')
    fixH1(l, 'h1', t)
    fixLevels(l.blocks, t.headings)
  }
  wr('landings.json', L)

  // ---- articles: Tilda pages (/news/…, /poland …) and Feeds posts (/news/tpost/…, /tpost/…, /ru/tpost/…) ----
  const A = rd('articles.json')
  for (const a of A.articles) {
    const t = T[a.path]
    const p = P[a.path]
    if (t) {
      set(a, 'seoTitle', t.title, 'title')
      set(a, 'seoDescription', t.description, 'description')
      fixH1(a, 'title', t)
      fixLevels(a.blocks, t.headings)
      // Tilda's «more articles» block had its own <h2> («Читайте так же») — ArticlePage's «more» section takes that text
      const more = t.headings.find(([l, x]) => l === 2 && /^Читайте (так же|также|теж|також)$/i.test(x))
      if (more) set(a, 'relatedTitle', more[1], 'related')
    } else if (p) {
      // a post page: <title> and H1 = the post title, description = the post's own «descr» when it had one
      set(a, 'seoTitle', p.title, 'title')
      set(a, 'title', p.title, 'h1')
      set(a, 'seoDescription', p.descr, 'description')
      fixLevels(a.blocks, p.headings)
    }
  }
  wr('articles.json', A)

  // ---- legal pages, quizzes, other Tilda pages ----
  const G = rd('legal.json')
  for (const d of G) {
    const t = T[d.path]
    if (!t) continue
    set(d, 'seoTitle', t.title, 'title')
    set(d, 'seoDescription', t.description, 'description')
    fixLevels(d.blocks, t.headings)
  }
  wr('legal.json', G)
  const Q = rd('quizzes.json')
  for (const q of Q) {
    const t = T[q.path]
    if (!t) continue
    set(q, 'title', t.title, 'title')
    set(q, 'description', t.description, 'description')
    // Tilda indexed its quiz / form pages (they were not hidden) — so do we
    if (Boolean(q.noindex) !== t.noindex) (t.noindex ? (q.noindex = true) : delete q.noindex), n.robots++
  }
  wr('quizzes.json', Q)
  const PG = rd('pages.json')
  for (const pg of Object.values(PG)) {
    const t = pg?.path && T[pg.path]
    if (!t) continue
    set(pg, 'seoTitle', t.title, 'title')
    set(pg, 'seoDescription', t.description, 'description')
    fixLevels(pg.blocks, t.headings)
  }
  wr('pages.json', PG)

  // ---- Tilda's own JSON-LD (Product + AggregateRating on /, /vacancies, /news; Review on /about, /vidguki, /contacts,
  // /vidguki/greece, /greece_video) → src/data/tilda-jsonld.json, rendered next to ours (src/lib/seo.ts tildaLd).
  // Fixed only: relative image paths → absolute (Tilda's team photo is not used on the new site: a former employee asked
  // not to be shown — the team photo of the About page stands in), and the review rated 1 of 5 under a thank-you text → 5.
  const SITE_URL = 'https://europeservice.com.ua'
  const IMG = (src) =>
    /__logo\.svg$/.test(src) ? `${SITE_URL}/brand/logo.svg` : /^images\//.test(src) ? `${SITE_URL}/media/team/team-awards-1200.webp` : src
  const fixLd = (node) => {
    if (Array.isArray(node)) return node.map(fixLd)
    if (!node || typeof node !== 'object') return typeof node === 'string' ? IMG(node) : node
    const o = Object.fromEntries(Object.entries(node).map(([k, v]) => [k, fixLd(v)]))
    if (o['@type'] === 'Review' && o.reviewRating?.ratingValue === '1' && /подяк|дякую|задоволен|спасиб/i.test(o.description || '')) o.reviewRating = { ...o.reviewRating, ratingValue: '5' }
    return o
  }
  const LD = {}
  // Owner, 2026-10-13: Tilda's «Product» with AggregateRating 5/33 (/, /vacancies, /news) is dropped — a job is not a
  // product and self-served ratings risk a manual action for structured-data spam; the Review blocks stay
  for (const [p, t] of Object.entries(T)) {
    const keep = (t.jsonld ?? []).filter((x) => x['@type'] !== 'Product')
    if (keep.length) LD[p] = keep.map(fixLd)
  }
  fs.writeFileSync(path.resolve(HERE, '../../src/data/tilda-jsonld.json'), JSON.stringify(LD, null, 1) + '\n')
  n.jsonld = Object.keys(LD).length

  console.log('tilda parity:', Object.entries(n).map(([k, v]) => `${k} ${v}`).join(', '))
}
