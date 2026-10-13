import type { MetadataRoute } from 'next'
import { getAllVacancies, getClosedVacancyPaths } from '@/lib/vacancies'
import { ARTICLES, LEGAL, pageByPath } from '@/lib/content'
import { COUNTRIES, SITE } from '@/lib/site'
import { LANDINGS } from '@/lib/landing'
import { QUIZZES } from '@/lib/quizzes'
import { VISA_PAGES } from '@/lib/visa'
import { ruTwin, ukTwin } from '@/lib/alt-routes'
import { PARTNER_PATHS, partnerAlternates } from '@/lib/partners'

/**
 * Every canonical, indexable page with its lastmod / changefreq / priority / hreflang set — the source of /sitemap.xml
 * (serialized in app/sitemap.xml/route.ts) and of the Markdown corpus (/sitemap.md, /llm/*.md, <page>.md).
 */
export async function sitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string) => SITE.url + (p === '/' ? '' : p)
  // stable dates for static content (a lastmod that changes every hour teaches Google to ignore it)
  const now = new Date('2026-10-06')
  const vacancies = (await getAllVacancies()).filter((v) => v.active)
  const lastVac = vacancies.reduce((m, v) => (v.updatedAt > m ? v.updatedAt : m), '2026-01-01')

  // same uk / ru / x-default set as the pages' <link rel="alternate" hreflang> (pageMeta → languages())
  const alt = (ukPath: string) => {
    const ru = ruTwin(ukPath)
    return ru ? { alternates: { languages: { uk: u(ukPath), ru: u(ru), 'x-default': u(ukPath) } } } : {}
  }
  const entry = (path: string, e: Omit<MetadataRoute.Sitemap[number], 'url'>, lang: 'uk' | 'ru' = 'uk', pair = true) => ({
    url: u(path),
    ...e,
    ...(pair ? alt(lang === 'uk' ? path : (ukTwin(path) ?? '')) : {}),
  })
  const seen = new Set<string>()
  const out: MetadataRoute.Sitemap = []
  /** pair = false: the page has no hreflang pair (its Russian copy is noindex — quizzes, legal documents) */
  const push = (path: string, e: Omit<MetadataRoute.Sitemap[number], 'url'>, lang: 'uk' | 'ru' = 'uk', pair = true) => {
    if (seen.has(path)) return
    seen.add(path)
    out.push(entry(path, e, lang, pair))
  }

  push('/', { lastModified: lastVac, changeFrequency: 'daily', priority: 1 })
  push('/ru', { lastModified: lastVac, changeFrequency: 'daily', priority: 0.7 }, 'ru')
  // the catalog (/vacancies/aktualni_vakansii) is noindex as on Tilda — not in the sitemap; Google still follows its links

  // country pages: Tilda's (with their SEO text) always; a country without a Tilda page only while it has vacancies
  for (const c of COUNTRIES) {
    const has = vacancies.some((v) => v.country === c.code)
    const own = LANDINGS.find((l) => l.path === c.path)
    if (!has && !own) continue
    push(c.path, { lastModified: lastVac, changeFrequency: 'daily', priority: c.code === 'pl' ? 0.95 : 0.9 })
    const ru = ruTwin(c.path) ?? '/ru' + c.path
    if (LANDINGS.some((l) => l.path === ru) || has) push(ru, { lastModified: lastVac, changeFrequency: 'daily', priority: 0.6 }, 'ru')
  }
  for (const l of LANDINGS) {
    if (l.canonical) continue
    push(l.path, { lastModified: lastVac, changeFrequency: 'weekly', priority: l.lang === 'uk' ? 0.75 : 0.55 }, l.lang)
  }
  // a translated vacancy: the same uk / ru / x-default set as its pages (vacancyPageMeta)
  const vacAlt = (path: string) => ({ alternates: { languages: { uk: u(path), ru: u('/ru' + path), 'x-default': u(path) } } })
  const pushVac = (path: string, ru: boolean, e: Omit<MetadataRoute.Sitemap[number], 'url'>, ruPriority: number, lang: 'uk' | 'ru' = 'uk') => {
    if (!ru) return push(path, e, lang)
    for (const [p, pr] of [[path, e.priority], ['/ru' + path, ruPriority]] as const) {
      if (seen.has(p)) continue
      seen.add(p)
      out.push({ url: u(p), ...e, priority: pr, ...vacAlt(path) })
    }
  }
  for (const v of vacancies) {
    pushVac(v.path, Boolean(v.ru?.title) && v.lang !== 'ru', { lastModified: v.updatedAt, changeFrequency: 'weekly', priority: v.hot ? 0.85 : 0.75 }, 0.55, v.lang ?? 'uk')
  }
  // closed vacancy posts stay online at their Tilda addresses (Tilda listed them in sitemap-feed-*.xml too)
  for (const c of await getClosedVacancyPaths()) pushVac(c.path, c.hasRu, { lastModified: c.updatedAt, changeFrequency: 'yearly', priority: 0.3 }, 0.3)
  for (const p of ['/poslugi', '/about', '/vidguki', '/contacts', '/news']) push(p, { lastModified: now, changeFrequency: 'monthly', priority: 0.6 })
  // the salary index follows today's vacancies
  push('/zarplaty', { lastModified: lastVac, changeFrequency: 'weekly', priority: 0.7 })
  push('/ru/zarplaty', { lastModified: lastVac, changeFrequency: 'weekly', priority: 0.5 }, 'ru')
  for (const p of ['/ru/services', '/ru/about', '/ru/otzyvy', '/ru/contacts', '/ru/news']) push(p, { lastModified: now, changeFrequency: 'monthly', priority: 0.45 }, 'ru')
  // «Співпраця» in four languages: one hreflang cluster (uk / ru / en / pl, x-default = en)
  const partnerLangs = Object.fromEntries(Object.entries(partnerAlternates()).map(([k, p]) => [k, u(p)]))
  for (const p of Object.values(PARTNER_PATHS)) {
    if (seen.has(p)) continue
    seen.add(p)
    out.push({ url: u(p), lastModified: new Date('2026-10-07'), changeFrequency: 'monthly', priority: p === '/spivpratsya' ? 0.6 : 0.5, alternates: { languages: partnerLangs } })
  }
  for (const a of ARTICLES) {
    push(a.path, { lastModified: a.datePublished ? new Date(a.datePublished) : a.date ? new Date(a.date) : now, changeFrequency: 'yearly', priority: 0.5 }, a.lang)
  }
  for (const q of QUIZZES) if (!q.noindex) push(q.path, { lastModified: now, changeFrequency: 'monthly', priority: 0.4 }, q.path.startsWith('/ru/') ? 'ru' : 'uk', false)
  for (const v of VISA_PAGES) push(v.path, { lastModified: new Date(v.updated.split('.').reverse().join('-')), changeFrequency: 'monthly', priority: v.lang === 'uk' ? 0.85 : 0.6 }, v.lang)
  for (const p of ['/charity', '/ru/charity']) push(p, { lastModified: now, changeFrequency: 'yearly', priority: 0.3 }, p.startsWith('/ru/') ? 'ru' : 'uk')
  // indexable Tilda pages that were missing here (crawl 13.10.2026): the legal documents (their Russian copies are noindex)
  // and /links; Tilda's sitemap listed them
  for (const d of LEGAL) if (!d.path.startsWith('/ru/')) push(d.path, { lastModified: now, changeFrequency: 'yearly', priority: 0.2 }, 'uk', false)
  if (pageByPath('/links')) push('/links', { lastModified: now, changeFrequency: 'monthly', priority: 0.3 })
  return out
}
