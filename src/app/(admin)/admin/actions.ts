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
  adminCountryCounts,
  adminDeleteVacancy,
  adminGetVacancy,
  adminPathLocked,
  adminPathTaken,
  adminTpostUidTaken,
  adminRestore,
  adminRestoreVersion,
  adminSaveVacancy,
  adminSetLead,
  requireAdmin,
} from '@/lib/admin-data'
import { VACANCIES_TAG } from '@/lib/vacancies'
import { ABOUT_TAG } from '@/lib/about'
import { hasDb, sql } from '@/lib/db'
import type { About } from '@/lib/about-types'
import { COUNTRIES, COUNTRY, SITE, flagOf, type CountryInfo, newVacancyPath, tildaSlug } from '@/lib/site'
import { tildaPostTarget } from '@/lib/legacy-urls'
import { COUNTRIES_TAG, ensureCountries, getExtraCountries } from '@/lib/countries'
import { RESERVED_SLUGS, getLanding } from '@/lib/landing'
import { slugify } from '@/lib/format'
import type { Lead, Section, Vacancy, VacancyRu } from '@/lib/types'

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

const TPOST = /^\/tpost\/([a-z0-9]{9}1)-([a-z0-9-]{1,50})$/

/** a /tpost/<id>-… address is free when no vacancy uses the id and it is not an old Tilda post (those redirect) */
async function tpostTaken(path: string) {
  const uid = path.match(TPOST)?.[1]
  if (!uid) return true
  return Boolean(tildaPostTarget(path)) || (await adminTpostUidTaken(uid)) || (await adminPathTaken(path))
}

const cleanSections = (xs: Section[] | undefined) =>
  (xs ?? []).map((x) => ({ title: clean(x.title), items: (x.items ?? []).map(clean).filter(Boolean) })).filter((x) => x.title || x.items.length)

/** The Russian version: trimmed, empty fields dropped; no title = no translation */
function cleanRu(ru: VacancyRu | undefined): VacancyRu | undefined {
  if (!ru || !clean(ru.title)) return undefined
  const out: VacancyRu = { title: clean(ru.title) }
  for (const k of ['headline', 'city', 'schedule', 'contract', 'housing', 'housingNote', 'salaryText', 'seoTitle', 'seoDescription'] as const) {
    const val = clean(ru[k])
    if (val) out[k] = val
  }
  const intro = String(ru.intro ?? '').trim()
  if (intro) out.intro = intro
  const sections = cleanSections(ru.sections)
  if (sections.length) out.sections = sections
  return out
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
    // Addresses follow Tilda's logic (docs/SEO.md): a new vacancy gets /tpost/<10-char id>-<transliterated title>, exactly
    // like Tilda Feeds made them; once anyone could have linked to it (published now or ever, imported from Tilda) it never
    // changes. Only an admin draft that never was on the site follows a new title (same id, new slug).
    const before = isNew ? null : await adminGetVacancy(id)
    if (!isNew && !before) return { ok: false, error: 'Вакансію не знайдено — можливо, її видалили. Оновіть сторінку.' }
    const want = clean(input.path).toLowerCase()
    let path: string
    if (isNew) {
      const m = want.match(TPOST)
      path = m ? `/tpost/${m[1]}-${tildaSlug(title)}` : newVacancyPath(title)
      for (let i = 0; i < 6 && (await tpostTaken(path)); i++) path = newVacancyPath(title)
      if (await tpostTaken(path)) return { ok: false, error: 'Не вдалося підібрати вільну адресу. Спробуйте ще раз.' }
    } else {
      path = before!.path
      if (want && want !== before!.path.toLowerCase()) {
        const was = before!.path.match(TPOST)
        const m = want.match(TPOST)
        if (await adminPathLocked(before!)) return { ok: false, error: `Адресу опублікованої вакансії не змінюємо (на неї можуть вести посилання й реклама): ${before!.path}` }
        if (!was || !m || m[1] !== was[1] || want !== `/tpost/${was[1]}-${tildaSlug(title)}`) return { ok: false, error: 'Адреса чернетки змінюється лише разом із назвою — оновіть сторінку й спробуйте ще раз.' }
        if (await adminPathTaken(want, id)) return { ok: false, error: `Адреса ${want} вже використовується іншою вакансією.` }
        path = want
      }
    }
    if (COUNTRIES.some((c) => c.path === path) || getLanding(path) || RESERVED_SLUGS.has(path.replace(/^\//, '')))
      return { ok: false, error: 'Ця адреса зайнята сторінкою каталогу (країна, місто чи розділ).' }

    const prev = before
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
      hubCity: clean(input.hubCity) || undefined,
      headline: clean(input.headline),
      intro: String(input.intro ?? '').trim(),
      housingNote: clean(input.housingNote),
      videos: (() => {
        const ids = [...new Set((input.videos ?? []).map((x) => clean(x)).filter((x) => /^[\w-]{11}$/.test(x)))]
        return ids.length ? ids : undefined
      })(),
      noLanguage: input.noLanguage ? true : undefined,
      noExperience: input.noExperience ? true : undefined,
      ru: cleanRu(input.ru),
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
        // the pre-uplift text of the 2026-10 import (+19 %) stays while the pay text is the same — so it can be undone
        ...(before?.salary.source && clean(s.text) === clean(before.salary.text) ? { source: before.salary.source, uplift: before.salary.uplift } : {}),
      },
      sections: cleanSections(input.sections),
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
      // not editable in the admin: what the import set stays (a new vacancy or a copy is never a Tilda post)
      tildaUid: prev?.tildaUid,
      lang: isNew ? input.lang : prev?.lang,
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

/**
 * «Порядок на сайті»: `ids` — the switched-on vacancies of one country (or all) in the new order. They take the places
 * the same vacancies held in the site's order, then every row is renumbered 10, 20, 30… (sort = data.order), so the
 * catalog shows exactly this order. No history rows (1 400+ per save); scripts/seed-db.mjs --refresh keeps the order.
 */
export async function reorderVacancies(ids: string[]) {
  await requireAdmin()
  if (!hasDb) throw new Error('База даних не підключена')
  const rows = (await sql`select id, sort from vacancies order by sort asc, updated_at desc`) as { id: string; sort: number }[]
  const known = new Set(rows.map((r) => r.id))
  const queue = ids.filter((id, i) => typeof id === 'string' && known.has(id) && ids.indexOf(id) === i)
  const moving = new Set(queue)
  let k = 0
  const next = rows.map((r) => (moving.has(r.id) ? queue[k++] : r.id))
  const old = new Map(rows.map((r) => [r.id, r.sort]))
  const changed = next.map((id, i) => [id, (i + 1) * 10] as const).filter(([id, s]) => old.get(id) !== s)
  if (changed.length)
    await sql.query(
      `update vacancies t set sort = s.sort, data = jsonb_set(t.data, '{order}', to_jsonb(s.sort))
       from (select unnest($1::text[]) as id, unnest($2::int[]) as sort) s where t.id = s.id`,
      [changed.map((c) => c[0]), changed.map((c) => c[1])],
    )
  refresh(['/vacancies', '/ru/vacancies', '/vacancies/aktualni_vakansii', ...COUNTRIES.map((c) => c.path), '/'])
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
  // a closed draft with its own new /tpost/ address; it follows the title until it is first published
  const copy: Vacancy = { ...v, id: '', path: '', title: `${v.title} (копія)`, active: false, hot: false, tildaUid: undefined }
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
      ([240, 480, 800, 1200] as const).map(async (w) => {
        const out = await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: w <= 480 ? 72 : 78 }).toBuffer()
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

/** every vacancy of a country, the closed ones too (the cached site list has only the open ones) */
async function vacanciesIn(code: string) {
  const c = (await adminCountryCounts())[code]
  return c ? c.active + c.hidden : 0
}

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
  if (others.some((c) => c.path === path) || RESERVED_SLUGS.has(slug) || getLanding(path)) return { ok: false, error: 'Ця адреса вже зайнята іншою сторінкою каталогу — змініть її.' }
  if (await adminPathTaken(path)) return { ok: false, error: 'За цією адресою вже є вакансія — змініть адресу країни.' }
  if (editing && editing.code !== code && (await vacanciesIn(editing.code)))
    return { ok: false, error: 'Код не можна змінити: у цій країні вже є вакансії (разом із вимкненими).' }

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
  if (!hasDb) return { ok: false, error: 'База даних не підключена' }
  const extra = await getExtraCountries()
  if (!extra.some((c) => c.code === code)) return { ok: false, error: 'Вбудовану країну видалити не можна.' }
  const n = await vacanciesIn(code)
  if (n) return { ok: false, error: `У цій країні ${n} вакансій (разом із вимкненими). Спершу перенесіть або видаліть їх.` }
  await sql`update settings set data = ${JSON.stringify(extra.filter((c) => c.code !== code))}, updated_at = now() where key = 'countries'`
  updateTag(COUNTRIES_TAG)
  revalidatePath('/', 'layout')
  return { ok: true }
}
