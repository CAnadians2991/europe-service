import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { uploads, UPLOADS_PATH } from './storage'
import { hasDb, sql } from './db'
import { ADMIN_COOKIE, verifySession } from './admin-auth'
import { FILES_PREFIX, type AdminFile } from './admin-files'
import { SITE } from './site'
import type { Lead, Salary, Vacancy } from './types'

export async function requireAdmin() {
  const ok = await verifySession((await cookies()).get(ADMIN_COOKIE)?.value)
  if (!ok) redirect('/admin/login')
}

function needDb() {
  if (!hasDb) throw new Error('База даних не підключена')
}

export async function adminListVacancies(): Promise<Vacancy[]> {
  needDb()
  // 1 400+ rows (closed Tilda posts included): the list needs no texts, so the heavy fields stay in the database
  const rows = (await sql`select data - 'sections' - 'intro' - 'reviews' - 'housingPhotos' - 'ru' as data from vacancies order by active desc, sort asc, updated_at desc`) as { data: Vacancy }[]
  return rows.map((r) => Object.assign({ sections: [], intro: '', reviews: [], housingPhotos: [] }, r.data) as Vacancy)
}

/** One row of the admin list: only what the list shows (1 400+ rows travel to the browser on every refresh) */
export interface AdminVacancyRow {
  id: string
  path: string
  active: boolean
  hot: boolean
  title: string
  company: string
  city: string
  country: string
  photo: string
  salary: Salary
  updatedAt: string
  /** imported from Tilda (closed posts are 1 200+ of them) */
  tilda: boolean
  /** has a Russian translation */
  ru: boolean
}

export async function adminListRows(): Promise<AdminVacancyRow[]> {
  needDb()
  const rows = (await sql`
    select id, path, active, coalesce((data->>'hot')::boolean, false) as hot,
      coalesce(data->>'title', '') as title, coalesce(data->>'company', '') as company, coalesce(data->>'city', '') as city,
      coalesce(data->>'country', 'pl') as country, coalesce(data->'photos'->>0, '') as photo,
      (data->'salary') - 'source' - 'uplift' - 'modern' as salary, coalesce(data->>'updatedAt', updated_at::text) as updated_at,
      (data->>'tildaUid') is not null as tilda, coalesce(data->'ru'->>'title', '') <> '' as ru
    from vacancies order by active desc, sort asc, updated_at desc`) as {
    id: string; path: string; active: boolean; hot: boolean; title: string; company: string; city: string; country: string
    photo: string; salary: Salary | null; updated_at: string; tilda: boolean; ru: boolean
  }[]
  return rows.map((r) => ({
    id: r.id,
    path: r.path,
    active: r.active,
    hot: r.hot,
    title: r.title,
    company: r.company,
    city: r.city,
    country: r.country,
    photo: r.photo,
    salary: r.salary ?? { text: '', hourMin: null, hourMax: null, monthMin: null, monthMax: null, currency: 'PLN', net: true },
    updatedAt: r.updated_at,
    tilda: r.tilda,
    ru: r.ru,
  }))
}

/**
 * A vacancy's address may follow a new title only while nobody could have linked to it: an admin draft that was never
 * shown on the site. Imported Tilda posts, anything active now or ever (history), anything not /tpost/… — fixed for good.
 */
export async function adminPathLocked(v: Pick<Vacancy, 'id' | 'path' | 'active' | 'tildaUid'>): Promise<boolean> {
  if (v.active || v.tildaUid || !/^\/tpost\/[a-z0-9]{10}-/.test(v.path)) return true
  if (!hasDb) return true
  const rows = (await sql`
    select 1 from vacancy_history
    where vacancy_id = ${v.id} and data is not null and coalesce((data->>'active')::boolean, false) limit 1`) as unknown[]
  return rows.length > 0
}

/** A Tilda-style post id (`ab12cd34e1`) already used by some vacancy address */
export async function adminTpostUidTaken(uid: string) {
  const rows = (await sql`select 1 from vacancies where path like ${`%/tpost/${uid}-%`} limit 1`) as unknown[]
  return rows.length > 0
}

/** Vacancies per country, the hidden ones too (the cached site list has only the open ones) */
export async function adminCountryCounts(): Promise<Record<string, { active: number; hidden: number }>> {
  needDb()
  const rows = (await sql`
    select coalesce(data->>'country', '') as country, count(*) filter (where active)::int as active, count(*) filter (where not active)::int as hidden
    from vacancies group by 1`) as { country: string; active: number; hidden: number }[]
  return Object.fromEntries(rows.map((r) => [r.country, { active: r.active, hidden: r.hidden }]))
}

export async function adminGetVacancy(id: string): Promise<Vacancy | null> {
  needDb()
  const rows = (await sql`select data from vacancies where id = ${id}`) as { data: Vacancy }[]
  return rows[0]?.data ?? null
}

export async function adminPathTaken(path: string, exceptId?: string) {
  const rows = (await sql`select id from vacancies where lower(path) = lower(${path}) and id <> ${exceptId ?? ''}`) as { id: string }[]
  return rows.length > 0
}

export async function adminSaveVacancy(v: Vacancy, isNew: boolean) {
  needDb()
  const prev = isNew ? null : await adminGetVacancy(v.id)
  if (prev) await sql`insert into vacancy_history (vacancy_id, action, data) values (${v.id}, 'update', ${JSON.stringify(prev)})`
  await sql`
    insert into vacancies (id, path, active, sort, data, created_at, updated_at)
    values (${v.id}, ${v.path}, ${v.active}, ${v.order}, ${JSON.stringify(v)}, ${v.createdAt}, ${v.updatedAt})
    on conflict (id) do update set path = excluded.path, active = excluded.active, sort = excluded.sort, data = excluded.data, updated_at = excluded.updated_at`
  if (isNew) await sql`insert into vacancy_history (vacancy_id, action, data) values (${v.id}, 'create', null)`
}

export async function adminDeleteVacancy(id: string) {
  needDb()
  const prev = await adminGetVacancy(id)
  if (!prev) return
  await sql`insert into vacancy_history (vacancy_id, action, data) values (${id}, 'delete', ${JSON.stringify(prev)})`
  await sql`delete from vacancies where id = ${id}`
}

export async function adminDeleted(): Promise<{ id: number; vacancy_id: string; created_at: string; data: Vacancy }[]> {
  needDb()
  return (await sql`
    select h.id, h.vacancy_id, h.created_at, h.data from vacancy_history h
    where h.action = 'delete' and h.created_at > now() - interval '60 days'
      and not exists (select 1 from vacancies v where v.id = h.vacancy_id)
    order by h.created_at desc limit 50`) as { id: number; vacancy_id: string; created_at: string; data: Vacancy }[]
}

export async function adminRestore(historyId: number) {
  needDb()
  const rows = (await sql`select data from vacancy_history where id = ${historyId}`) as { data: Vacancy }[]
  const v = rows[0]?.data
  if (!v) return null
  let path = v.path
  if (await adminPathTaken(path, v.id)) path = `${path}-${Date.now().toString(36).slice(-4)}`
  const restored = { ...v, path, active: false, updatedAt: new Date().toISOString() }
  await adminSaveVacancy(restored, true)
  return restored
}

/**
 * Versions to restore. Each 'update' row holds the vacancy as it was BEFORE that save; `version_at` = when that
 * version itself was saved. Rows that differ from the next newer version only by the on/off switches (list toggles
 * «На сайті» / «Топ») are skipped — restoring keeps those switches as they are anyway.
 */
export async function adminHistory(id: string) {
  needDb()
  const [rows, cur] = (await Promise.all([
    sql`select id, action, created_at, data from vacancy_history where vacancy_id = ${id} order by created_at desc limit 60`,
    adminGetVacancy(id),
  ])) as [{ id: number; action: string; created_at: string; data: Vacancy | null }[], Vacancy | null]
  const content = (v: Vacancy | null) => v && JSON.stringify({ ...v, active: null, hot: null, updatedAt: null })
  let newer = content(cur)
  const out: { id: number; action: string; created_at: string; version_at: string | null }[] = []
  for (const r of rows) {
    const c = content(r.data)
    if (r.action === 'update' && c === newer) continue
    newer = c ?? newer
    out.push({ id: r.id, action: r.action, created_at: r.created_at, version_at: r.data?.updatedAt ?? null })
    if (out.length === 20) break
  }
  return out
}

export async function adminRestoreVersion(historyId: number) {
  const rows = (await sql`select vacancy_id, data from vacancy_history where id = ${historyId} and data is not null`) as { vacancy_id: string; data: Vacancy }[]
  const r = rows[0]
  if (!r) return null
  const cur = await adminGetVacancy(r.vacancy_id)
  // restore the content only: whether it is on the site / in «Найкращі» stays as it is now
  const v = { ...r.data, path: cur?.path ?? r.data.path, active: cur?.active ?? false, hot: cur?.hot ?? r.data.hot, updatedAt: new Date().toISOString() }
  await adminSaveVacancy(v, !cur)
  return v
}

/* ---------------- leads ---------------- */

type LeadRow = {
  id: string
  created_at: string
  name: string
  phone: string
  form: string
  vacancy_id: string | null
  vacancy_title: string | null
  answers: Record<string, string> | null
  page: string | null
  referrer: string | null
  utm: Record<string, string> | null
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  fbclid: string | null
  status: Lead['status']
  note: string | null
  delivered: Record<string, string> | null
}

export async function adminLeads(limit = 500) {
  needDb()
  return (await sql`select * from leads order by created_at desc limit ${limit}`) as LeadRow[]
}

export async function adminLeadStats() {
  needDb()
  const [r] = (await sql`
    select
      count(*) filter (where created_at > date_trunc('day', now() at time zone 'Europe/Kyiv') at time zone 'Europe/Kyiv')::int as today,
      count(*) filter (where created_at > now() - interval '7 days')::int as week,
      count(*) filter (where created_at > now() - interval '30 days')::int as month,
      count(*) filter (where created_at > now() - interval '30 days' and (gclid is not null or gbraid is not null or wbraid is not null))::int as ads_month,
      count(*) filter (where status = 'new')::int as new
    from leads`) as { today: number; week: number; month: number; ads_month: number; new: number }[]
  return r
}

export async function adminSetLead(id: string, status: Lead['status'], note?: string) {
  needDb()
  await sql`update leads set status = ${status}, note = coalesce(${note ?? null}, note) where id = ${id}`
}

export type { LeadRow }

/* ---------------- files («Файли») ---------------- */

/** Everything uploaded in «Файли», newest first; null = Netlify Blobs isn't reachable (e.g. plain `next dev`) */
export async function adminListFiles(): Promise<AdminFile[] | null> {
  try {
    const store = uploads()
    const { blobs } = await store.list({ prefix: FILES_PREFIX })
    const out = await Promise.all(
      blobs.map(async (b) => {
        const m = ((await store.getMetadata(b.key))?.metadata ?? {}) as { size?: number; uploadedAt?: string }
        const url = SITE.url + UPLOADS_PATH + b.key
        return { url, downloadUrl: `${url}?download`, pathname: b.key, size: Number(m.size) || 0, uploadedAt: m.uploadedAt || '' }
      }),
    )
    return out.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  } catch (e) {
    console.error('[files] list failed', e)
    return null
  }
}
