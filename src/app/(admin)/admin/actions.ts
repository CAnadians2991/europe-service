'use server'

import crypto from 'node:crypto'
import { uploads, UPLOADS_PATH } from '@/lib/storage'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { after } from 'next/server'
import { pingIndexNow } from '@/lib/indexnow'
import { ADMIN_COOKIE, checkPassword, createSession } from '@/lib/admin-auth'
import {
  adminDeleteVacancy,
  adminGetVacancy,
  adminPathTaken,
  adminRestore,
  adminRestoreVersion,
  adminSaveVacancy,
  adminSetLead,
  requireAdmin,
} from '@/lib/admin-data'
import { VACANCIES_TAG, getAllVacancies } from '@/lib/vacancies'
import { ABOUT_TAG } from '@/lib/about'
import { hasDb, sql } from '@/lib/db'
import type { About } from '@/lib/about-types'
import { COUNTRIES, COUNTRY, SITE, flagOf, type CountryInfo, newVacancyPath } from '@/lib/site'
import { COUNTRIES_TAG, ensureCountries, getExtraCountries } from '@/lib/countries'
import { RESERVED_SLUGS, getLanding } from '@/lib/landing'
import { slugify } from '@/lib/format'
import type { Lead, Vacancy } from '@/lib/types'

/* ---------- auth ---------- */

export async function login(_: unknown, fd: FormData) {
  const password = String(fd.get('password') || '')
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800))
    return { error: 'Невірний пароль' }
  }
  const s = await createSession()
  ;(await cookies()).set(ADMIN_COOKIE, s.value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: s.maxAge })
  const next = String(fd.get('next') || '')
  redirect(/^\/admin(\/[\w\-/]*)?$/.test(next) ? next : '/admin/vacancies')
}

export async function logout() {
  ;(await cookies()).delete(ADMIN_COOKIE)
  redirect('/admin/login')
}

/* ---------- vacancies ---------- */

function refresh(paths: string[]) {
  updateTag(VACANCIES_TAG)
  for (const p of new Set(paths)) revalidatePath(p)
  revalidatePath('/api/quiz-vacancies')
  revalidatePath('/', 'layout')
  // Bing & co. learn about the change at once (ChatGPT search reads Bing's index)
  after(() => pingIndexNow([...paths, '/llms.txt']))
}

const clean = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim()
const numOrNull = (x: unknown) => {
  if (x === null || x === undefined || x === '') return null
  const n = Number(String(x).replace(',', '.').replace(/\s/g, ''))
  return Number.isFinite(n) ? n : null
}

export type SaveResult = { ok: true; id: string; path: string } | { ok: false; error: string }

export async function saveVacancy(input: Vacancy, isNew: boolean): Promise<SaveResult> {
  await requireAdmin()
  await ensureCountries()
  try {
    const title = clean(input.title)
    if (title.length < 5) return { ok: false, error: 'Вкажіть назву вакансії (мінімум 5 символів).' }
    if (!COUNTRY[input.country]) return { ok: false, error: 'Оберіть країну.' }

    const id = isNew ? `${slugify(title).slice(0, 40)}-${crypto.randomBytes(2).toString('hex')}` : input.id
    // Addresses follow Tilda's logic and never change once published: an existing vacancy keeps its path;
    // a new one gets /tpost/<10-char id>-<transliterated title>, exactly like Tilda Feeds made them
    let path = clean(input.path).replace(/\/{2,}/g, '/').replace(/(.)\/+$/, '$1')
    if (!path) path = newVacancyPath(title)
    if (!/^\/[a-z0-9_\-/]+$/i.test(path)) return { ok: false, error: 'Адреса сторінки — лише латиниця, цифри, дефіс і «/», напр. /tpost/ab12cd34e1-pakuvalnik.' }
    if (!isNew) {
      const before = await adminGetVacancy(id)
      if (before && before.path !== path && before.active) return { ok: false, error: `Адресу опублікованої вакансії не змінюємо (на неї можуть вести посилання): ${before.path}` }
    }
    if (COUNTRIES.some((c) => c.path === path) || getLanding(path) || RESERVED_SLUGS.has(path.replace(/^\//, '')))
      return { ok: false, error: 'Ця адреса зайнята сторінкою каталогу (країна, місто чи розділ).' }
    if (await adminPathTaken(path, isNew ? undefined : id)) {
      if (isNew && !input.path) path = newVacancyPath(title)
      else return { ok: false, error: `Адреса ${path} вже використовується іншою вакансією.` }
    }

    const prev = isNew ? null : await adminGetVacancy(id)
    const now = new Date().toISOString()
    const s = input.salary
    const v: Vacancy = {
      ...input,
      id,
      path,
      title,
      company: clean(input.company),
      city: clean(input.city),
      schedule: clean(input.schedule),
      contract: clean(input.contract),
      housing: clean(input.housing),
      headline: clean(input.headline),
      intro: String(input.intro ?? '').trim(),
      order: Number.isFinite(input.order) ? input.order : 0,
      genders: ['men', 'women', 'couples'], // no gender restrictions on the site
      salary: {
        text: clean(s.text),
        hourMin: numOrNull(s.hourMin),
        hourMax: numOrNull(s.hourMax) ?? numOrNull(s.hourMin),
        monthMin: numOrNull(s.monthMin),
        monthMax: numOrNull(s.monthMax) ?? numOrNull(s.monthMin),
        currency: s.currency,
        net: !!s.net,
        ...(s.unlabelled ? { unlabelled: true } : {}),
      },
      sections: input.sections
        .map((x) => ({ title: clean(x.title), items: x.items.map(clean).filter(Boolean) }))
        .filter((x) => x.title || x.items.length),
      // date / rating come from imported client reviews (no fields for them in the editor) — kept as they are
      reviews: input.reviews
        .map((r) => ({
          name: clean(r.name),
          text: String(r.text).trim(),
          ...(clean(r.date) ? { date: clean(r.date) } : {}),
          ...(Number.isFinite(r.rating) ? { rating: r.rating } : {}),
        }))
        .filter((r) => r.name && r.text),
      seoTitle: clean(input.seoTitle),
      seoDescription: clean(input.seoDescription),
      // empty → undefined (dropped from the stored JSON)
      workAddress:
        clean(input.workAddress?.street) || clean(input.workAddress?.postalCode)
          ? { street: clean(input.workAddress?.street).slice(0, 120), postalCode: clean(input.workAddress?.postalCode).slice(0, 12) }
          : undefined,
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    }
    if (!v.salary.text && !v.salary.monthMin && !v.salary.hourMin) return { ok: false, error: 'Вкажіть зарплату (текстом або цифрами).' }
    const swapped = (a: number | null, b: number | null) => a !== null && b !== null && a > b
    if (swapped(v.salary.hourMin, v.salary.hourMax) || swapped(v.salary.monthMin, v.salary.monthMax))
      return { ok: false, error: 'Зарплата «від» більша за «до» — перевірте цифри.' }

    await adminSaveVacancy(v, isNew)
    refresh([v.path, prev?.path ?? v.path, COUNTRY[v.country].path, '/vacancies/aktualni_vakansii', '/'])
    return { ok: true, id: v.id, path: v.path }
  } catch (e) {
    console.error(e)
    return { ok: false, error: e instanceof Error ? e.message : 'Помилка збереження' }
  }
}

export async function setActive(id: string, active: boolean) {
  await requireAdmin()
  await ensureCountries()
  const v = await adminGetVacancy(id)
  if (!v) return
  await adminSaveVacancy({ ...v, active, updatedAt: new Date().toISOString() }, false)
  refresh([v.path, COUNTRY[v.country].path, '/vacancies/aktualni_vakansii', '/'])
}

export async function setHot(id: string, hot: boolean) {
  await requireAdmin()
  await ensureCountries()
  const v = await adminGetVacancy(id)
  if (!v) return
  await adminSaveVacancy({ ...v, hot }, false)
  refresh(['/', '/ru'])
}

export async function deleteVacancy(id: string) {
  await requireAdmin()
  await ensureCountries()
  const v = await adminGetVacancy(id)
  await adminDeleteVacancy(id)
  if (v) refresh([v.path, COUNTRY[v.country].path, '/vacancies/aktualni_vakansii', '/'])
}

export async function duplicateVacancy(id: string) {
  await requireAdmin()
  await ensureCountries()
  const v = await adminGetVacancy(id)
  if (!v) return
  const copy: Vacancy = { ...v, id: '', path: '', title: `${v.title} (копія)`, active: false, hot: false }
  const r = await saveVacancy(copy, true)
  if (r.ok) redirect(`/admin/vacancies/${r.id}`)
}

export async function restoreDeleted(historyId: number) {
  await requireAdmin()
  await ensureCountries()
  const v = await adminRestore(historyId)
  if (v) refresh([v.path, '/vacancies/aktualni_vakansii'])
}

export async function restoreVersion(historyId: number) {
  await requireAdmin()
  await ensureCountries()
  const v = await adminRestoreVersion(historyId)
  if (v) refresh([v.path, COUNTRY[v.country].path, '/vacancies/aktualni_vakansii', '/'])
}

/* ---------- images ---------- */

export async function uploadImage(fd: FormData): Promise<{ ok: true; base: string } | { ok: false; error: string }> {
  await requireAdmin()
  await ensureCountries()
  const file = fd.get('file')
  const folder = String(fd.get('folder') || 'misc').replace(/[^a-z0-9-]/gi, '').slice(0, 60) || 'misc'
  if (!(file instanceof File) || !file.size) return { ok: false, error: 'Файл не отримано' }
  // the browser shrinks photos to ≤1800 px first; server actions can't receive more than 4 MB anyway (next.config.ts)
  if (file.size > 4 * 1024 * 1024) return { ok: false, error: 'Фото завелике (можна до 4 МБ). Зменште його й спробуйте ще раз.' }
  try {
    // loaded here, not at the top: a native-module problem must not break login and the other actions
    const { default: sharp } = await import('sharp')
    const buf = Buffer.from(await file.arrayBuffer())
    const img = sharp(buf, { failOn: 'none' }).rotate()
    const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12)
    const key = `v/${folder}/${hash}`
    const store = uploads()
    await Promise.all(
      ([480, 800, 1200] as const).map(async (w) => {
        const out = await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: w === 480 ? 72 : 78 }).toBuffer()
        await store.set(`${key}-${w}.webp`, new Uint8Array(out).buffer, { metadata: { contentType: 'image/webp' } })
      }),
    )
    return { ok: true, base: UPLOADS_PATH + key }
  } catch (e) {
    console.error(e)
    return { ok: false, error: 'Не вдалося обробити фото. Збережіть його як JPG або PNG і спробуйте ще раз (формат HEIC з iPhone завантажуйте прямо з телефону).' }
  }
}

/* ---------- files («Файли»; uploads go browser → Blob via files/upload/route.ts) ---------- */

export async function deleteFile(url: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  await ensureCountries()
  let u: URL
  try {
    u = new URL(url, SITE.url)
  } catch {
    return { ok: false, error: 'Невірне посилання' }
  }
  // only files from this section — never vacancy photos (v/…)
  if (!u.pathname.startsWith(`${UPLOADS_PATH}files/`)) return { ok: false, error: 'Тут можна видаляти лише файли з розділу «Файли»' }
  try {
    await uploads().delete(decodeURIComponent(u.pathname.slice(UPLOADS_PATH.length)))
  } catch (e) {
    console.error(e)
    return { ok: false, error: 'Не вдалося видалити файл. Спробуйте ще раз.' }
  }
  revalidatePath('/admin/files')
  return { ok: true }
}

/* ---------- leads ---------- */

export async function updateLead(id: string, status: Lead['status'], note?: string) {
  await requireAdmin()
  await ensureCountries()
  await adminSetLead(id, status, note)
  revalidatePath('/admin/leads')
}

/** «Повторити в Bitrix» for a lead Bitrix did not accept (Bitrix was down, webhook changed…) */
export async function retryLeadBitrix(id: string): Promise<{ ok: boolean }> {
  await requireAdmin()
  await ensureCountries()
  const { retryBitrix } = await import('@/lib/leads')
  const d = await retryBitrix(id)
  revalidatePath('/admin/leads')
  return { ok: !!d && (d.bitrix === 'ok' || d.bitrix_script === 'ok') }
}

/* ---------- about: team, office photos, licence ---------- */

export async function saveAbout(input: About): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  await ensureCountries()
  if (!hasDb) return { ok: false, error: 'База даних не підключена' }
  const clean = (x: unknown) => String(x ?? '').trim()
  const data: About = {
    ...input,
    officeText: clean(input.officeText),
    hours: clean(input.hours),
    video: clean(input.video).replace(/^.*(?:v=|youtu\.be\/|shorts\/)([\w-]{11}).*$/, '$1'),
    team: input.team
      .map((m) => ({ ...m, id: m.id || crypto.randomBytes(4).toString('hex'), name: clean(m.name), role: clean(m.role), since: clean(m.since), telegram: clean(m.telegram), viber: clean(m.viber) }))
      .filter((m) => m.name && m.photo),
  }
  await sql`insert into settings (key, data, updated_at) values ('about', ${JSON.stringify(data)}, now())
            on conflict (key) do update set data = excluded.data, updated_at = now()`
  updateTag(ABOUT_TAG)
  revalidatePath('/', 'layout')
  return { ok: true }
}

/* ---------- countries ---------- */

export type CountryInput = Pick<CountryInfo, 'code' | 'name' | 'nameRu' | 'inName' | 'inNameRu' | 'seo'> & { slug: string }

/** Add or edit a country of the catalog (the nine built-in ones are fixed). `origCode` = the code being edited. */
export async function saveCountry(input: CountryInput, origCode?: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  await ensureCountries()
  if (!hasDb) return { ok: false, error: 'База даних не підключена' }
  const code = clean(input.code).toLowerCase()
  const slug = clean(input.slug).toLowerCase()
  const t = { name: clean(input.name), nameRu: clean(input.nameRu), inName: clean(input.inName), inNameRu: clean(input.inNameRu) }
  if (!/^[a-z]{2}$/.test(code)) return { ok: false, error: 'Код країни — дві латинські літери (як у доменах: at — Австрія, es — Іспанія).' }
  if (!t.name || !t.nameRu || !t.inName || !t.inNameRu) return { ok: false, error: 'Заповніть назву та форму «в …» українською й російською.' }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return { ok: false, error: 'Адреса сторінки — латиниця, цифри та дефіс, напр. austria.' }

  const extra = await getExtraCountries()
  const editing = origCode ? extra.find((c) => c.code === origCode) : undefined
  if (origCode && !editing) return { ok: false, error: 'Цю країну не можна змінити (вона вбудована в сайт).' }
  const others = COUNTRIES.filter((c) => c.code !== origCode)
  if (others.some((c) => c.code === code)) return { ok: false, error: `Країна з кодом «${code}» уже є.` }
  if (others.some((c) => c.name.toLowerCase() === t.name.toLowerCase())) return { ok: false, error: `${t.name} уже є в списку.` }
  const path = `/vacancies/${slug}`
  if (others.some((c) => c.path === path) || RESERVED_SLUGS.has(slug)) return { ok: false, error: 'Ця адреса вже зайнята іншою сторінкою каталогу — змініть її.' }
  if ((await getAllVacancies()).some((v) => v.path === path)) return { ok: false, error: 'За цією адресою вже є вакансія — змініть адресу країни.' }
  if (editing && editing.code !== code && (await getAllVacancies()).some((v) => v.country === editing.code))
    return { ok: false, error: 'Код не можна змінити: у цій країні вже є вакансії.' }

  const clip = (x?: string) => clean(x).slice(0, 400) || undefined
  const seo = (s?: { title?: string; description?: string; text?: string }) => {
    const r = { title: clip(s?.title), description: clip(s?.description), text: clip(s?.text) }
    return r.title || r.description || r.text ? r : undefined
  }
  const next: CountryInfo = { code, ...t, path, flag: flagOf(code), custom: true, seo: { uk: seo(input.seo?.uk), ru: seo(input.seo?.ru) } }
  const list = [...extra.filter((c) => c.code !== origCode && c.code !== code), next]
  await sql`insert into settings (key, data, updated_at) values ('countries', ${JSON.stringify(list)}, now())
            on conflict (key) do update set data = excluded.data, updated_at = now()`
  updateTag(COUNTRIES_TAG)
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deleteCountry(code: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  const extra = await getExtraCountries()
  if (!extra.some((c) => c.code === code)) return { ok: false, error: 'Вбудовану країну видалити не можна.' }
  const n = (await getAllVacancies()).filter((v) => v.country === code).length
  if (n) return { ok: false, error: `У цій країні ${n} вакансій (разом із прихованими). Спершу перенесіть або видаліть їх.` }
  await sql`update settings set data = ${JSON.stringify(extra.filter((c) => c.code !== code))}, updated_at = now() where key = 'countries'`
  updateTag(COUNTRIES_TAG)
  revalidatePath('/', 'layout')
  return { ok: true }
}
