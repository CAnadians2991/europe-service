// SEO parity with the old Tilda site, URL by URL (owner: «old pages keep URL, title, description, H1–H3, structured
// data and SEO text one-to-one»). Reference: the Tilda export (../tilda-data/pages.json, pages_text/, sitemaps/,
// scripts/import/out/tilda-meta.json) and the old redirect rules (src/data/legacy-redirects.json).
//
// Per old address: status and redirect hops (one hop at most, final 200), and for a page that stays:
//   title and meta description exactly as on Tilda, robots (noindex) as on Tilda, canonical = itself,
//   every Tilda H1–H3 present (as a heading or, for Tilda's decorative «H1» numbers, as text), Tilda JSON-LD types kept,
//   Tilda SEO-text sentences present (≥ 95 %).
// Run: node scripts/seo-parity-audit.mjs [base] [pages] > seo-parity.json   (base defaults to the Netlify site; «pages» = Tilda pages only)
import fs from 'node:fs'
import path from 'node:path'

const BASE = (process.argv[2] || 'https://europeservice-ua.netlify.app').replace(/\/+$/, '')
const ROOT = path.resolve(import.meta.dirname, '..')
const TILDA = path.resolve(ROOT, '../tilda-data')
const META = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/import/out/tilda-meta.json'), 'utf8'))
const PAGES = JSON.parse(fs.readFileSync(path.join(TILDA, 'pages.json'), 'utf8'))
const RULES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/legacy-redirects.json'), 'utf8'))
const CONC = 8

const ZW = /[​-‍⁠﻿⠀]/g
const dec = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
const ws = (s) => dec(s || '').replace(ZW, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
const norm = (s) => ws(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/g, ' ')

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'ES-SEO-audit' } })
      return { status: r.status, location: r.headers.get('location'), body: r.status === 200 ? await r.text() : '' }
    } catch (e) {
      if (i === 2) return { status: 0, error: String(e) }
      await new Promise((r) => setTimeout(r, 800))
    }
  }
}
/** follow redirects one by one: hops and the final response */
async function resolve(p) {
  let url = BASE + encodeURI(p)
  const hops = []
  for (let i = 0; i < 5; i++) {
    const r = await get(url)
    if (r.status >= 300 && r.status < 400 && r.location) {
      const next = new URL(r.location, url)
      hops.push({ status: r.status, to: next.pathname + next.search })
      url = next.href.startsWith(BASE) || next.host.endsWith('netlify.app') ? next.href : BASE + next.pathname + next.search
      continue
    }
    return { ...r, hops, final: new URL(url).pathname }
  }
  return { status: 'loop', hops }
}

// pages_text/<alias or page id>.txt, first line «# alias  (page123.html)» → by the export file name
const TEXT_BY_FILE = new Map()
for (const f of fs.readdirSync(path.join(TILDA, 'pages_text'))) {
  const head = fs.readFileSync(path.join(TILDA, 'pages_text', f), 'utf8').slice(0, 300)
  const m = head.match(/\((page\d+\.html)\)/)
  if (m) TEXT_BY_FILE.set(m[1], path.join(TILDA, 'pages_text', f))
}
// SEO text: the Tilda page's own text sentences (records, not the menu / footer)
function tildaSentences(file) {
  const f = TEXT_BY_FILE.get(file)
  if (!f) return []
  const out = []
  let skip = false
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const rec = line.match(/^--- rec\d+ type (\d+)/)
    if (rec) {
      skip = ['121', '257', '228', '456', '1093', '138', '967', '390', '702'].includes(rec[1]) // header / footer / popup forms / menus
      continue
    }
    if (skip || /^(TITLE|DESC):|^\[|^#/.test(line)) continue
    for (const s of line.split(/(?<=[.!?])\s+/)) if (s.length >= 70 && /\s/.test(s) && !/[→]/.test(s)) out.push(s)
  }
  return [...new Set(out)]
}

const ONLY = process.argv[3] // 'pages' → the Tilda pages only
const jobs = []
const seen = new Set()
const add = (j) => {
  const k = j.path.toLowerCase()
  if (seen.has(k)) return
  seen.add(k)
  jobs.push(j)
}
// every exported Tilda page (tilda-meta: title, description, robots, headings, JSON-LD), canonical from pages.json
const CANON = new Map(PAGES.map((p) => [p.f, p.canon]))
for (const [p, m] of Object.entries(META.pages)) add({ kind: 'page', path: p, tilda: { title: m.title, desc: m.description, noindex: m.noindex, canon: CANON.get(m.file), file: m.file } })
if (ONLY !== 'pages') for (const [p, post] of Object.entries(META.posts)) add({ kind: 'post', path: p, post })
if (ONLY !== 'pages') for (const f of fs.readdirSync(path.join(TILDA, 'sitemaps'))) {
  for (const m of fs.readFileSync(path.join(TILDA, 'sitemaps', f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) add({ kind: 'feed', path: new URL(m[1]).pathname })
}
if (ONLY !== 'pages') for (const r of RULES) if (!r.source.includes(':') && !r.source.includes('*')) add({ kind: 'rule', path: r.source, expect: r.destination })

const issues = []
const flag = (j, what, detail) => issues.push({ path: j.path, kind: j.kind, what, detail })
const stats = { urls: 0, ok200: 0, redirect1: 0, chains: 0, broken: 0 }
let i = 0
async function worker() {
  while (i < jobs.length) {
    const j = jobs[i++]
    const r = await resolve(j.path)
    stats.urls++
    if (r.status !== 200) {
      stats.broken++
      flag(j, 'status', `${r.status} after ${r.hops.length} hop(s)`)
      continue
    }
    if (r.hops.length > 1) {
      stats.chains++
      flag(j, 'chain', r.hops.map((h) => `${h.status} ${h.to}`).join(' → '))
    } else if (r.hops.length === 1) stats.redirect1++
    else stats.ok200++
    if (j.kind === 'rule' && j.expect && r.final.toLowerCase() !== j.expect.toLowerCase().replace(/\/$/, '') && r.final !== j.expect) flag(j, 'rule target', `${r.final} (rule: ${j.expect})`)
    if (r.hops.length && (j.kind === 'page' || j.kind === 'post')) {
      // a Tilda page that now redirects — fine only when Tilda's own canonical pointed elsewhere
      const canon = j.tilda?.canon ? new URL(j.tilda.canon).pathname : null
      if (!canon || canon.toLowerCase() === j.path.toLowerCase()) flag(j, 'redirected', `→ ${r.final}`)
      continue
    }
    if (j.kind !== 'page' && j.kind !== 'post') continue
    const h = r.body
    const title = ws((h.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1])
    const desc = ws((h.match(/<meta name="description" content="([^"]*)"/) || [])[1])
    const robots = (h.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || ''
    const canonical = (h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || ''
    const wantTitle = ws(j.kind === 'page' ? j.tilda.title : j.post.title)
    const wantDesc = ws(j.kind === 'page' ? j.tilda.desc : j.post.descr).replace(/^.{0,3}$/, '') // «ʼ» etc. = no description
    if (wantTitle && title !== wantTitle) flag(j, 'title', `«${title}» ≠ Tilda «${wantTitle}»`)
    if (wantDesc && desc !== wantDesc) flag(j, 'description', `«${desc}» ≠ Tilda «${wantDesc}»`)
    const noindex = /noindex/.test(robots)
    if (j.kind === 'page' && noindex !== Boolean(j.tilda.noindex)) flag(j, 'robots', `ours ${robots || 'index'} · Tilda ${j.tilda.noindex ? 'noindex' : 'index'}`)
    if (!noindex && canonical && new URL(canonical).pathname.toLowerCase() !== j.path.toLowerCase().replace(/\/$/, '') && !(j.path === '/' && new URL(canonical).pathname === '/')) flag(j, 'canonical', canonical)
    // headings
    const heads = new Set([...h.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/g)].map((m) => norm(m[1].replace(/<[^>]+>/g, ' '))))
    const text = norm(strip(h).replace(/<[^>]+>/g, ' '))
    const tHeads = j.kind === 'page' ? META.pages[j.path]?.headings ?? [] : j.post.headings ?? []
    for (const [lvl, t] of tHeads) {
      const n = norm(t)
      if (!n || heads.has(n)) continue
      if (text.includes(n)) continue
      flag(j, `h${lvl} missing`, ws(t).slice(0, 120))
    }
    // JSON-LD types of the Tilda page
    if (j.kind === 'page') {
      const ours = new Set([...h.matchAll(/"@type":"([^"]+)"/g)].map((m) => m[1]))
      for (const ld of META.pages[j.path]?.jsonld ?? []) {
        const t = ld['@type']
        if (t && !ours.has(t)) flag(j, 'json-ld', `Tilda ${t} missing`)
      }
      // SEO text
      const sents = tildaSentences(j.tilda.file)
      if (sents.length >= 3 && !noindex) {
        const have = sents.filter((s) => text.includes(norm(s))).length
        if (have / sents.length < 0.95) flag(j, 'seo text', `${have}/${sents.length} Tilda sentences; missing: ${sents.filter((x) => !text.includes(norm(x))).map((x) => ws(x).slice(0, 90)).join(' ¦ ')}`)
      }
    }
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
const by = {}
for (const x of issues) by[x.what] = (by[x.what] || 0) + 1
console.error(JSON.stringify({ base: BASE, stats, issues: by }, null, 1))
console.log(JSON.stringify({ base: BASE, stats, issues }, null, 1))
