// Tilda's own permanent redirects (the `R=301` rules in the export's htaccess: old campaign / vacancy / store addresses
// like /tesco, /zara, /busdriver, /vacancies/plukon) → src/data/legacy-redirects.json, so none of them answers 404.
// Bought links point at some of these addresses; Tilda sent them to a page, so do we.
// Each target is resolved the way the site resolves URLs (tpost uid map, legacy map, /pageNNN.html → home) down to the
// final LIVE page, so every source is one hop. A target that no longer exists goes to its nearest live parent.
// Sources that are live pages now (a vacancy card link, a post) are left alone.
// Runs at the end of build_content.mjs (after the Russian pages and text fixes); idempotent. Run alone:
//   node scripts/import/tilda_301.mjs
import fs from 'node:fs'
import path from 'node:path'

const HERE = import.meta.dirname
const ROOT = path.resolve(HERE, '../..')
const DATA = path.join(ROOT, 'src/data')
const C = path.join(DATA, 'content')
const HTACCESS = path.resolve(ROOT, '../tilda-export/project1613842/htaccess')
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))

if (!fs.existsSync(HTACCESS)) {
  console.log('tilda 301: no htaccess (', HTACCESS, ')')
} else {
  // ---- every address the site answers with a page ----
  const live = new Set()
  const addLive = (p) => p && live.add(p.toLowerCase())
  for (const l of rd(path.join(C, 'landings.json')).landings) addLive(l.path)
  for (const a of rd(path.join(C, 'articles.json')).articles) addLive(a.path)
  for (const d of rd(path.join(C, 'legal.json'))) addLive(d.path)
  for (const q of rd(path.join(C, 'quizzes.json'))) addLive(q.path)
  for (const p of rd(path.join(C, 'visa.json')).pages ?? []) addLive(p.path)
  for (const p of Object.values(rd(path.join(C, 'pages.json')))) if (p?.path && !p.broken) addLive(p.path)
  const seed = rd(path.join(DATA, 'vacancies.seed.json'))
  const closedFile = path.join(ROOT, 'data/vacancies.closed.json')
  const closed = fs.existsSync(closedFile) ? rd(closedFile) : []
  for (const v of [...seed, ...closed]) {
    addLive(v.path)
    // the Russian page of a translated vacancy: /ru + its address (src/lib/vacancy-i18n.ts hasRu)
    if (v.ru?.title && v.lang !== 'ru') addLive('/ru' + v.path)
  }
  // route files (src/app) and the country pages of src/lib/site.ts
  for (const p of ['/', '/ru', '/vacancies', '/about', '/contacts', '/poslugi', '/vidguki', '/news', '/pidbir', '/cooperation', '/spivpratsya', '/oplata', '/links',
    '/ru/about', '/ru/contacts', '/ru/services', '/ru/otzyvy', '/ru/news', '/ru/podbor', '/ru/sotrudnichestvo', '/ru/oplata', '/pl/wspolpraca',
    '/vacancies/aktualni_vakansii', '/ru/vacancies/aktualni_vakansii'])
    addLive(p)
  const site = fs.readFileSync(path.join(ROOT, 'src/lib/site.ts'), 'utf8')
  for (const m of site.matchAll(/code: '[a-z]{2}',[^}]*?path: '([^']+)'/g)) addLive(m[1]), addLive('/ru' + m[1])

  const legacyFile = path.join(DATA, 'legacy-redirects.json')
  const tpostFile = path.join(DATA, 'tpost-redirects.json')
  const legacyList = rd(legacyFile)
  const tpost = rd(tpostFile)
  const legacy = new Map(legacyList.map((r) => [r.source.toLowerCase(), r]))

  const clean = (p) => {
    let s = p
    try {
      s = decodeURI(p)
    } catch {}
    return s.replace(/^https?:\/\/(?:www\.)?europeservice\.com\.ua/i, '').replace(/\/+$/, '') || '/'
  }
  /** the site's own resolution (src/lib/legacy-urls.ts): tpost uid → its page, legacy map, Tilda page files → home */
  function resolve(p0) {
    let p = clean(p0)
    for (let i = 0; i < 8; i++) {
      const uid = p.match(/\/tpost\/([a-z0-9]+)(?:-|$)/i)?.[1]?.toLowerCase()
      if (uid && tpost[uid] && tpost[uid].toLowerCase() !== p.toLowerCase()) {
        p = tpost[uid]
        continue
      }
      if (/\/tproduct\//i.test(p)) return p.startsWith('/ru/') ? '/ru/vacancies/aktualni_vakansii' : '/vacancies/aktualni_vakansii'
      const lg = legacy.get(p.toLowerCase())
      if (lg && lg.destination.toLowerCase() !== p.toLowerCase()) {
        p = lg.destination
        continue
      }
      if (/^(?:\/ru)?\/page\d+\.html$/i.test(p)) return '/'
      break
    }
    return p
  }
  /** a page that no longer exists → its nearest live parent (as the site's own fallbacks: /ru/news, /news, the catalog) */
  function liveTarget(p) {
    if (live.has(p.toLowerCase())) return p
    if (/\/tpost\//i.test(p)) return p.startsWith('/ru/') ? '/ru/news' : p.includes('/news/') ? '/news' : '/vacancies/aktualni_vakansii'
    let q = p
    while (q.lastIndexOf('/') > 0) {
      q = q.slice(0, q.lastIndexOf('/'))
      if (live.has(q.toLowerCase())) return q
    }
    return p.startsWith('/ru/') ? '/ru' : '/'
  }

  // ---- the rules ----
  const rules = []
  for (const line of fs.readFileSync(HTACCESS, 'utf8').split('\n')) {
    const m = line.trim().match(/^RewriteRule\s+\^(.*?)\$\s+(\S+)\s+\[([^\]]*)\]/)
    if (!m || !/R=301/.test(m[3]) || m[1] === '(.*)') continue
    const source = '/' + m[1].replace(/\/+$/, '').replace(/\\(.)/g, '$1')
    const target = m[2].replace(/\\(.)/g, '$1')
    if (source !== '/') rules.push({ source, target })
  }
  let added = 0, retargeted = 0, kept = 0, liveSrc = 0, tpostFixed = 0
  const GENERIC = new Set(['/', '/ru', '/vacancies/aktualni_vakansii', '/ru/vacancies/aktualni_vakansii', '/news', '/ru/news'])
  for (const { source, target } of rules) {
    const s = source.toLowerCase()
    const dest = liveTarget(resolve(target))
    const uid = s.match(/\/tpost\/([a-z0-9]+)(?:-|$)/)?.[1]
    if (uid && tpost[uid]) {
      // a post the site already maps by uid: follow Tilda when Tilda named a specific live page and we only had a fallback
      if (GENERIC.has(tpost[uid]) && !GENERIC.has(dest) && tpost[uid] !== dest) (tpost[uid] = dest), tpostFixed++
      // the uid map is applied by src/proxy.ts, which does not run under /uploads, /media, /files …
      if (!/^\/(?:uploads|media|files|brand|api)\//.test(s)) continue
    }
    if (live.has(s)) {
      liveSrc++
      continue
    }
    if (dest.toLowerCase() === s) continue
    const had = legacy.get(s)
    if (had) {
      if (had.destination !== dest && !GENERIC.has(dest) && GENERIC.has(resolve(had.destination))) (had.destination = dest), retargeted++
      else kept++
      continue
    }
    const r = { source, destination: dest }
    legacyList.push(r)
    legacy.set(s, r)
    added++
    // src/proxy.ts (which also answers «…/» and upper-case variants) does not run for these paths — only next.config's
    // exact rules do, so the trailing-slash form gets its own rule
    if (/^\/(?:uploads|media|files|brand)\/|\.[a-z0-9]{2,5}$/i.test(source) && !legacy.has(s + '/')) {
      const r2 = { source: source + '/', destination: dest }
      legacyList.push(r2)
      legacy.set(s + '/', r2)
    }
  }
  // no chains: every destination is final (a destination that is itself a source → its destination)
  for (const r of legacyList) {
    let d = r.destination
    for (let i = 0; i < 8 && legacy.has(d.toLowerCase()) && legacy.get(d.toLowerCase()) !== r; i++) d = legacy.get(d.toLowerCase()).destination
    r.destination = d
  }
  fs.writeFileSync(legacyFile, JSON.stringify(legacyList, null, 1))
  // same layout as the committed file ({"uid": "/path", …} on one line) so a rebuild does not rewrite it
  fs.writeFileSync(tpostFile, '{' + Object.entries(tpost).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ') + '}')
  console.log(`tilda 301: ${rules.length} rules → ${added} added, ${retargeted} retargeted, ${kept} already redirected, ${liveSrc} sources are live pages, ${tpostFixed} post uids follow Tilda's target`)
}
