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
      multiple: !p.group?.startsWith('Пакети'),
      href: '/poslugi',
      hrefRu: '/ru/services',
    })
  })
  return out
}

export const PRODUCTS: Product[] = [...fromPackages(), ...EXTRA]
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
