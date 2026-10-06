import twins from '@/data/content/twins.json'

/**
 * uk path ↔ ru path for pages that exist in both languages (hreflang + the language switch).
 * Static pairs here; landings and articles bring their own pairs (data/content/twins.json, written by the import);
 * every /vacancies/<country>/<vacancy> page has its /ru twin by prefix.
 */
const STATIC: Record<string, string> = {
  '/': '/ru',
  '/vacancies/all': '/ru/vacancies/all',
  '/poslugi': '/ru/services',
  '/vidguki': '/ru/otzyvy',
  '/contacts': '/ru/contacts',
  '/about': '/ru/about',
  '/pidbir': '/ru/podbor',
  '/news': '/ru/news',
}
export const UK_TO_RU: Record<string, string> = { ...(twins as Record<string, string>), ...STATIC }
export const RU_TO_UK: Record<string, string> = Object.fromEntries(Object.entries(UK_TO_RU).map(([a, b]) => [b, a]))

const C = '(?:poland|chekhiia|germany|netherlands|romania|lithuania|greece|latvia|austria|italy|belgium|france|canada|hungary|slovakia|england)'
/** /vacancies/<country>/<slug> — a vacancy page (Czech city landings under /vacancies/chekhiia/… are in twins.json and win) */
const VACANCY_RX = new RegExp(`^/vacancies/(?:${C}|[a-z]{2})/(?!robota_|rabota_|sezonn|brno$|praga$)[^/]+$`)
const COUNTRY_RX = new RegExp(`^/vacancies(?:/${C})?$`)

/** Russian twin of a Ukrainian page */
export function ruTwin(ukPath: string): string | undefined {
  const pair = UK_TO_RU[ukPath]
  if (pair) return pair
  if (VACANCY_RX.test(ukPath)) return '/ru' + ukPath
  // country pages share slugs: /vacancies/germany ↔ /ru/vacancies/germany
  if (COUNTRY_RX.test(ukPath)) return '/ru' + ukPath
  return undefined
}

export function ukTwin(ruPath: string): string | undefined {
  const pair = RU_TO_UK[ruPath]
  if (pair) return pair
  if (ruPath.startsWith('/ru/vacancies') && VACANCY_RX.test(ruPath.slice(3))) return ruPath.slice(3)
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

/** Link to a Ukrainian page from the given language's site (country/vacancy paths get their /ru twin) */
export const localHref = (ukPath: string, lang: 'uk' | 'ru') => (lang === 'uk' ? ukPath : (ruTwin(ukPath) ?? '/ru'))
