import 'server-only'
import { unstable_cache } from 'next/cache'
import seed from '@/data/vacancies.seed.json'
import { hasDb, sql } from './db'
import { ensureCountries } from './countries'
import type { Vacancy, VacancyCard } from './types'

export const VACANCIES_TAG = 'vacancies'

const SEED = seed as unknown as Vacancy[]

/**
 * Open vacancies in PARTS cache entries: Next keeps no data-cache entry over 2 MB, and with the ~950 revived Tilda posts
 * (2026-10) the open list is ~3,5 MB. part 0 = today's vacancies, 1…PARTS-1 = the revived posts split by id.
 * The switched-off pages are read one by one (getVacancyByPath).
 */
// 7 since 2026-10-13: the Russian texts of the ~900 revived posts doubled their size (4 parts were 2,3–2,6 MB each)
const PARTS = 7
async function readPart(part: number): Promise<Vacancy[] | null> {
  if (!hasDb) return null
  try {
    const rows = (
      part === 0
        ? await sql`select data from vacancies where active and not (data ? 'revived') order by sort asc, updated_at desc`
        : await sql`select data from vacancies where active and data ? 'revived' and mod(abs(hashtext(id)), ${PARTS - 1}::int) = ${part - 1}::int order by sort asc, updated_at desc`
    ) as { data: Vacancy }[]
    return rows.map((r) => r.data)
  } catch (e) {
    console.error('[vacancies] DB read failed, using seed', e)
    return null
  }
}

const cachedPart = unstable_cache(readPart, ['vacancies-open-v12'], { tags: [VACANCIES_TAG] })

/** local development without a database: today's vacancies + the revived posts from data/vacancies.closed.json */
let revivedLocal: Vacancy[] | null = null
async function revivedFromFile(): Promise<Vacancy[]> {
  if (!revivedLocal) {
    try {
      const { readFile } = await import('node:fs/promises')
      revivedLocal = (JSON.parse(await readFile(process.cwd() + '/data/vacancies.closed.json', 'utf8')) as Vacancy[]).filter((v) => v.active)
    } catch {
      revivedLocal = []
    }
  }
  return revivedLocal
}

/** Open vacancies, cached until an admin edit revalidates the tag. Loads the admin's countries too. */
export async function getAllVacancies(): Promise<Vacancy[]> {
  await ensureCountries()
  const parts = await Promise.all(Array.from({ length: PARTS }, (_, i) => cachedPart(i)))
  // a brand-new Netlify Database is empty until the first CI build seeds it — show the Tilda import meanwhile
  // one order for all parts — the admin can move a revived post above today's ones (stable sort keeps ties as read)
  const byOrder = (xs: Vacancy[]) => xs.sort((a, b) => a.order - b.order)
  if (parts.some((p) => p === null) || !parts[0]!.length) return byOrder([...SEED, ...(await revivedFromFile())])
  return byOrder((parts as Vacancy[][]).flat())
}

/**
 * The vacancies a page of this language lists: UA pages — the Ukrainian ones, RU pages — the ones with a Russian text
 * (a translation, or an old Russian Tilda post). Without `lang`: all open ones (sitemap, llms.txt, API).
 */
export function forLang(vs: Vacancy[], lang?: 'uk' | 'ru'): Vacancy[] {
  if (!lang) return vs
  return lang === 'ru' ? vs.filter((v) => v.lang === 'ru' || Boolean(v.ru?.title)) : vs.filter((v) => v.lang !== 'ru')
}

export async function getActiveVacancies(lang?: 'uk' | 'ru'): Promise<Vacancy[]> {
  return forLang((await getAllVacancies()).filter((v) => v.active), lang)
}

/** local development without a database: the closed posts from data/vacancies.closed.json */
let closedLocal: Map<string, Vacancy> | null = null
async function closedFromFile(p: string) {
  if (!closedLocal) {
    closedLocal = new Map()
    try {
      const { readFile } = await import('node:fs/promises')
      const list = JSON.parse(await readFile(process.cwd() + '/data/vacancies.closed.json', 'utf8')) as Vacancy[]
      for (const v of list) closedLocal.set(v.path.toLowerCase(), v)
    } catch {}
  }
  return closedLocal.get(p) ?? null
}

const closedByPath = unstable_cache(
  async (p: string): Promise<Vacancy | null> => {
    if (!hasDb) return closedFromFile(p)
    try {
      const rows = (await sql`select data from vacancies where lower(path) = ${p} limit 1`) as { data: Vacancy }[]
      return rows[0]?.data ?? null
    } catch {
      return null
    }
  },
  ['vacancy-by-path-v1'],
  { tags: [VACANCIES_TAG] },
)

/** Any vacancy page by its address: open ones from the cached list, closed Tilda ones straight from the database */
export async function getVacancyByPath(path: string): Promise<Vacancy | undefined> {
  let p = path
  try {
    p = decodeURI(path)
  } catch {}
  p = p.replace(/\/+$/, '').toLowerCase()
  const open = (await getAllVacancies()).find((v) => v.path.toLowerCase() === p)
  return open ?? (await closedByPath(p)) ?? undefined
}

/** Addresses of the closed vacancies (they stay online as on Tilda) — for the sitemap */
export async function getClosedVacancyPaths(): Promise<{ path: string; updatedAt: string; hasRu: boolean; title: string; ruTitle: string; country: string; lang: 'uk' | 'ru' }[]> {
  if (!hasDb) return []
  try {
    // hasRu: a translated post has its Russian page at /ru + its address (vacancy-i18n hasRu); titles for the Markdown maps
    const rows = (await sql`select path, updated_at, data->>'title' as title, coalesce(data->'ru'->>'title', '') as ru_title, data->>'country' as country, coalesce(data->>'lang', 'uk') as lang from vacancies where not active order by path`) as { path: string; updated_at: string; title: string; ru_title: string; country: string; lang: 'uk' | 'ru' }[]
    return rows.map((r) => ({
      path: r.path,
      updatedAt: new Date(r.updated_at).toISOString(),
      hasRu: Boolean(r.ru_title) && r.lang !== 'ru',
      title: r.title,
      ruTitle: r.ru_title,
      country: r.country,
      lang: r.lang,
    }))
  } catch {
    return []
  }
}

export function toCard(v: Vacancy): VacancyCard {
  return {
    id: v.id,
    path: v.path,
    country: v.country,
    title: v.title,
    company: v.company,
    city: v.city,
    category: v.category,
    genders: v.genders,
    // what a card shows (the Tilda source text and the rate history stay on the vacancy)
    salary: { text: v.salary.text.slice(0, 60), hourMin: v.salary.hourMin, hourMax: v.salary.hourMax, monthMin: v.salary.monthMin, monthMax: v.salary.monthMax, currency: v.salary.currency, net: v.salary.net, unlabelled: v.salary.unlabelled },
    schedule: v.schedule.split(/[,;]/)[0].slice(0, 60),
    housingFree: v.housingFree,
    hot: v.hot,
    order: v.order,
    photo: v.photos[0] ?? '',
    logo: v.logo ?? '',
    updatedAt: v.updatedAt,
  }
}

const hash32 = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h
}

/** Similar vacancies for "Дивіться також": the closest by country / sphere / city first, then this vacancy's neighbours
 *  in a stable ring of the same country and sphere — so every vacancy is linked from a few others (crawl 13.10.2026:
 *  477 old posts had no internal link at all, because the top of the list was the same everywhere). */
export function similar(all: Vacancy[], v: Vacancy, n = 6): Vacancy[] {
  const score = (x: Vacancy) =>
    (x.country === v.country ? 4 : 0) + (x.category === v.category ? 2 : 0) + (x.city === v.city ? 1 : 0) + (x.hot ? 0.5 : 0)
  const pool = all.filter((x) => x.active && x.id !== v.id)
  const top = [...pool].sort((a, b) => score(b) - score(a) || a.order - b.order).slice(0, Math.ceil(n / 2))
  const rest = pool.filter((x) => !top.includes(x) && x.country === v.country)
  const same = rest.filter((x) => x.category === v.category)
  const me = hash32(v.id)
  const next = (xs: Vacancy[]) => [...xs].sort((a, b) => ((hash32(a.id) - me) >>> 0) - ((hash32(b.id) - me) >>> 0))
  const ring = [...next(same.length >= n - top.length ? same : rest)]
  const out = [...top, ...ring.slice(0, n - top.length)]
  // a small country: fill from the best of the rest
  for (const x of [...pool].sort((a, b) => score(b) - score(a) || a.order - b.order)) {
    if (out.length >= n) break
    if (!out.includes(x)) out.push(x)
  }
  return out
}
