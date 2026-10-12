import 'server-only'
import https from 'node:https'
import { hasDb, sql } from './db'
import { SITE } from './site'
import type { Lead } from './types'

export async function saveLead(l: Lead) {
  if (!hasDb) {
    console.warn('[lead] no database — lead only logged', l)
    return
  }
  await sql`
    insert into leads (id, created_at, name, phone, form, vacancy_id, vacancy_title, answers, page, referrer, utm, gclid, gbraid, wbraid, fbclid, status)
    values (${l.id}, ${l.createdAt}, ${l.name}, ${l.phone}, ${l.form}, ${l.vacancyId ?? null}, ${l.vacancyTitle ?? null},
            ${JSON.stringify(l.answers ?? {})}, ${l.page}, ${l.referrer ?? null}, ${JSON.stringify(l.utm ?? {})},
            ${l.gclid ?? null}, ${l.gbraid ?? null}, ${l.wbraid ?? null}, ${l.fbclid ?? null}, 'new')`
}

/** Same phone for the same vacancy (or the same general form) within 10 minutes → a repeat submit (no second notification).
 *  Another vacancy from the same person is a new lead: the manager must see both — unless it comes within 2 minutes:
 *  one person firing forms at several vacancies in a row (seen on mcpwork.org, 2026-10-09) is one lead, not ten. */
export async function recentDuplicate(phone: string, vacancyId: string | null): Promise<string | null> {
  if (!hasDb) return null
  const rows = (await sql`select id from leads where phone = ${phone}
      and (created_at > now() - interval '2 minutes' or (vacancy_id is not distinct from ${vacancyId} and created_at > now() - interval '10 minutes'))
      order by created_at desc limit 1`) as { id: string }[]
  return rows[0]?.id ?? null
}

const FORM_LABEL: Record<string, string> = {
  vacancy: 'Заявка на вакансію',
  'vacancy-bar': 'Заявка на вакансію (моб. кнопка)',
  'vacancy-card': 'Швидка заявка з каталогу',
  'vacancy-top': 'Заявка на вакансію (верх сторінки)',
  'vacancy-top-ru': 'Заявка на вакансію (верх сторінки, RU)',
  'vacancy-bottom': 'Заявка на вакансію (після опису)',
  'vacancy-bottom-ru': 'Заявка на вакансію (після опису, RU)',
  'home-hero': 'Головна — герой',
  'home-consult': 'Головна — консультація',
  'home-bottom': 'Головна — низ сторінки',
  header: 'Кнопка в шапці',
  'mobile-menu': 'Мобільне меню',
  'mobile-bar': 'Мобільна кнопка',
  catalog: 'Каталог',
  review: '⭐ Відгук на модерацію',
  'home-callback': 'Головна — «передзвоніть мені»',
  anketa: 'Анкета реєстрації',
  razemwork: 'Razem Work',
}

function formLabel(f: string) {
  if (FORM_LABEL[f]) return FORM_LABEL[f]
  if (f.startsWith('quiz:')) return `Квіз-підбір (${f.slice(5)})`
  if (f.startsWith('country-')) return `Сторінка країни (${f.slice(8)})`
  return f
}

function esc(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)
}

async function toTelegram(l: Lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chats = (process.env.TELEGRAM_CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!token || !chats.length) return 'skip'
  const src = leadSource(l)
  const heat = l.answers?.['Оцінка ліда']
  const lines = [
    `${heat ? esc(heat) + ' · ' : '🟢 '}<b>Нова заявка</b> — ${esc(formLabel(l.form))}`,
    `👤 ${esc(l.name || '—')}`,
    `📞 <a href="tel:${l.phone}">${l.phone}</a>`,
    l.vacancyTitle ? `💼 ${esc(l.vacancyTitle)}` : '',
    ...Object.entries(l.answers ?? {})
      .filter(([k]) => k !== 'Оцінка ліда')
      .map(([k, v]) => `• ${esc(k)}: ${esc(String(v))}`),
    `🌐 ${esc(SITE.url + l.page)}`,
    `📈 Джерело: ${esc(String(src))}${l.utm?.utm_campaign ? ` / ${esc(l.utm.utm_campaign)}` : ''}`,
  ].filter(Boolean)
  const results = await Promise.all(
    chats.map((chat_id) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }),
        signal: AbortSignal.timeout(8000),
      }).then((r) => r.ok),
    ),
  )
  return results.every(Boolean) ? 'ok' : 'error'
}

/**
 * /razemwork leads (typed in by Razem Work's admin) — as the Tilda form delivered them, so Bitrix counts them the same way:
 * source «Razem Work», «Tilda Source» = the form's «Джерело» field, source description without https://.
 * Checked on the Tilda leads of 20.07–14.09.2026: the 62 with «Tilda Source» = Razem Work had this source.
 */
function razemWorkFields(l: Lead) {
  return {
    SOURCE_ID: process.env.BITRIX_RAZEMWORK_SOURCE_ID || 'UC_HMFMTY', // «Razem Work»
    SOURCE_DESCRIPTION: 'europeservice.com.ua/razemwork',
    UF_CRM_1785432390576: l.answers?.['Джерело'] || 'Razem Work', // «Tilda Source»
  }
}

/**
 * The company's Bitrix server (europeservice.org.ua) answers HTTPS with Bitrix's default self-signed certificate, so a
 * plain fetch refuses it. For that host only the certificate is not checked (mcpwork.org does the same); the traffic
 * stays encrypted. Every other address goes through fetch as usual.
 */
const SELF_SIGNED = /(^|\.)europeservice\.org\.ua$/
async function postJson(url: string, body: unknown): Promise<boolean> {
  const u = new URL(url)
  const data = JSON.stringify(body)
  if (!SELF_SIGNED.test(u.hostname)) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: data, signal: AbortSignal.timeout(8000) })
    return r.ok
  }
  return new Promise((resolve) => {
    const req = https.request(
      u,
      { method: 'POST', rejectUnauthorized: false, timeout: 8000, headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } },
      (res) => {
        res.resume()
        resolve((res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300)
      },
    )
    req.on('timeout', () => req.destroy())
    req.on('error', () => resolve(false))
    req.end(data)
  })
}

async function toBitrix(l: Lead) {
  const hook = process.env.BITRIX_WEBHOOK_URL // e.g. https://xxx.bitrix24.ua/rest/1/abc123/
  if (!hook) return 'skip'
  const fields: Record<string, unknown> = {
    TITLE: `ES: ${l.name || l.phone} — ${formLabel(l.form)}${l.vacancyTitle ? `: ${l.vacancyTitle}` : ''}`,
    NAME: l.name || undefined,
    PHONE: [{ VALUE: l.phone, VALUE_TYPE: 'MOBILE' }],
    SOURCE_ID: process.env.BITRIX_SOURCE_ID || 'WEB',
    SOURCE_DESCRIPTION: SITE.url + l.page,
    COMMENTS: [
      `Сайт Europe Service — ${formLabel(l.form)}`,
      `Сторінка: ${SITE.url + l.page}`,
      l.vacancyTitle && `Вакансія: ${l.vacancyTitle}`,
      ...Object.entries(l.answers ?? {}).map(([k, v]) => `${k}: ${v}`),
      l.gclid && `gclid: ${l.gclid}`,
    ].filter(Boolean).join('<br>'),
    UTM_SOURCE: l.utm?.utm_source,
    UTM_MEDIUM: l.utm?.utm_medium,
    UTM_CAMPAIGN: l.utm?.utm_campaign,
    UTM_TERM: l.utm?.utm_term,
    UTM_CONTENT: l.utm?.utm_content,
  }
  if (l.form === 'razemwork') Object.assign(fields, razemWorkFields(l))
  if (process.env.BITRIX_ASSIGNED_BY_ID) fields.ASSIGNED_BY_ID = Number(process.env.BITRIX_ASSIGNED_BY_ID)
  // «Цікавить: вакансія, місто» — a custom lead field, e.g. UF_CRM_1650000000000
  const interest = process.env.BITRIX_INTEREST_FIELD
  if (interest && l.vacancyTitle) fields[interest] = l.vacancyTitle
  // the same custom field the old Tilda integration filled
  fields.UF_CRM_FORMNAME = `ES: ${formLabel(l.form)}`
  const ok = await postJson(hook.replace(/\/?$/, '/') + 'crm.lead.add.json', { fields, params: { REGISTER_SONET_EVENT: 'Y' } })
  return ok ? 'ok' : 'error'
}

/**
 * Bitrix24 via a Tilda-style webhook script (e.g. europeservice.org.ua/local/os_tilda/index.php — set TILDA_WEBHOOK_URL): same JSON shape
 * Tilda's webhook sent (field names name/phone, formid, formname, tranid, COOKIES with TILDAUTM, utm_*), so leads reach
 * Bitrix exactly as before and nothing has to change on the Bitrix side.
 */
async function toTildaHook(l: Lead) {
  const url = process.env.TILDA_WEBHOOK_URL
  // the REST webhook (toBitrix) replaces this route once it is set — never both, or Bitrix gets every lead twice
  if (!url || process.env.BITRIX_WEBHOOK_URL) return 'skip'
  const utm = Object.fromEntries(Object.entries(l.utm ?? {}).filter(([, v]) => v)) as Record<string, string>
  const tildaUtm = Object.entries(utm).map(([k, v]) => `${k}=${v}`).join('|||')
  const cookies = [
    tildaUtm && `TILDAUTM=${encodeURIComponent(tildaUtm)}`,
    l.gclid && `gclid=${l.gclid}`,
    l.fbclid && `_fbc=fb.1.${Date.parse(l.createdAt) || Date.now()}.${l.fbclid}`,
  ].filter(Boolean)
  const body: Record<string, string> = {
    name: l.name || '',
    phone: l.phone,
    ...(l.vacancyTitle ? { vacancy: l.vacancyTitle } : {}),
    ...Object.fromEntries(Object.entries(l.answers ?? {}).map(([k, v]) => [k, String(v)])),
    ...utm,
    ...(l.gclid ? { gclid: l.gclid } : {}),
    ...(l.fbclid ? { fbclid: l.fbclid } : {}),
    referer: SITE.url + l.page,
    formid: `es-${l.form.replace(/[^a-z0-9-]+/gi, '-')}`,
    formname: formLabel(l.form),
    tranid: `europeservice:${l.id}`,
    ...(cookies.length ? { COOKIES: cookies.join('; ') } : {}),
  }
  return (await postJson(url, body)) ? 'ok' : 'error'
}

/** Where the lead came from, in words (for the backup channels) */
function leadSource(l: Lead) {
  if (l.form === 'razemwork') return l.answers?.['Джерело'] || 'Razem Work'
  return l.gclid || l.gbraid || l.wbraid ? 'Google Ads' : l.fbclid ? 'Facebook/Instagram' : l.utm?.utm_source || (l.referrer ? safeHost(l.referrer) : 'прямий захід')
}
function safeHost(u: string) {
  try {
    return new URL(u).hostname
  } catch {
    return u
  }
}
const kyivTime = (iso: string) => new Date(iso).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv', dateStyle: 'short', timeStyle: 'short' })

/**
 * Backup copy of every lead, e.g. a Google Sheet (Apps Script web app, see docs/LEADS-BACKUP.md), Make or Zapier.
 * Flat, row-friendly fields plus the raw lead.
 */
async function toWebhook(l: Lead, inBitrix: boolean) {
  const url = process.env.LEAD_WEBHOOK_URL
  if (!url) return 'skip'
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      // tab of the shared «Заявки … (резерв)» sheet (the same Apps Script serves several sites)
      sheet: process.env.LEAD_SHEET || 'europeservice.com.ua',
      date: kyivTime(l.createdAt),
      name: l.name,
      phone: l.phone,
      form: formLabel(l.form),
      vacancy: l.vacancyTitle ?? '',
      page: SITE.url + l.page,
      source: leadSource(l),
      campaign: l.utm?.utm_campaign ?? '',
      answers: Object.entries(l.answers ?? {}).map(([k, v]) => `${k}: ${v}`).join('; '),
      bitrix: inBitrix ? 'так' : 'НІ',
      id: l.id,
      lead: { ...l, formLabel: formLabel(l.form), site: SITE.url },
    }),
    signal: AbortSignal.timeout(8000),
    redirect: 'follow',
  }).catch((e) => {
    // Apps Script often answers after 8 s but still writes the row — a slow answer is not a lost backup
    if (e instanceof Error && e.name === 'TimeoutError') return 'timeout' as const
    throw e
  })
  if (r === 'timeout') return 'timeout'
  return r.ok ? 'ok' : 'error'
}

/** Instant message in a Discord channel (Server settings → Integrations → Webhooks). ⚠️ when Bitrix did not take it. */
async function toDiscord(l: Lead, inBitrix: boolean) {
  const url = process.env.DISCORD_WEBHOOK_URL
  if (!url) return 'skip'
  const answers = Object.entries(l.answers ?? {}).map(([k, v]) => `${k}: ${v}`)
  const lines = [
    `📞 **${l.phone}**${l.name ? ` — ${l.name}` : ''}`,
    `📝 ${formLabel(l.form)}${l.vacancyTitle ? `: ${l.vacancyTitle}` : ''}`,
    ...answers.map((a) => `• ${a}`),
    `🌐 ${SITE.url + l.page}`,
    `📈 ${leadSource(l)}${l.utm?.utm_campaign ? ` / ${l.utm.utm_campaign}` : ''}`,
    inBitrix ? '✅ У Bitrix' : '⚠️ **НЕ дійшла в Bitrix** — внесіть вручну або натисніть «Повторити в Bitrix» в адмінці',
  ]
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'Europe Service — заявки', content: lines.join('\n').slice(0, 1900), allowed_mentions: { parse: [] } }),
    signal: AbortSignal.timeout(8000),
  })
  return r.ok ? 'ok' : 'error'
}

export async function deliverLead(l: Lead) {
  // Bitrix first, so the backup channels can say whether it got there
  const [telegram, bitrix, bitrixScript] = await Promise.all([
    toTelegram(l).catch(() => 'error'),
    toBitrix(l).catch(() => 'error'),
    toTildaHook(l).catch(() => 'error'),
  ])
  const inBitrix = bitrix === 'ok' || bitrixScript === 'ok'
  const [webhook, discord] = await Promise.all([toWebhook(l, inBitrix).catch(() => 'error'), toDiscord(l, inBitrix).catch(() => 'error')])
  const delivered = { telegram, bitrix, bitrix_script: bitrixScript, webhook, discord }
  if (hasDb) await sql`update leads set delivered = ${JSON.stringify(delivered)} where id = ${l.id}`.catch(() => {})
  return delivered
}

/** Admin «Повторити в Bitrix»: send a stored lead to Bitrix again (only Bitrix, nothing else is re-sent) */
export async function retryBitrix(id: string) {
  if (!hasDb) return null
  const rows = (await sql`select * from leads where id = ${id}`) as Record<string, unknown>[]
  const r = rows[0]
  if (!r) return null
  const l: Lead = {
    id: String(r.id),
    createdAt: new Date(r.created_at as string).toISOString(),
    name: String(r.name ?? ''),
    phone: String(r.phone),
    form: String(r.form ?? ''),
    vacancyId: (r.vacancy_id as string) ?? undefined,
    vacancyTitle: (r.vacancy_title as string) ?? undefined,
    answers: (r.answers as Record<string, string>) ?? {},
    page: String(r.page ?? '/'),
    referrer: (r.referrer as string) ?? undefined,
    utm: (r.utm as Record<string, string>) ?? {},
    gclid: (r.gclid as string) ?? undefined,
    status: 'new',
  }
  const [bitrix, bitrixScript] = await Promise.all([toBitrix(l).catch(() => 'error'), toTildaHook(l).catch(() => 'error')])
  const delivered = { ...((r.delivered as Record<string, string>) ?? {}), bitrix, bitrix_script: bitrixScript }
  await sql`update leads set delivered = ${JSON.stringify(delivered)} where id = ${id}`
  return delivered
}

export { formLabel }
