import { getActiveVacancies } from './vacancies'
import { CATALOG_PATH, COUNTRIES } from './site'
import { LANDINGS } from './landing'
import { ruTwin } from './alt-routes'
import { ensureCountries } from './countries'
import type { Category } from './types'

/**
 * Catalog pages that stand for a filter selection: the all-countries list (/vacancies/aktualni_vakansii) and every country page
 * (/vacancies = Poland, /vacancies/germany …). The catalog moves the visitor there when the country filter changes,
 * so the address, H1, SEO text and canonical always describe what is listed.
 */
export interface Landing {
  path: string
  country: string
  category?: Category
  housing?: boolean
}

/** country landings + «fixed» pages (Tilda city / job type / profession pages) whose list is their own */
export async function catalogLandings(lang: 'uk' | 'ru'): Promise<{ landings: Landing[]; fixed: string[] }> {
  await ensureCountries()
  const active = await getActiveVacancies(lang)
  const has = new Set(active.map((v) => v.country))
  const out: Landing[] = [{ path: CATALOG_PATH, country: '' }]
  for (const c of COUNTRIES) if (has.has(c.code)) out.push({ path: c.path, country: c.code })
  const fixed = LANDINGS.filter((l) => l.lang === lang && l.kind !== 'country').map((l) => l.path)
  if (lang === 'uk') return { landings: out, fixed }
  return { landings: out.flatMap((l) => (ruTwin(l.path) ? [{ ...l, path: ruTwin(l.path) as string }] : [])), fixed }
}
