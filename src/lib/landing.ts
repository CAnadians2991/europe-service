import landingsData from '@/data/content/landings.json'
import { CATEGORY, COUNTRIES, COUNTRY, type CountryInfo } from './site'
import { plural } from './format'
import { placeOf } from './places'
import type { Block } from './content'
import type { Category, CountryCode, Vacancy } from './types'

export type CountrySeo = { title: string; description: string; h1: string; text: string; body: string[] }

/**
 * SEO landing pages carried over from Tilda (country pages, Polish city / job type / profession pages, Czech pages…):
 * their URL, title, description and text are the Tilda ones (see scripts/import/extract_landings.py).
 */
export interface LandingPage {
  path: string
  lang: 'uk' | 'ru'
  twin?: string
  kind: 'country' | 'city' | 'category' | 'profession' | 'season' | 'contract' | 'audience' | 'info' | 'ad'
  /** 'all' — a page about every country (hubs, guides): lists the whole catalog */
  country: CountryCode | 'all'
  filter?: { city?: string; category?: Category | string; keywords?: string[]; housingFree?: boolean }
  title: string
  description: string
  h1: string
  intro?: string
  blocks: Block[]
  faq?: { q: string; a: string }[]
  links?: { label: string; href: string }[]
  /** near-copy of another landing (Tilda had both): stays online, rel=canonical points there, not in the sitemap */
  canonical?: string
}

export const LANDINGS = ((landingsData as unknown as { landings?: LandingPage[] }).landings ?? []) as LandingPage[]
const BY_PATH = new Map(LANDINGS.map((l) => [l.path, l]))
export const getLanding = (path: string) => BY_PATH.get(path)

/** The Tilda country page of a country in a language (Poland = /vacancies) */
export function countryLanding(code: CountryCode, lang: 'uk' | 'ru'): LandingPage | undefined {
  const c = COUNTRY[code]
  if (!c) return undefined
  return getLanding(lang === 'uk' ? c.path : '/ru' + c.path)
}

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-zа-яіїєґ0-9]+/g, ' ')
    .trim()

/** Latin name of a vacancy's city («Варшава» → «Warszawa») for matching city pages */
function latinCity(v: Pick<Vacancy, 'city'>) {
  const first = v.city.split(/[,(/]| і | та /)[0].trim()
  return placeOf(first)?.locality ?? first
}

/** Vacancies a landing lists: its country, narrowed by city / job type / profession words when that leaves any */
export function landingList(l: LandingPage, active: Vacancy[]): { list: Vacancy[]; narrowed: boolean } {
  const country = l.country === 'all' ? active : active.filter((v) => v.country === l.country)
  const f = l.filter ?? {}
  let list = country
  if (f.city) {
    const want = fold(f.city)
    list = list.filter((v) => [v.hubCity ?? '', latinCity(v), v.city].some((x) => x && (fold(x) === want || fold(x).startsWith(want))))
  }
  if (f.category && f.category in CATEGORY) list = list.filter((v) => v.category === f.category)
  if (f.housingFree) list = list.filter((v) => v.housingFree)
  if (f.keywords?.length) {
    const kws = f.keywords.map(fold).filter(Boolean)
    list = list.filter((v) => {
      const hay = fold(`${v.title} ${v.contract} ${v.intro}`)
      return kws.some((k) => hay.includes(k))
    })
  }
  const narrowed = list.length > 0 && list.length < country.length
  return { list: list.length ? list : country, narrowed }
}

export function countryBySlug(slug: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.path === `/vacancies/${slug}`)
}

/** Whole sentences from the start of a text while they fit into `max` characters */
function sentences(text: string, max: number) {
  const parts = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+/g) ?? [text]
  let out = ''
  for (const p of parts) {
    if ((out + p).length > max) break
    out += p
  }
  return (out || parts[0].slice(0, max)).trim()
}

/**
 * Title / description / H1 / intro of a country page: its own Tilda landing, else template texts (a country without a
 * Tilda page, e.g. one added in the admin). `landing` = the page being rendered — Tilda's Russian Czech and English pages
 * live at other slugs (/ru/vacancies/rabota_v_chekhii, /ru/vacancies/england) than '/ru' + the country path.
 */
export function countrySeo(c: CountryInfo, lang: 'uk' | 'ru', landing?: LandingPage): CountrySeo {
  const uk = lang === 'uk'
  const own = landing ?? countryLanding(c.code, lang)
  const where = uk ? c.inName : c.inNameRu
  const custom = (uk ? c.seo?.uk : c.seo?.ru) ?? {}
  const firstP = own?.blocks.find((b) => b.type === 'p') as { text: string } | undefined
  const t = uk
    ? {
        title: `Робота ${where} для українців — вакансії від роботодавців`,
        description: `Вакансії ${where} для українців: заводи, склади, виробництва. Офіційне працевлаштування, житло, супровід від заявки до першого робочого дня.`,
        h1: `Робота ${where} для українців`,
        text: `Офіційна робота ${where}: житло, допомога з документами та супровід до виходу на роботу.`,
        body: [`Підбираємо вакансії ${where} у перевірених роботодавців. Менеджер розповість про умови, житло й документи та допоможе з дорогою.`],
      }
    : {
        title: `Работа ${where} для украинцев — вакансии от работодателей`,
        description: `Вакансии ${where} для украинцев: заводы, склады, производства. Официальное трудоустройство, жильё, сопровождение от заявки до первого рабочего дня.`,
        h1: `Работа ${where} для украинцев`,
        text: `Официальная работа ${where}: жильё, помощь с документами и сопровождение до выхода на работу.`,
        body: [`Подбираем вакансии ${where} у проверенных работодателей. Менеджер расскажет об условиях, жилье и документах и поможет с дорогой.`],
      }
  return {
    title: own?.title || custom.title || t.title,
    description: own?.description || custom.description || t.description,
    h1: own?.h1 || t.h1,
    text: own?.intro || custom.text || (firstP ? sentences(firstP.text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), 230) : '') || t.text,
    body: own ? [] : t.body,
  }
}

export function countryTitle(c: CountryInfo, n: number, lang: 'uk' | 'ru') {
  const uk = lang === 'uk'
  const where = c.code === 'nl' ? (uk ? 'в Нідерландах (Голландії)' : 'в Нидерландах (Голландии)') : uk ? c.inName : c.inNameRu
  const vac = plural(n, uk ? ['вакансія', 'вакансії', 'вакансій'] : ['вакансия', 'вакансии', 'вакансий'])
  const head = `${uk ? 'Робота' : 'Работа'} ${where} ${uk ? 'для українців' : 'для украинцев'}`
  const full = `${head} ${new Date().getFullYear()} — ${n} ${vac}`
  return full.length <= 60 ? full : `${head} — ${n} ${vac}`
}

/** Slugs a new vacancy may not take: country slugs and every landing slug */
export const RESERVED_SLUGS = new Set<string>([
  'all',
  ...COUNTRIES.map((c) => c.path.split('/').pop() as string),
  ...LANDINGS.map((l) => l.path.split('/').pop() as string),
])
