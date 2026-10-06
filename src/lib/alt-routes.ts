import twins from '@/data/content/twins.json'

/**
 * uk path ↔ ru path for pages that exist in both languages (hreflang + the language switch).
 * Landings and articles bring their own pairs from Tilda (data/content/twins.json); country pages share the slug.
 * Vacancy posts had no Russian twin on Tilda — they keep one address.
 */
const STATIC: Record<string, string> = {
  '/': '/ru',
  '/vacancies/aktualni_vakansii': '/ru/vacancies/aktualni_vakansii',
  '/poslugi': '/ru/services',
  '/vidguki': '/ru/otzyvy',
  '/contacts': '/ru/contacts',
  '/about': '/ru/about',
  '/pidbir': '/ru/podbor',
  '/news': '/ru/news',
}
export const UK_TO_RU: Record<string, string> = { ...(twins as Record<string, string>), ...STATIC }
export const RU_TO_UK: Record<string, string> = Object.fromEntries(Object.entries(UK_TO_RU).map(([a, b]) => [b, a]))

const COUNTRY_RX = /^\/(?:vacancies(?:\/(?:chekhiia|germany|netherlands|romania|lithuania|greece|latvia|austria|italy|belgium|france|canada))?|vakansii\/(?:hungary|slovakia|england))$/

/** Russian twin of a Ukrainian page */
export function ruTwin(ukPath: string): string | undefined {
  const pair = UK_TO_RU[ukPath]
  if (pair) return pair
  if (COUNTRY_RX.test(ukPath)) return '/ru' + ukPath
  return undefined
}

export function ukTwin(ruPath: string): string | undefined {
  const pair = RU_TO_UK[ruPath]
  if (pair) return pair
  if (ruPath.startsWith('/ru/') && COUNTRY_RX.test(ruPath.slice(3))) return ruPath.slice(3)
  return undefined
}

export function altPath(path: string, lang: 'uk' | 'ru'): string {
  const p = path.replace(/\/+$/, '') || '/'
  return lang === 'uk' ? (ruTwin(p) ?? '/ru') : (ukTwin(p) ?? '/')
}

/** hreflang alternates for generateMetadata */
export function languages(ukPath: string) {
  const ru = ruTwin(ukPath)
  return ru ? { uk: ukPath, ru, 'x-default': ukPath } : undefined
}

/** Link to a Ukrainian page from the given language's site (country paths get their /ru twin) */
export const localHref = (ukPath: string, lang: 'uk' | 'ru') => (lang === 'uk' ? ukPath : (ruTwin(ukPath) ?? '/ru'))
