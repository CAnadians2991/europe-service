// Russian versions of every Ukrainian page that had none (2026-10-06): out/ru-pages.json holds the translated strings
// by pointer ({ "<kind>:<ukPath>": { ruPath, strings: { "blocks.3.text": "…" } } }), extracted from the built content.
// Each Russian page = a copy of the Ukrainian one with those strings, at /ru + the same address, linked both ways
// (twin → hreflang, language switch). Internal links in the copy go to Russian pages where they exist.
// Runs at the end of build_content.mjs (idempotent: pages that already exist are left alone).
import fs from 'node:fs'
import path from 'node:path'

const HERE = import.meta.dirname
const C = path.resolve(HERE, '../../src/data/content')
const SRC = path.join(HERE, 'out/ru-pages.json')
if (!fs.existsSync(SRC)) {
  console.log('ru pages: no out/ru-pages.json')
} else {
  const T = JSON.parse(fs.readFileSync(SRC, 'utf8'))
  const rd = (f) => JSON.parse(fs.readFileSync(path.join(C, f), 'utf8'))
  const wr = (f, d) => fs.writeFileSync(path.join(C, f), JSON.stringify(d, null, 1))
  const articles = rd('articles.json')
  const landings = rd('landings.json')
  const legal = rd('legal.json')
  const quizzes = rd('quizzes.json')
  const pages = rd('pages.json')
  const twins = rd('twins.json')
  const seed = JSON.parse(fs.readFileSync(path.resolve(HERE, '../../src/data/vacancies.seed.json'), 'utf8'))

  // Tilda pages with Russian twins under other slugs (not translated again)
  const PAIRS = { '/vacancies/robota_v_polshchi_po_bometrii': '/ru/vacancies/rabota_v_polshe_po_biometrii', '/vacancies/ua_kontrakt': '/ru/ua_kontrakt' }

  const setPtr = (obj, ptr, val) => {
    const ks = ptr.split('.')
    let o = obj
    for (const k of ks.slice(0, -1)) o = o?.[/^\d+$/.test(k) ? +k : k]
    if (o && typeof o === 'object') o[ks.at(-1)] = val
  }
  const taken = new Set([...articles.articles, ...landings.landings, ...legal, ...quizzes, ...Object.values(pages)].map((x) => x?.path))
  const made = [] // [ukObj, ruObj]
  const make = (kind, uk) => {
    const t = T[`${kind}:${uk.path}`]
    if (!t || taken.has(t.ruPath)) return null
    const ru = structuredClone(uk)
    for (const [ptr, s] of Object.entries(t.strings)) setPtr(ru, ptr, s)
    ru.path = t.ruPath
    ru.lang = 'ru'
    ru.twin = uk.path
    taken.add(ru.path)
    made.push([uk, ru])
    return ru
  }
  const addAll = (list, kind) => {
    const out = []
    for (const x of list) if ((x.lang ?? 'uk') === 'uk' && !x.twin) { const r = make(kind, x); if (r) out.push(r) }
    return out
  }
  articles.articles.push(...addAll(articles.articles, 'article'))
  landings.landings.push(...addAll(landings.landings, 'landing'))
  legal.push(...addAll(legal, 'legal'))
  for (const r of addAll(quizzes, 'quiz')) quizzes.push({ ...r, id: `${r.id}-ru` })
  for (const [k, p] of Object.entries(pages)) {
    if (!p || p.lang !== 'uk' || p.twin) continue
    const r = make('page', p)
    if (r) pages[`${k}_ru`] = r
  }
  for (const [uk, ru] of made) uk.twin = ru.path
  for (const [uk, ru] of Object.entries(PAIRS)) {
    for (const l of [...landings.landings, ...articles.articles]) {
      if (l.path === uk) l.twin = ru
      if (l.path === ru) l.twin = uk
    }
  }

  // hreflang pairs
  const pairs = { ...PAIRS }
  for (const [uk, ru] of made) pairs[uk.path] = ru.path
  Object.assign(twins, pairs)

  // links inside the new Russian pages → Russian twins where they exist
  const STATIC = { '/': '/ru', '/vacancies/aktualni_vakansii': '/ru/vacancies/aktualni_vakansii', '/poslugi': '/ru/services', '/vidguki': '/ru/otzyvy', '/contacts': '/ru/contacts', '/about': '/ru/about', '/pidbir': '/ru/podbor', '/news': '/ru/news' }
  const COUNTRY_RX = /^\/(?:vacancies(?:\/(?:chekhiia|germany|netherlands|romania|lithuania|greece|latvia|austria|italy|belgium|france|canada))?|vakansii\/(?:hungary|slovakia|england))$/
  const vacRu = new Set(seed.filter((v) => v.ru?.title && v.lang !== 'ru').map((v) => v.path))
  const toRu = (href) => {
    const [p, hash = ''] = href.split('#')
    const clean = p.replace(/\/+$/, '') || '/'
    const r = STATIC[clean] ?? (typeof twins[clean] === 'string' ? twins[clean] : undefined) ?? (COUNTRY_RX.test(clean) ? '/ru' + clean : undefined) ?? (vacRu.has(clean) ? '/ru' + clean : undefined)
    return r ? r + (hash ? '#' + hash : '') : href
  }
  let relinked = 0
  const relink = (node) => {
    if (Array.isArray(node)) return node.forEach(relink)
    if (!node || typeof node !== 'object') return
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string') {
        if (k === 'href' && v.startsWith('/') && !v.startsWith('/ru')) { const r = toRu(v); if (r !== v) (node[k] = r), relinked++ }
        else if (v.includes('](/')) node[k] = v.replace(/\]\((\/[^)\s]*)\)/g, (m, h) => (h.startsWith('/ru') ? m : (relinked++, `](${toRu(h)})`)))
      } else relink(v)
    }
  }
  for (const [, ru] of made) relink(ru)

  wr('articles.json', articles)
  wr('landings.json', landings)
  wr('legal.json', legal)
  wr('quizzes.json', quizzes)
  wr('pages.json', pages)
  wr('twins.json', twins)
  console.log('ru pages made', made.length, 'links to Russian pages', relinked)
}
