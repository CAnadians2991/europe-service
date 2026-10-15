import type { Currency, Salary, Vacancy, VacancyCard } from './types'

export const CURRENCY_SIGN: Record<Currency, string> = { PLN: 'zł', EUR: '€', CZK: 'Kč', RON: 'lei', HUF: 'Ft', USD: '$', GBP: '£', CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr' }

/** Rough monthly-net-in-EUR equivalent, only for sorting/filtering */
// rough, only for sorting and the salary filter
const TO_EUR: Record<Currency, number> = { PLN: 0.235, EUR: 1, CZK: 0.04, RON: 0.2, HUF: 0.0025, USD: 0.92, GBP: 1.17, CHF: 1.06, SEK: 0.088, NOK: 0.086, DKK: 0.134 }

const nf = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 })
// money with kopecks always shows two digits: «36,30 zł», not «36,3 zł»
const nf2 = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// thousands are glued with a no-break space (any ICU flavour → U+00A0), so «4 700 zł» never splits into «4» / «700 zł» on a phone
export const num = (n: number) => (Number.isInteger(n) ? nf : nf2).format(n).replace(/[\u00a0\u202f ]/g, '\u00a0')

function range(a: number | null, b: number | null) {
  if (a == null && b == null) return ''
  if (a == null || b == null || a === b) return num((a ?? b) as number)
  return `${num(a)}–${num(b)}`
}

// «год» means "year" in Russian, so the Russian site says «ч»
const PER_HOUR = { uk: '/год', ru: '/ч' }
const PER_MONTH = { uk: '/міс', ru: '/мес' }

export function salaryHour(s: Salary, lang: 'uk' | 'ru' = 'uk') {
  const r = range(s.hourMin, s.hourMax)
  return r ? `${r}\u00a0${CURRENCY_SIGN[s.currency]}${PER_HOUR[lang]}` : ''
}

/** Tilda texts sometimes give a bonus («премії до 300 зл/міс») where the parser expects the monthly pay:
 *  a «month» below 60 hours of the hourly rate is not a monthly salary */
export const monthPlausible = (s: Salary) => s.hourMin == null || (s.monthMax ?? s.monthMin ?? 0) >= s.hourMin * 60

export function salaryMonth(s: Salary, lang: 'uk' | 'ru' = 'uk') {
  if (!monthPlausible(s)) return ''
  const r = range(s.monthMin, s.monthMax)
  return r ? `${r}\u00a0${CURRENCY_SIGN[s.currency]}${PER_MONTH[lang]}` : ''
}

/** Main salary label for cards: prefer monthly, fall back to hourly, then free text */
export function salaryMain(s: Salary, lang: 'uk' | 'ru' = 'uk') {
  return salaryMonth(s, lang) || salaryHour(s, lang) || s.text.split(/[;(]/)[0].trim()
}

export function salaryEurMonth(s: Salary): number {
  const k = TO_EUR[s.currency] ?? 1
  if (s.monthMax ?? s.monthMin) return ((s.monthMax ?? s.monthMin) as number) * k
  if (s.hourMax ?? s.hourMin) return ((s.hourMax ?? s.hourMin) as number) * 180 * k
  return 0
}

export function vacancyCity(v: Pick<Vacancy | VacancyCard, 'city'>) {
  const c = v.city?.trim()
  if (!c || /^(польща|чехія|німеччина|нідерланди|литва|румунія|словаччина|греція|угорщина|польша|чехия|германия|нидерланды|румыния|словакия|греция|венгрия)$/i.test(c)) return ''
  return c
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia',
  ы: 'y', э: 'e', ё: 'e', ъ: '', "'": '', '’': '',
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function formatDate(iso: string, locale = 'uk-UA') {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' })
}

/** Normalize a UA/EU phone to +digits; returns '' when clearly invalid */
export function normalizePhone(raw: string) {
  let d = (raw || '').replace(/[^\d+]/g, '')
  if (d.startsWith('00')) d = '+' + d.slice(2)
  if (!d.startsWith('+')) {
    if (d.startsWith('380')) d = '+' + d
    else if (d.startsWith('0') && d.length === 10) d = '+38' + d
    else d = '+' + d
  }
  const digits = d.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15 ? '+' + digits : ''
}

/** Ukrainian plural: plural(3, ['вакансія','вакансії','вакансій']) */
export function plural(n: number, forms: [string, string, string]) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return forms[0]
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1]
  return forms[2]
}

/** Short pay for tight spaces (departure board): "до 7 000 zł/міс" */
export function salaryCompact(s: Salary, lang: 'uk' | 'ru' = 'uk') {
  const m = s.monthMax ?? s.monthMin
  if (m) return `${s.monthMin && s.monthMax && s.monthMin !== s.monthMax ? 'до ' : ''}${num(m)}\u00a0${CURRENCY_SIGN[s.currency]}`
  const h = s.hourMax ?? s.hourMin
  if (h) return `${num(h)}\u00a0${CURRENCY_SIGN[s.currency]}${PER_HOUR[lang]}`
  return s.text.split(/[;(]/)[0].slice(0, 18)
}

/** A review's date (dd.mm.yyyy) only while it is fresh — older ones show no date rather than a made-up one */
export function freshDate(d: string | null | undefined, months = 12): string {
  const m = d?.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return ''
  const t = Date.UTC(+m[3], +m[2] - 1, +m[1])
  return Date.now() - t <= months * 30.5 * 864e5 ? d! : ''
}
