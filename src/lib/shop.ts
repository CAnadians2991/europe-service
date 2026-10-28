import { SERVICES, type Package } from './content'

/**
 * What can be paid online. One source of truth for the cart and the server: the client only sends ids and quantities,
 * the price always comes from here. Packages with a fixed hryvnia price on the «Послуги» page are products; ranges and
 * euro prices («€ 100-200») are quoted by a manager, so they get «Отримати рахунок» instead of a cart button.
 */
export type ProductId = string

export interface Product {
  id: ProductId
  title: string
  titleRu: string
  /** kopecks */
  price: number
  /** short line under the title in the cart */
  note?: string
  noteRu?: string
  /** what a package includes — listed in the cart so the payer sees what the money is for (owner 2026-10-15) */
  features?: string[]
  featuresRu?: string[]
  /** more than one makes sense (SIM cards, insurance for two people) */
  multiple?: boolean
  /** page that explains the product */
  href?: string
  hrefRu?: string
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’'ʼ"«»]/g, '')
    .replace(/[^a-zа-яіїєґ0-9]+/gi, '-')
    .replace(/^-|-$/g, '')

const TRANSLIT: Record<string, string> = { Базовий: 'basic', Стандарт: 'standard', Преміум: 'premium', 'Польська сім-карта': 'sim-pl', 'Страховий поліс на 10 днів': 'insurance-10', 'Польська робоча віза на 1 рік': 'visa-pl' }

/** «1099 грн», «₴ 400» → kopecks; ranges and other currencies → null */
export function uahPrice(p: string | null | undefined): number | null {
  if (!p || /€|\$|-|–/.test(p)) return null
  const m = p.replace(/\s/g, '').match(/(\d+)/)
  return m && /грн|₴/.test(p) ? Number(m[1]) * 100 : null
}

const ruOf = (title: string) => SERVICES.ru?.packages.find((x, i) => SERVICES.uk.packages[i]?.title === title)?.title

/** products with their own landing (the visa package: 15 000 грн since 2026-10) */
const EXTRA: Product[] = [
  {
    id: 'visa-pl',
    title: 'Робоча віза в Польщу на рік (візовий супровід)',
    titleRu: 'Рабочая виза в Польшу на год (визовое сопровождение)',
    price: 15_000_00,
    note: 'Анкета, страховий поліс, запис у візовий центр, координація',
    noteRu: 'Анкета, страховой полис, запись в визовый центр, координация',
    href: '/robocha-viza-v-polshchu',
    hrefRu: '/ru/rabochaya-viza-v-polshu',
  },
]

/**
 * Sold in several amounts, exactly as pay.europeservice.com.ua sells them (owner 2026-10-19: «всі ціни мають бути як там»):
 * documents for Germany / the Netherlands / Greece and the insurance by term. One product per amount — the cart and the
 * server stay as they are; the «Послуги» page shows a picker of the group.
 */
export interface VariantGroup {
  id: string
  title: string
  titleRu: string
  /** what the amount buys, as on pay.europeservice.com.ua */
  features?: string[]
  featuresRu?: string[]
  multiple?: boolean
  options: { suffix: string; uah: number; label?: string; labelRu?: string }[]
}
const DOCS = ['Переоформлення документів для працевлаштування', 'Повний супровід до виходу на роботу', 'Створення CV для роботодавця', 'Особистий менеджер']
const DOCS_RU = ['Переоформление документов для трудоустройства', 'Полное сопровождение до выхода на работу', 'Создание CV для работодателя', 'Личный менеджер']
const amounts = (...uah: number[]) => uah.map((n) => ({ suffix: String(n), uah: n }))
export const VARIANT_GROUPS: VariantGroup[] = [
  { id: 'docs-de', title: 'Переоформлення документів для роботи в Німеччині', titleRu: 'Переоформление документов для работы в Германии', features: DOCS, featuresRu: DOCS_RU, options: amounts(5200, 7800, 10400) },
  { id: 'docs-nl', title: 'Переоформлення документів для роботи в Нідерландах', titleRu: 'Переоформление документов для работы в Нидерландах', features: DOCS, featuresRu: DOCS_RU, options: amounts(10400) }, // one price since 2026-10-28 (owner): 10 400 грн ≈ €200
  { id: 'docs-gr', title: 'Переоформлення документів для роботи в Греції', titleRu: 'Переоформление документов для работы в Греции', features: DOCS, featuresRu: DOCS_RU, options: amounts(7800) },
  {
    id: 'insurance',
    title: 'Страховий поліс',
    titleRu: 'Страховой полис',
    multiple: true,
    options: [
      { suffix: '30', uah: 600, label: '30 днів', labelRu: '30 дней' },
      { suffix: '90', uah: 1200, label: '90 днів', labelRu: '90 дней' },
      { suffix: '180', uah: 2000, label: '180 днів', labelRu: '180 дней' },
      { suffix: '365', uah: 2500, label: '365 днів', labelRu: '365 дней' },
    ],
  },
]
export const variantId = (g: VariantGroup, o: VariantGroup['options'][number]) => `${g.id}-${o.suffix}`
function fromVariants(): Product[] {
  return VARIANT_GROUPS.flatMap((g) =>
    g.options.map((o) => ({
      id: variantId(g, o),
      title: o.label ? `${g.title} на ${o.label}` : g.title,
      titleRu: o.labelRu ? `${g.titleRu} на ${o.labelRu}` : g.titleRu,
      price: o.uah * 100,
      ...(g.features ? { features: g.features, featuresRu: g.featuresRu } : {}),
      multiple: Boolean(g.multiple),
      href: '/poslugi',
      hrefRu: '/ru/services',
    })),
  )
}

function fromPackages(): Product[] {
  const out: Product[] = []
  SERVICES.uk.packages.forEach((p: Package, i: number) => {
    const price = uahPrice(p.price)
    if (price == null) return
    const id = TRANSLIT[p.title] ?? slug(p.title)
    if (EXTRA.some((x) => x.id === id)) return
    out.push({
      id,
      title: p.group?.startsWith('Пакети') ? `Пакет «${p.title}»` : p.title,
      titleRu: (() => {
        const t = SERVICES.ru?.packages[i]?.title ?? ruOf(p.title) ?? p.title
        return p.group?.startsWith('Пакети') ? `Пакет «${t}»` : t
      })(),
      price,
      ...(p.group?.startsWith('Пакети') ? { features: p.features, featuresRu: SERVICES.ru?.packages[i]?.features ?? p.features } : {}),
      multiple: !p.group?.startsWith('Пакети'),
      href: '/poslugi',
      hrefRu: '/ru/services',
    })
  })
  return out
}

export const PRODUCTS: Product[] = [...fromPackages(), ...EXTRA, ...fromVariants()]
export const PRODUCT = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<ProductId, Product>
/** package title on the «Послуги» page (either language) → product id */
const BY_PACKAGE = new Map<string, ProductId>()
SERVICES.uk.packages.forEach((p, i) => {
  const id = TRANSLIT[p.title] ?? slug(p.title)
  if (!PRODUCT[id]) return
  BY_PACKAGE.set(p.title, id)
  const ru = SERVICES.ru?.packages[i]?.title
  if (ru) BY_PACKAGE.set(ru, id)
})
export const productIdForPackage = (title: string) => BY_PACKAGE.get(title)

export type CartLine = { id: ProductId; qty: number }
export type PricedLine = { id: ProductId; title: string; qty: number; price: number; sum: number }

/** Server-side pricing: unknown ids dropped, quantities clamped */
export function priceCart(lines: CartLine[], lang: 'uk' | 'ru' = 'uk'): { lines: PricedLine[]; total: number } {
  const seen = new Map<string, number>()
  for (const l of lines) {
    const p = PRODUCT[l.id]
    if (!p) continue
    const q = Math.max(1, Math.min(p.multiple ? 10 : 1, Math.floor(Number(l.qty) || 1)))
    seen.set(p.id, p.multiple ? Math.min(10, (seen.get(p.id) ?? 0) + q) : 1)
  }
  const priced = [...seen].map(([id, qty]) => {
    const p = PRODUCT[id]
    return { id, title: lang === 'ru' ? p.titleRu : p.title, qty, price: p.price, sum: p.price * qty }
  })
  return { lines: priced, total: priced.reduce((s, l) => s + l.sum, 0) }
}

export const uah = (kop: number) => `${new Intl.NumberFormat('uk-UA').format(Math.round(kop / 100)).replace(/[   ]/g, ' ')} грн`

/** Payment methods as the cart shows them; which are live is decided on the server (env keys) */
export type MethodId = 'monopay' | 'monoparts' | 'privatparts' | 'manual'
export interface MethodInfo {
  id: MethodId
  enabled: boolean
  /** installments: allowed numbers of payments and the minimum order (kopecks) */
  parts?: number[]
  min?: number
}
