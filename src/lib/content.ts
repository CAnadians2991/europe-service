import pages from '@/data/content/pages.json'
import homeData from '@/data/content/home.json'
import reviewsData from '@/data/content/reviews.json'
import services from '@/data/content/services.json'
import articlesData from '@/data/content/articles.json'
import legal from '@/data/content/legal.json'

export type Block =
  | { type: 'h2' | 'h3' | 'p'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'img'; src: string; alt?: string }
  | { type: 'quote'; text: string; speaker?: string }
  | { type: 'button'; text: string; href: string }
  | { type: 'details'; summary: string; blocks: Block[] }
  | { type: 'video'; youtube: string; title?: string }

export interface Article {
  path: string
  lang: 'uk' | 'ru'
  title: string
  seoTitle?: string
  seoDescription?: string | null
  ogImage?: string | null
  date?: string | null
  cover?: string | null
  blocks: Block[]
  datePublished?: string | null
  outdated?: boolean
  outdatedNote?: string
  faq?: { q: string; a: string }[]
  /** the other-language version */
  twin?: string
  /** a hub page (/news/chekhia …) that lists the posts of a Tilda feed category */
  listing?: { feed: string; category: string }
  categories?: string[]
  /** the heading Tilda's page gave its «more articles» block («Читайте так же», «Читайте теж») — kept as that <h2> */
  relatedTitle?: string
}

export interface ReviewItem {
  name: string
  text: string
  lang: 'uk' | 'ru'
  date?: string
  city?: string
  vacancy?: string
  vacancyUrl?: string
  arrivalDate?: string
  /** stamp on the Russian site (city/vacancy above are Ukrainian) */
  cityRu?: string
  vacancyRu?: string
  rating?: number
  photo?: string
  photos?: string[]
  /** video review: YouTube id or a static file */
  video?: string
}

export interface Package {
  title: string
  group?: string
  features: string[]
  price?: string | null
  oldPrice?: string | null
  note?: string
  payUrl?: string
  /** page that explains the package (the visa landing) */
  href?: string
  buttonText?: string
  icon?: string
  groupNote?: string
}

type Img = { src: string; alt?: string; name?: string; href?: string }
export interface HomeContent {
  seoTitle?: string
  seoDescription?: string
  ogImage?: string
  hero?: { title: string; bullets: string[]; cta?: { text: string; href: string }; image?: string }
  video?: { youtube: string; title?: string }
  advantages?: { title: string; items: { title: string; text: string; icon?: string }[] }
  stats?: { title: string; text: string }[]
  awards?: { title: string; images: Img[] }
  employers?: { title: string; logos: Img[] }
  countries?: { title: string; items: { title: string; href: string; country?: string; image?: string }[] }
  audiences?: { title: string; items: { title: string; text?: string; href: string; image?: string }[] }
  steps?: { title: string; groups: { title: string; items: { text: string; icon?: string }[] }[] }
  press?: { title: string; logos: Img[] }
  reviews?: { title: string; items: ReviewItem[] }
  cities?: { title: string; items: { text: string; href: string }[] }
  seoText?: Block[]
  faq?: { q: string; a: string }[]
}

export const HOME = homeData as unknown as { uk?: HomeContent; ru?: HomeContent }

export const REVIEWS = (Array.isArray(reviewsData) ? reviewsData : []) as unknown as ReviewItem[]

type ServicesLang = {
  title: string
  seoTitle?: string
  seoDescription?: string
  packages: Package[]
  notes?: string[]
  steps: { title: string; text: string; blocks?: Block[] | null }[]
  stepsTitle?: string
  extraSections: { title: string; text?: string; blocks?: Block[] | null; packages?: Package[] }[]
}
const EMPTY_SERVICES: ServicesLang = { title: '', packages: [], steps: [], extraSections: [] }
const S = services as unknown as { uk?: ServicesLang; ru?: ServicesLang }
export const SERVICES = {
  uk: { ...EMPTY_SERVICES, ...S.uk } as ServicesLang,
  ru: { ...EMPTY_SERVICES, ...S.ru } as ServicesLang,
}

/** «1 099 грн» — the cheapest of the three support packages (Базовий / Стандарт / Преміум; the list goes on with
 *  single services such as insurance) — the services pages' title names it */
export function packagesFrom(lang: 'uk' | 'ru') {
  const n = Math.min(...SERVICES[lang].packages.slice(0, 3).map((p) => Number(String(p.price ?? '').replace(/\D/g, ''))).filter((x) => x > 0))
  return Number.isFinite(n) ? `${n.toLocaleString('uk-UA').replace(/\s/g, '\u00a0')} грн` : ''
}

export const ARTICLES = ((articlesData as unknown as { articles?: Article[] }).articles ?? []) as Article[]
const BY_PATH = new Map(ARTICLES.map((a) => [a.path, a]))
export const getArticle = (path: string) => BY_PATH.get(path)

/** Articles whose whole topic is obsolete (COVID rules, 2020–22 entry rules…) stay online but are not indexed */
export const isObsolete = (a: Article) => Boolean(a.outdated)

/** Posts of a hub page (/news/chekhia lists the Tilda feed posts tagged «Чехія») */
export const hubPosts = (hub: Article) =>
  hub.listing ? ARTICLES.filter((a) => a.path !== hub.path && a.lang === hub.lang && a.categories?.includes(hub.listing!.category)) : []

export const LEGAL = (Array.isArray(legal) ? legal : []) as unknown as { path: string; title: string; seoTitle?: string; seoDescription?: string; blocks: Block[] }[]
export const getLegal = (path: string) => LEGAL.find((l) => l.path === path)

export interface ContentPage {
  path: string
  lang: 'uk' | 'ru'
  title: string
  seoTitle?: string
  seoDescription?: string
  ogImage?: string
  blocks: Block[]
  [k: string]: unknown
}
export const PAGES = pages as unknown as Record<string, ContentPage | undefined>
export const pageByPath = (path: string) => Object.values(PAGES).find((p) => p?.path === path)
