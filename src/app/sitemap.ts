import type { MetadataRoute } from 'next'
import { getAllVacancies, getClosedVacancyPaths } from '@/lib/vacancies'
import { ARTICLES } from '@/lib/content'
import { CATALOG_PATH, COUNTRIES, SITE } from '@/lib/site'
import { LANDINGS } from '@/lib/landing'
import { QUIZZES } from '@/lib/quizzes'
import { ruTwin, ukTwin } from '@/lib/alt-routes'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
  const entry = (path: string, e: Omit<MetadataRoute.Sitemap[number], 'url'>, lang: 'uk' | 'ru' = 'uk') => ({
    url: u(path),
    ...e,
    ...alt(lang === 'uk' ? path : (ukTwin(path) ?? '')),
  })
  const seen = new Set<string>()
  const out: MetadataRoute.Sitemap = []
  const push = (path: string, e: Omit<MetadataRoute.Sitemap[number], 'url'>, lang: 'uk' | 'ru' = 'uk') => {
    if (seen.has(path)) return
    seen.add(path)
    out.push(entry(path, e, lang))
  }

  push('/', { lastModified: lastVac, changeFrequency: 'daily', priority: 1 })
  push('/ru', { lastModified: lastVac, changeFrequency: 'daily', priority: 0.7 }, 'ru')
  push(CATALOG_PATH, { lastModified: lastVac, changeFrequency: 'daily', priority: 0.95 })
  push('/ru' + CATALOG_PATH, { lastModified: lastVac, changeFrequency: 'daily', priority: 0.6 }, 'ru')

  // country pages: Tilda's (with their SEO text) always; a country without a Tilda page only while it has vacancies
  for (const c of COUNTRIES) {
    const has = vacancies.some((v) => v.country === c.code)
    const own = LANDINGS.find((l) => l.path === c.path)
    if (!has && !own) continue
    push(c.path, { lastModified: lastVac, changeFrequency: 'daily', priority: c.code === 'pl' ? 0.95 : 0.9 })
    const ru = '/ru' + c.path
    if (LANDINGS.some((l) => l.path === ru) || has) push(ru, { lastModified: lastVac, changeFrequency: 'daily', priority: 0.6 }, 'ru')
  }
  for (const l of LANDINGS) {
    if (l.canonical) continue
    push(l.path, { lastModified: lastVac, changeFrequency: 'weekly', priority: l.lang === 'uk' ? 0.75 : 0.55 }, l.lang)
  }
  for (const v of vacancies) {
    push(v.path, { lastModified: v.updatedAt, changeFrequency: 'weekly', priority: v.hot ? 0.85 : 0.75 }, v.lang ?? 'uk')
    if (v.ru?.title && v.lang !== 'ru') push('/ru' + v.path, { lastModified: v.updatedAt, changeFrequency: 'weekly', priority: 0.55 }, 'ru')
  }
  // closed vacancy posts stay online at their Tilda addresses (Tilda listed them in sitemap-feed-*.xml too)
  for (const c of await getClosedVacancyPaths()) push(c.path, { lastModified: c.updatedAt, changeFrequency: 'yearly', priority: 0.3 }, 'uk')
  for (const p of ['/poslugi', '/about', '/vidguki', '/contacts', '/news', '/cooperation']) push(p, { lastModified: now, changeFrequency: 'monthly', priority: 0.6 })
  for (const p of ['/ru/services', '/ru/about', '/ru/otzyvy', '/ru/contacts', '/ru/news']) push(p, { lastModified: now, changeFrequency: 'monthly', priority: 0.45 }, 'ru')
  for (const a of ARTICLES) {
    push(a.path, { lastModified: a.datePublished ? new Date(a.datePublished) : a.date ? new Date(a.date) : now, changeFrequency: 'yearly', priority: 0.5 }, a.lang)
  }
  for (const q of QUIZZES) if (!q.noindex) push(q.path, { lastModified: now, changeFrequency: 'monthly', priority: 0.4 })
  return out
}
