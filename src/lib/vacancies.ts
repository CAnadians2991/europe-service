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
    const rows = (await sql`select data from vacancies order by sort asc, updated_at desc`) as { data: Vacancy }[]
    return rows.map((r) => r.data)
  } catch (e) {
    console.error('[vacancies] DB read failed, using seed', e)
    return SEED
  }
}

const cachedAll = unstable_cache(readAll, ['vacancies-all-v7'], { tags: [VACANCIES_TAG] })

/** All vacancies (active + hidden), cached until an admin edit revalidates the tag. Loads the admin's countries too. */
export async function getAllVacancies(): Promise<Vacancy[]> {
  await ensureCountries()
  return cachedAll()
}

export async function getActiveVacancies(): Promise<Vacancy[]> {
  return (await getAllVacancies()).filter((v) => v.active)
}

export async function getVacancyByPath(path: string): Promise<Vacancy | undefined> {
  const p = decodeURI(path).replace(/\/+$/, '').toLowerCase()
  return (await getAllVacancies()).find((v) => v.path.toLowerCase() === p)
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
