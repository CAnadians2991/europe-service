import 'server-only'
import { unstable_cache } from 'next/cache'
import seed from '@/data/vacancies.seed.json'
import { hasDb, sql } from './db'
import { ensureCountries } from './countries'
import type { Vacancy, VacancyCard } from './types'

export const VACANCIES_TAG = 'vacancies'

const SEED = seed as unknown as Vacancy[]

async function readAll(): Promise<Vacancy[]> {
  if (!hasDb) return SEED
  try {
    // only open vacancies are cached in one piece; the 1 200+ closed Tilda pages are read one by one (getVacancyByPath)
    const rows = (await sql`select data from vacancies where active order by sort asc, updated_at desc`) as { data: Vacancy }[]
    // a brand-new Netlify Database is empty until the first CI build seeds it — show the Tilda import meanwhile
    return rows.length ? rows.map((r) => r.data) : SEED
  } catch (e) {
    console.error('[vacancies] DB read failed, using seed', e)
    return SEED
  }
}

const cachedAll = unstable_cache(readAll, ['vacancies-open-v10'], { tags: [VACANCIES_TAG] })

/** Open vacancies, cached until an admin edit revalidates the tag. Loads the admin's countries too. */
export async function getAllVacancies(): Promise<Vacancy[]> {
  await ensureCountries()
  return cachedAll()
}

export async function getActiveVacancies(): Promise<Vacancy[]> {
  return (await getAllVacancies()).filter((v) => v.active)
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
export async function getClosedVacancyPaths(): Promise<{ path: string; updatedAt: string }[]> {
  if (!hasDb) return []
  try {
    return ((await sql`select path, updated_at from vacancies where not active order by path`) as { path: string; updated_at: string }[]).map((r) => ({
      path: r.path,
      updatedAt: new Date(r.updated_at).toISOString(),
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
    salary: { ...v.salary, text: v.salary.text.slice(0, 60) },
    schedule: v.schedule.split(/[,;]/)[0].slice(0, 60),
    housingFree: v.housingFree,
    hot: v.hot,
    order: v.order,
    photo: v.photos[0] ?? '',
    logo: v.logo ?? '',
    updatedAt: v.updatedAt,
  }
}

/** Similar vacancies for "Дивіться також" */
export function similar(all: Vacancy[], v: Vacancy, n = 6): Vacancy[] {
  const score = (x: Vacancy) =>
    (x.country === v.country ? 4 : 0) + (x.category === v.category ? 2 : 0) + (x.city === v.city ? 1 : 0) + (x.hot ? 0.5 : 0)
  return all
    .filter((x) => x.active && x.id !== v.id)
    .sort((a, b) => score(b) - score(a) || a.order - b.order)
    .slice(0, n)
}
