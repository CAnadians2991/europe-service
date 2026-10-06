// Site-wide QA: every URL of the sitemap + every internal link found on those pages.
// Checks status, title / description / h1 / canonical, hreflang targets, broken internal links and images,
// leftover Ukrainian text on Russian pages, «undefined/NaN/null» in text, duplicate titles, thin pages.
// Run against a local production build: node scripts/qa-crawl.mjs http://localhost:3600 > qa-report.json
import fs from 'node:fs'
import path from 'node:path'

const BASE = (process.argv[2] || 'http://localhost:3600').replace(/\/+$/, '')
const SITE = 'https://europeservice.com.ua'
const PUBLIC = path.resolve(import.meta.dirname, '../public')
const CONC = 8

const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/g, ' ')
const text = (h) =>
  strip(h)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const attr = (h, rx) => (h.match(rx) || [])[1]

async function get(url, redirect = 'manual') {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { redirect, headers: { 'user-agent': 'ES-QA' } })
      return { status: r.status, location: r.headers.get('location'), body: r.status === 200 ? await r.text() : '' }
    } catch (e) {
      if (i === 2) return { status: 0, error: String(e) }
      await new Promise((r) => setTimeout(r, 500))
    }
  }
}

async function pool(items, n, fn) {
  const out = []
  let i = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++
        out[k] = await fn(items[k], k)
      }
    }),
  )
  return out
}

const sm = await get(BASE + '/sitemap.xml')
const urls = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '') || '/')
console.error('sitemap urls', urls.length)

const pages = {}
const links = new Map() // internal href → first page that links it
const imgs = new Map()
const issues = []
const add = (p, kind, detail) => issues.push({ page: p, kind, detail })

await pool(urls, CONC, async (p, k) => {
  const r = await get(BASE + p)
  if (k % 200 === 0) console.error('…', k)
  if (r.status !== 200) return add(p, 'sitemap-status', `${r.status} → ${r.location ?? ''}`)
  const h = r.body
  const title = attr(h, /<title>([^<]*)<\/title>/)
  const desc = attr(h, /<meta name="description" content="([^"]*)"/)
  const canon = attr(h, /<link rel="canonical" href="([^"]*)"/)
  const h1 = (h.match(/<h1[\s>]/g) || []).length
  const robots = attr(h, /<meta name="robots" content="([^"]*)"/) || ''
  const t = text(h.replace(/<header[\s\S]*?<\/header>|<footer[\s\S]*?<\/footer>/g, ' '))
  pages[p] = { title, desc, canon, h1, robots, words: t.split(' ').length }
  if (!title) add(p, 'no-title')
  else if (title.length > 75) add(p, 'long-title', title.length + ' ' + title)
  if (!desc) add(p, 'no-description')
  else if (desc.length < 50) add(p, 'short-description', desc)
  if (h1 !== 1) add(p, 'h1-count', h1)
  if (canon && canon.replace(SITE, '') !== p && !robots.includes('noindex')) add(p, 'canonical-elsewhere', canon)
  if (/\bundefined\b|\bNaN\b|\[object Object\]/.test(t)) add(p, 'bad-text', (t.match(/.{0,40}(undefined|NaN|\[object Object\]).{0,40}/) || [])[0])
  if (p.startsWith('/ru')) {
    const uk = (t.match(/[А-ЯҐЄІЇа-яґєії’ʼ']*[іїєґІЇЄҐ][а-яґєії’ʼ']*/g) || []).filter((w) => !/^(Дія|Українці|Українська|ЄВРОПА|СЕРВІС|УКРАЇНА|УКРАЇНИ|Ліцензія)$/i.test(w))
    if (uk.length > 6) add(p, 'ru-has-ukrainian', uk.length + ': ' + [...new Set(uk)].slice(0, 8).join(' '))
  }
  if (pages[p].words < 120 && !robots.includes('noindex')) add(p, 'thin', pages[p].words)
  for (const m of h.matchAll(/hrefLang="([a-z-]+)" href="([^"]+)"/g)) {
    const u = m[2].replace(SITE, '') || '/'
    if (!links.has(u)) links.set(u, p + ' (hreflang)')
  }
  for (const m of strip(h).matchAll(/<a [^>]*href="(\/[^"#?]*)/g)) if (!links.has(m[1])) links.set(m[1], p)
  for (const m of h.matchAll(/(?:src|srcSet|srcset)="([^"]+)"/g))
    for (const part of m[1].split(','))
      {
        const u = part.trim().split(' ')[0]
        if (u.startsWith('/') && !u.startsWith('/_next') && !imgs.has(u)) imgs.set(u, p)
      }
})

// titles used by more than one indexable page
const byTitle = {}
for (const [p, x] of Object.entries(pages)) if (x.title && !x.robots.includes('noindex')) (byTitle[x.title] ??= []).push(p)
for (const [t, ps] of Object.entries(byTitle)) if (ps.length > 1) add(ps[0], 'duplicate-title', `${ps.length}× «${t}» ${ps.slice(0, 4).join(' ')}`)

// internal links that are not in the sitemap: status (redirects are fine, 404 is not)
const extra = [...links.keys()].filter((u) => !pages[u] && !/^\/(api|_next|admin)/.test(u))
console.error('extra links', extra.length)
await pool(extra, CONC, async (u) => {
  const r = await get(BASE + u)
  if (r.status === 404 || r.status >= 500 || r.status === 0) add(links.get(u), 'broken-link', `${u} → ${r.status}`)
  else if (r.status >= 300 && r.status < 400) {
    const r2 = await get(BASE + new URL(r.location, BASE).pathname)
    if (r2.status !== 200) add(links.get(u), 'redirect-to-error', `${u} → ${r.location} → ${r2.status}`)
  }
})

// images: files on disk (variants of /media/* are -480/-800/-1200.webp)
for (const [u, p] of imgs) {
  const f = path.join(PUBLIC, decodeURIComponent(u.split('?')[0]))
  if (!fs.existsSync(f)) add(p, 'missing-image', u)
}

const summary = {}
for (const i of issues) summary[i.kind] = (summary[i.kind] ?? 0) + 1
console.log(JSON.stringify({ base: BASE, pages: Object.keys(pages).length, summary, issues }, null, 1))
