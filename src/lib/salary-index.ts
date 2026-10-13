import 'server-only'
import { cache } from 'react'
import { hasDb, sql } from './db'
import { getActiveVacancies } from './vacancies'
import { monthPlausible } from './format'
import { CATEGORY, COUNTRY } from './site'
import type { Category, Currency, Vacancy } from './types'

/**
 * «Індекс зарплат» (owner, 2026-10-13): what today's vacancies of the agency pay, by country, sphere and contract —
 * from the vacancies employers placed with us now (not the revived 2021–2025 posts, whose rates are recalculated).
 * Rates as the vacancy states them (almost all «нетто»); a month without a monthly figure = hourly rate × 168 hours
 * (21 working days × 8 h), marked as an estimate. Each month's figures are kept in settings «salary-index:YYYY-MM»
 * (written once, on the first render of the month) so the page can show the change since the previous month.
 */

export const HOURS_PER_MONTH = 168
// same factors as lib/format salaryEurMonth (approximate, for comparison between countries only)
const TO_EUR: Record<Currency, number> = { PLN: 0.235, EUR: 1, CZK: 0.04, RON: 0.2, HUF: 0.0025, USD: 0.92, GBP: 1.17, CHF: 1.06, SEK: 0.088, NOK: 0.086, DKK: 0.134 }
/** a country, sphere or contract group is shown from this many vacancies */
export const MIN_GROUP = 5
const MIN_SUB = 3

export interface Rate {
  v: Vacancy
  /** hourly rate in the vacancy's currency (middle of a range) */
  hour: number | null
  /** monthly pay in the vacancy's currency: the stated month, else hour × 168 */
  month: number | null
  monthEstimated: boolean
  currency: Currency
}

export interface Group {
  key: string
  n: number
  currency: Currency
  hourMedian: number | null
  hourP25: number | null
  hourP75: number | null
  hourN: number
  monthMedian: number | null
  monthEur: number | null
  monthN: number
  /** share of the group's monthly figures that are hour × 168 */
  estimatedShare: number
  housingFree: number
  net: number
}

export interface SalaryIndex {
  at: string
  month: string
  total: number
  countries: (Group & { code: string })[]
  plCategories: (Group & { category: Category })[]
  plContracts: (Group & { contract: 'zlecenie' | 'o-prace' | 'other' })[]
  plTop: Rate[]
  previous: Snapshot | null
}

export interface Snapshot {
  month: string
  at: string
  total: number
  countries: Record<string, { n: number; hourMedian: number | null; monthMedian: number | null; monthEur: number | null }>
}

const mid = (a: number | null, b: number | null) => (a == null ? null : b == null || b < a ? a : (a + b) / 2)
const round = (x: number | null, step = 0.01) => (x == null ? null : Math.round(x / step) * step)

export function rateOf(v: Vacancy): Rate {
  const s = v.salary
  const hour = mid(s.hourMin, s.hourMax)
  const statedMonth = monthPlausible(s) ? mid(s.monthMin, s.monthMax) : null
  const month = statedMonth ?? (hour != null ? hour * HOURS_PER_MONTH : null)
  return { v, hour, month, monthEstimated: statedMonth == null && month != null, currency: s.currency }
}

function quantile(sorted: number[], q: number) {
  if (!sorted.length) return null
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function group(key: string, rates: Rate[]): Group | null {
  if (!rates.length) return null
  // one currency per group: the most common one (Hungary has USD and EUR posts)
  const counts = new Map<Currency, number>()
  for (const r of rates) counts.set(r.currency, (counts.get(r.currency) ?? 0) + 1)
  const currency = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
  const same = rates.filter((r) => r.currency === currency)
  const hours = same.map((r) => r.hour).filter((x): x is number => x != null).sort((a, b) => a - b)
  const months = same.map((r) => r.month).filter((x): x is number => x != null).sort((a, b) => a - b)
  const monthMedian = quantile(months, 0.5)
  return {
    key,
    n: rates.length,
    currency,
    hourMedian: hours.length >= MIN_SUB ? round(quantile(hours, 0.5)) : null,
    hourP25: hours.length >= MIN_GROUP ? round(quantile(hours, 0.25)) : null,
    hourP75: hours.length >= MIN_GROUP ? round(quantile(hours, 0.75)) : null,
    hourN: hours.length,
    monthMedian: months.length >= MIN_SUB ? round(monthMedian, 10) : null,
    monthEur: months.length >= MIN_SUB && monthMedian != null ? round(monthMedian * (TO_EUR[currency] ?? 1), 10) : null,
    monthN: months.length,
    estimatedShare: same.filter((r) => r.month != null).length ? same.filter((r) => r.monthEstimated).length / same.filter((r) => r.month != null).length : 0,
    housingFree: rates.filter((r) => r.v.housingFree).length / rates.length,
    net: rates.filter((r) => r.v.salary.net).length / rates.length,
  }
}

const contractOf = (v: Vacancy) => (/zlecen/i.test(v.contract) ? 'zlecenie' : /o\s*prac/i.test(v.contract) ? 'o-prace' : 'other') as 'zlecenie' | 'o-prace' | 'other'
const monthKey = (d: Date) => d.toISOString().slice(0, 7)
const prevMonth = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`
}

async function readSnapshot(month: string): Promise<Snapshot | null> {
  if (!hasDb) return null
  try {
    const rows = (await sql`select data from settings where key = ${'salary-index:' + month}`) as { data: Snapshot }[]
    return rows[0]?.data ?? null
  } catch {
    return null
  }
}

/** the month's figures, written once (the first render of a month); never fails the page */
async function keepSnapshot(s: Snapshot) {
  if (!hasDb) return
  try {
    await sql`insert into settings (key, data, updated_at) values (${'salary-index:' + s.month}, ${JSON.stringify(s)}::jsonb, now()) on conflict (key) do nothing`
  } catch (e) {
    console.error('[salary-index] snapshot not saved', e)
  }
}

/** one calculation per request (metadata + page) */
export const salaryIndexCached = cache(() => salaryIndex())

export async function salaryIndex(now = new Date()): Promise<SalaryIndex> {
  // today's vacancies of the agency (Ukrainian list; revived old posts excluded — their rates are recalculated)
  const live = (await getActiveVacancies('uk')).filter((v) => !v.revived)
  const rates = live.map(rateOf).filter((r) => r.hour != null || r.month != null)
  const byCountry = new Map<string, Rate[]>()
  for (const r of rates) byCountry.set(r.v.country, [...(byCountry.get(r.v.country) ?? []), r])
  const countries = [...byCountry.entries()]
    .filter(([, xs]) => xs.length >= MIN_GROUP && COUNTRY[xs[0].v.country])
    .map(([code, xs]) => ({ code, ...group(code, xs)! }))
    .sort((a, b) => b.n - a.n)
  const pl = byCountry.get('pl') ?? []
  const plCategories = Object.keys(CATEGORY)
    .map((c) => ({ c: c as Category, xs: pl.filter((r) => r.v.category === c) }))
    .filter(({ xs }) => xs.length >= MIN_SUB)
    .map(({ c, xs }) => ({ category: c, ...group(c, xs)! }))
    .sort((a, b) => (b.hourMedian ?? 0) - (a.hourMedian ?? 0))
  const plContracts = (['zlecenie', 'o-prace', 'other'] as const)
    .map((k) => ({ k, xs: pl.filter((r) => contractOf(r.v) === k) }))
    .filter(({ xs }) => xs.length >= MIN_SUB)
    .map(({ k, xs }) => ({ contract: k, ...group(k, xs)! }))
  const plTop = [...pl].filter((r) => r.hour != null).sort((a, b) => (b.hour ?? 0) - (a.hour ?? 0)).slice(0, 8)

  const month = monthKey(now)
  const snapshot: Snapshot = {
    month,
    at: now.toISOString(),
    total: rates.length,
    countries: Object.fromEntries(countries.map((c) => [c.code, { n: c.n, hourMedian: c.hourMedian, monthMedian: c.monthMedian, monthEur: c.monthEur }])),
  }
  const [kept, previous] = await Promise.all([readSnapshot(month), readSnapshot(prevMonth(month))])
  if (!kept) await keepSnapshot(snapshot)
  return { at: now.toISOString(), month, total: rates.length, countries, plCategories, plContracts, plTop, previous }
}
