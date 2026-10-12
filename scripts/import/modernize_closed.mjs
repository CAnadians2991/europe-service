// Old Tilda vacancies (data/vacancies.closed.json, 2021–2025) brought up to date and put back on the site
// (owner, 2026-10-09: «no switched-off vacancies — all of them must work, they bring calls and requests;
// change their rates to today's, fit conditions and descriptions to the template»).
//
// 1. Pay: every figure × the growth of the country's statutory minimum wage since the year of the post
//    (2021 Poland: 18,30 → 31,40 zł/h = ×1,72), but an old rate is lifted at most to about the median rate of today's
//    open vacancies of the country — ±8 % by the post's rank among the posts of its year, so the better-paid jobs stay
//    better paid (many Tilda posts had their rates updated later — those stay as they are) — and never below the
//    legal minimum. UAH and $ equivalents are recounted at today's rates. Housing costs grow
//    with the same factor (max ×1,6). Fees and other costs stay as they were.
// 2. Text: section headings to the template («Заробітна плата», «Графік роботи», «Обовʼязки», «Вимоги»,
//    «Проживання», «Додаткові умови», «Місце роботи»; Russian posts — Russian titles), same-titled sections merged,
//    template order. Dropped: «Найближчі заїзди», «Кратко о главном», items with past dates, age/gender limits
//    outside the pay rules (the site states no such restrictions).
// 3. Catalog: of each employer + city the newest Ukrainian post is switched on (order after today's vacancies);
//    duplicates, Russian twins and employers already open today stay off the catalog — their pages work all the same.
//    `revived` marks them: no JobPosting for these (Google Jobs).
// 4. Category for the 300+ «other» posts from the title.
//
// Idempotent (salary.modern marks a done post). The originals are in git history; salary.source keeps the Tilda text.
// Run: node scripts/import/modernize_closed.mjs [--dry]   then   node --env-file=.env.local scripts/seed-db.mjs --refresh
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')
const CLOSED = path.join(ROOT, 'data/vacancies.closed.json')
const ACTIVE = path.join(ROOT, 'src/data/vacancies.seed.json')
const DRY = process.argv.includes('--dry')
const TODAY = '2026-10-09'

// statutory minimum (hourly gross; monthly for ro/lt/sk/gr/lv), yearly average where it changed mid-year
const MIN = {
  pl: { 2021: 18.3, 2022: 19.7, 2023: 23.15, 2024: 27.9, 2025: 30.5, 2026: 31.4 },
  cz: { 2021: 90.5, 2022: 96.4, 2023: 103.8, 2024: 112.5, 2025: 124.4, 2026: 134.4 },
  de: { 2021: 9.55, 2022: 10.5, 2023: 12.0, 2024: 12.41, 2025: 12.82, 2026: 13.9 },
  nl: { 2021: 9.72, 2022: 10.05, 2023: 11.4, 2024: 13.5, 2025: 14.2, 2026: 14.71 },
  fr: { 2021: 10.25, 2022: 10.85, 2023: 11.4, 2024: 11.65, 2025: 11.88, 2026: 12.02 },
  ca: { 2021: 14.25, 2022: 15.0, 2023: 16.0, 2024: 16.8, 2025: 17.4, 2026: 17.75 },
  ro: { 2021: 2300, 2022: 2550, 2023: 3075, 2024: 3500, 2025: 4050, 2026: 4050 },
  lt: { 2021: 642, 2022: 730, 2023: 840, 2024: 924, 2025: 1038, 2026: 1153 },
  sk: { 2021: 623, 2022: 646, 2023: 700, 2024: 750, 2025: 816, 2026: 915 },
  gr: { 2021: 650, 2022: 713, 2023: 780, 2024: 830, 2025: 880, 2026: 920 },
  lv: { 2021: 500, 2022: 500, 2023: 620, 2024: 700, 2025: 740, 2026: 780 },
}
// legal floors for the published (already +19 %) figures
const FLOOR = {
  pl: { cur: 'PLN', net: { h: 22.5, m: 3600 }, gross: { h: 31.4, m: 4806 } },
  de: { cur: 'EUR', gross: { h: 13.9 } },
  nl: { cur: 'EUR', gross: { h: 14.71 } },
  cz: { cur: 'CZK', gross: { h: 134.4 } },
}
// UAH and USD per unit, the same rates as today's vacancy texts (59 500 грн ≈ 5 360 zł)
const FX = {
  PLN: { UAH: 11.58, USD: 0.276 },
  EUR: { UAH: 48.5, USD: 1.157 },
  CZK: { UAH: 2.05, USD: 0.0486 },
  RON: { UAH: 9.75, USD: 0.232 },
  GBP: { UAH: 55.6, USD: 1.33 },
  USD: { UAH: 41.9, USD: 1 },
}

const growth = (c, y) => {
  const t = MIN[c] ?? MIN.pl
  const yy = Math.min(2026, Math.max(2021, y))
  return t[2026] / t[yy]
}

// ── money in text (port of apply_rate_uplift.py) ──
const NUM = String.raw`\d{1,3}(?:[  ]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?`
const CURS = {
  PLN: String.raw`zł|zl(?![a-z])|зл\.?|злот\p{L}*|PLN|pln`,
  EUR: String.raw`€|євро|евро|EUR|eur(?![a-z])`,
  CZK: String.raw`Kč|kč|крон\p{L}*|корон\p{L}*|CZK`,
  UAH: String.raw`грн\.?|UAH|гривен\p{L}*|гривн\p{L}*`,
  USD: String.raw`\$|USD|долар\p{L}*|доллар\p{L}*`,
  GBP: String.raw`£|фунт\p{L}*|GBP`,
  RON: String.raw`лей|леї|lei|RON`,
}
const CUR = Object.values(CURS).join('|')
const MONEY = new RegExp(String.raw`(?<pre>(?:€|\$|£)\s?)?(?<a>${NUM})(?:(?<dash>\s*[-–—]\s*)(?<b>${NUM}))?(?<post>\s*(?:${CUR}))?`, 'gu')
const curOf = (s) => {
  for (const [k, re] of Object.entries(CURS)) if (new RegExp(`^\\s*(?:${re})\\s*$`, 'u').test(s)) return k
  return null
}
const toFloat = (s) => parseFloat(s.replace(/[  ]/g, '').replace(',', '.'))
function fmt(orig, value, bigRound) {
  const th = orig.match(/\d([  ])\d{3}/)?.[1] ?? ''
  const dec = orig.replace(/[  ]/g, '').match(/[.,](\d+)$/)
  if (dec) return value.toFixed(Math.max(2, dec[1].length)).replace('.', orig.includes('.') ? '.' : ',')
  if (value >= 1000) {
    const v = Math.round(value / bigRound) * bigRound
    return th ? v.toLocaleString('en-US').replace(/,/g, th) : String(v)
  }
  if (value >= 100) return String(Math.round(value / 5) * 5)
  return value.toFixed(2).replace('.', ',')
}

/**
 * Scale the money of one line. `main` = the vacancy's currency (× k); UAH / USD equivalents (when main is another
 * currency) are recounted from the line's first main-currency amount; other currencies × k.
 */
function scaleLine(text, k, main) {
  const ms = [...text.matchAll(MONEY)].filter((m) => m.groups.pre || m.groups.post)
  if (!ms.length) return text
  const cur = (m) => curOf((m.groups.post || m.groups.pre || '').trim())
  const first = ms.find((m) => cur(m) === main)
  const base = first && { a: toFloat(first.groups.a) * k, b: first.groups.b ? toFloat(first.groups.b) * k : null }
  let out = ''
  let last = 0
  for (const m of ms) {
    const c = cur(m)
    const big = c === 'UAH' ? 100 : 10
    let a, b
    if (base && c !== main && (c === 'UAH' || c === 'USD') && FX[main]) {
      const r = FX[main][c]
      a = base.a * r
      b = m.groups.b ? (base.b ?? base.a) * r : null
    } else {
      a = toFloat(m.groups.a) * k
      b = m.groups.b ? toFloat(m.groups.b) * k : null
    }
    let s = (m.groups.pre || '') + fmt(m.groups.a, a, big)
    if (m.groups.b) s += m.groups.dash + fmt(m.groups.b, b, big)
    s += m.groups.post || ''
    out += text.slice(last, m.index) + s
    last = m.index + m[0].length
  }
  return out + text.slice(last)
}

// ── headings → the template ──
const T = {
  uk: { pay: 'Заробітна плата', sched: 'Графік роботи', duty: 'Обовʼязки', req: 'Вимоги', house: 'Проживання', extra: 'Додаткові умови', place: 'Місце роботи' },
  ru: { pay: 'Заработная плата', sched: 'График работы', duty: 'Обязанности', req: 'Требования', house: 'Проживание', extra: 'Дополнительные условия', place: 'Место работы' },
}
const ORDER = ['^', 'pay', 'sched', 'duty', 'req', '*', 'house', 'extra', 'reviews', 'place']
const HEAD = [
  ['drop', /^(найближчі|ближайшие) заїзд|^ближайшие заезд|^кратко о главном/],
  ['pay', /^(заробітн\p{L}* плат\p{L}*|заработн\p{L}* плат\p{L}*|зарплат\p{L}*|оплата( праці| труда)?|ставк\p{L}*)$/u],
  ['sched', /^(графік\p{L}*( роботи)?|робочий графік|режим роботи|график\p{L}*( работы)?|рабочий график|часов в месяц)$/u],
  ['duty', /^(основні )?обов.?язки$|^обязанности(\/требования)?$/u],
  ['req', /^(вимоги( до кандидат\p{L}*)?|требования( к кандидат\p{L}*)?|какие требования к сотрудникам\??)$/u],
  ['house', /^(проживання|житло|доїзд до роботи|проживание|жиль[её])$/u],
  ['extra', /^(додатков\p{L}* (умови|інформація)|тип договору|договір|дополнительн\p{L}* (условия|информация|мнформация)|бонусы и премии|договор|условия работы)$/u],
  ['reviews', /^(відгуки|отзывы)( про роботу| о работе)?$/u],
  ['place', /^(місце|місто) роботи$|^место работы$/u],
]
const cleanHead = (t) =>
  t
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[:\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
const headKey = (t) => {
  const s = cleanHead(t).toLowerCase().replace(/ʼ|’|'/g, 'ʼ')
  for (const [k, re] of HEAD) if (re.test(s.replace(/ʼ/g, "'")) || re.test(s)) return k
  return null
}

// ── items ──
const PAST_DATE = /\b\d{1,2}\.\d{1,2}\.(?:20)?(?:19|2[0-5])\b|24\.02\.2022/
const AGE_GENDER =
  /(віком|вік|возраст\p{L}*)\s*(до|від|от)\s*\d|^\s*(від|от)\s*\d{2}\s*до\s*\d{2}\s*(років|лет)\s*\.?$|^\s*до\s*\d{2}\s*(років|лет)\s*\.?$|(тільки|лише|только)\s+(для\s+)?(чолов|жін|муж|жен)/iu
const PAY_ITEM = /ставк|зарплат|заробіт|заработ|нетто|брутто|netto|brutto|\/\s*(год|час|h)\b|на руки|аванс|прем|бонус|доплат/iu

function cleanPayItem(t, lang) {
  return t
    .replace(/\s*[-–—]?\s*нова ставка від \d{1,2}\.\d{1,2}\.\d{4}\s*/giu, ' ')
    .replace(/\s*\(з \d{1,2}\.\d{1,2}\.\d{4}[^)]*\)/giu, '')
    .replace(/^з \d{1,2} \p{L}+ 20\d\d року ставка становитиме/iu, 'Ставка')
    .replace(/(у|в) 20(?:1\d|2[0-5]) році/giu, lang === 'ru' ? 'в этом году' : 'цього року')
    .replace(/в 20(?:1\d|2[0-5]) году/giu, 'в этом году')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ── category for «other» ──
const CAT = [
  ['auto', /авто(мобіл|мобил|завод|крісел|кресел)|automotive|lear\b|borgwarner|valmet|aptiv|delph|motherson|tenneco|valeo|forvia|faurecia/iu],
  ['horeca', /готел|отел|ресторан|кухар|повар|офіціант|официант|покоїв|горнич|бармен|піцайол|кондитер у|hotel/iu],
  ['food', /харч|пищев|м.?яс|мяс|птах|птиц|курят|куриц|індич|индей|риб|рыб|лосос|кондитер|шоколад|цукер|конфет|печив|пряник|пончик|хліб|хлеб|пекар|овоч|фрукт|ягід|ягод|ковбас|колбас|молоч|сир\b|сыр|снек|сус|соус|телятин|банан|закрут|напо|сік|сок\b|морожен|кава\b|кофе/iu],
  ['warehouse', /склад|комплектуваль|комплектовщ|логіст|логист|сортуваль|сортиров|пакуваль|упаковщ|пакуван|упаковк|магазин.*інтернет|посилок|посылок|вантаж|погруз/iu],
  ['construction', /будів|строит|муляр|каменщ|плиточ|електрик|электрик|сантехн|штукатур|маляр|бетон|монтажник|покрівел|кровел|опалуб|арматур|оптич/iu],
  ['agro', /ферм|теплиц|збир|сбор|сільськ|сельск|тюльпан|квіт|цвет|грибн|розплідн/iu],
  ['driver', /водій|водител|кур.?єр|курьер|таксі|такси|\bCE\b/iu],
  ['cleaning', /прибиран|уборк|клінінг|клининг|мийник|мойщ/iu],
  ['retail', /супермаркет|касир|продав|магазин/iu],
  ['care', /догляд|сиделк|уход за/iu],
  ['factory', /завод|фабрик|виробн|производ|продукц|оператор|зварю|сварщ|слюсар|слесар|токар|ливар|литей|монтер|збір|сбор|складальн|сборщ|швач|швеї|швея|шліфув|деревин|меблі|мебел|фанер|піддон|поддон|скло|стекл|кераміч|посуд|пінополі|свічок|свечей|косметик|електрон|электрон|друкар|типограф/iu],
]
const guessCategory = (v) => {
  const s = `${v.title} ${v.company}`
  for (const [c, re] of CAT) if (re.test(s)) return c
  return null
}

// ── run ──
const closed = JSON.parse(fs.readFileSync(CLOSED, 'utf8'))
const active = JSON.parse(fs.readFileSync(ACTIVE, 'utf8'))

// today's typical published hourly / monthly rate per country + currency + net (median, ≥ 5 vacancies)
const median = (xs) => {
  const a = xs.filter((x) => x > 0).sort((x, y) => x - y)
  return a.length >= 5 ? a[Math.floor(a.length / 2)] : null
}
const capKey = (v) => `${v.country}|${v.salary.currency}|${v.salary.net ? 'net' : 'gross'}`
const caps = {}
for (const v of active) {
  const c = (caps[capKey(v)] ??= { h: [], m: [] })
  if (v.salary.hourMin ?? v.salary.hourMax) c.h.push(v.salary.hourMin ?? v.salary.hourMax)
  if (v.salary.monthMin ?? v.salary.monthMax) c.m.push(v.salary.monthMin ?? v.salary.monthMax)
}
for (const k of Object.keys(caps)) caps[k] = { h: median(caps[k].h), m: median(caps[k].m) }

// rank of an old rate among the posts of the same country + currency + net + year (0 = lowest, 1 = highest)
const rankOf = (() => {
  const by = {}
  const yk = (v) => `${capKey(v)}|${(v.createdAt || '2022').slice(0, 4)}`
  for (const v of closed) {
    const b = (by[yk(v)] ??= { h: [], m: [] })
    if (v.salary.hourMin) b.h.push(v.salary.hourMin)
    if (v.salary.monthMin) b.m.push(v.salary.monthMin)
  }
  for (const b of Object.values(by)) for (const a of [b.h, b.m]) a.sort((x, y) => x - y)
  return (v, x, unit) => {
    const a = by[yk(v)]?.[unit] ?? []
    return a.length > 1 ? a.findIndex((y) => y >= x) / (a.length - 1) : 0.5
  }
})()

const stats = { done: 0, skipped: 0, dates: 0, ageGender: 0, dropSec: 0, recat: 0, on: 0, k: [] }
const examples = []

for (const v of closed) {
  if (v.salary?.modern) {
    stats.skipped++
    continue
  }
  const lang = v.lang === 'ru' ? 'ru' : 'uk'
  const year = Number((v.createdAt || '2022').slice(0, 4))
  const s = v.salary
  const main = s.currency || 'PLN'
  // «18,24 zl/міс» — an hourly rate typed as monthly on Tilda
  if (s.hourMin == null && s.monthMin != null && s.monthMin > 0 && s.monthMin < 100) {
    ;[s.hourMin, s.hourMax, s.monthMin, s.monthMax] = [s.monthMin, s.monthMax ?? s.monthMin, null, null]
  }
  let k = growth(v.country, year)
  // an old rate is lifted at most to today's median of the country; never below the legal minimum
  const cap = caps[capKey(v)]
  const h = (s.hourMin ?? s.hourMax) || null
  const m = (s.monthMin ?? s.monthMax) || null
  const spread = (x, unit) => 0.92 + 0.16 * rankOf(v, x, unit)
  if (cap?.h && h) k = Math.min(k, Math.max(1, (cap.h * spread(h, 'h')) / h))
  else if (cap?.m && m) k = Math.min(k, Math.max(1, (cap.m * spread(m, 'm')) / m))
  // floors only in the country's own currency; a piece rate («3,5 зл за кг») is not an hourly one, and a monthly
  // figure next to an hourly rate is usually a bonus («премія до 800 zł») — no floor from those
  const fl = FLOOR[v.country]?.cur === main ? FLOOR[v.country][s.net ? 'net' : 'gross'] : null
  const piece = /кг|\bшт|штук|одиниц|piece/iu.test(`${s.source} ${s.text}`)
  if (fl?.h && h >= 3 && !piece && h * k < fl.h) k = fl.h / h
  if (fl?.m && !h && m >= 500 && m * k < fl.m) k = Math.max(k, fl.m / m)
  k = Math.round(k * 1000) / 1000
  const kh = Math.min(k, 1.6)
  stats.k.push(k)

  const before = DRY && examples.length < 6 && v.country === 'pl' ? JSON.stringify({ s: s.text, pay: v.sections.find((x) => headKey(x.title) === 'pay')?.items.slice(0, 3), housing: v.housing }) : null

  s.text = scaleLine(s.text || '', k, main)
  for (const f of ['hourMin', 'hourMax']) if (s[f] != null) s[f] = Math.round(s[f] * k * 100) / 100
  for (const f of ['monthMin', 'monthMax']) if (s[f] != null) s[f] = Math.round((s[f] * k) / 10) * 10
  s.modern = { year, factor: k, at: TODAY }
  if (v.housing && !v.housingFree) v.housing = scaleLine(v.housing, kh, main)

  // sections → template
  const groups = new Map()
  let seenKnown = false
  for (const sec of v.sections || []) {
    const key = headKey(sec.title)
    if (key && key !== 'drop') seenKnown = true
    if (key === 'drop') {
      stats.dropSec++
      continue
    }
    const id = key ?? `*${cleanHead(sec.title)}`
    const title = key ? T[lang][key] ?? cleanHead(sec.title) : cleanHead(sec.title)
    const g = groups.get(id) ?? { key: key ?? (seenKnown ? '*' : '^'), title, items: [] }
    for (let it of sec.items) {
      const pay = key === 'pay' || PAY_ITEM.test(it)
      if (pay) it = cleanPayItem(it, lang)
      if (PAST_DATE.test(it)) {
        stats.dates++
        continue
      }
      if (!pay && AGE_GENDER.test(it)) {
        stats.ageGender++
        continue
      }
      if (pay) it = scaleLine(it, k, main)
      else if (key === 'house') it = scaleLine(it, kh, main)
      if (it) g.items.push(it)
    }
    groups.set(id, g)
  }
  v.sections = [...groups.values()]
    .filter((g) => g.items.length)
    .map((g, i) => ({ g, i }))
    .sort((a, b) => ORDER.indexOf(a.g.key) - ORDER.indexOf(b.g.key) || a.i - b.i)
    .map(({ g }) => ({ title: g.title, items: g.items }))

  if (v.category === 'other') {
    const c = guessCategory(v)
    if (c) {
      v.category = c
      stats.recat++
    }
  }
  // updatedAt stays: the catalog's «newest first» must not put the 2021 posts on top
  stats.done++
  if (k > 1.9) console.log('k>2.2', v.id, v.country, year, s.source, '→', s.text, k)
  if (before) examples.push({ id: v.id, title: v.title, year, k, before: JSON.parse(before), after: { s: s.text, pay: v.sections.find((x) => x.title === T.uk.pay)?.items.slice(0, 3), housing: v.housing } })
}

// ── catalog: the newest Ukrainian post per employer + city, unless that employer is open today ──
const norm = (x) =>
  (x || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-zа-яіїєґё0-9]/g, '')
const cityKey = (v) => norm((v.city || '').split(/[,(]/)[0]).slice(0, 12)
const key = (v) => `${v.country}|${(norm(v.company) || norm(v.title)).slice(0, 20)}|${cityKey(v)}`
const openToday = new Set(active.map(key))
if (!closed.some((v) => v.revived)) {
  const groups = new Map()
  for (const v of closed) {
    if (v.lang === 'ru' || openToday.has(key(v))) continue
    const g = groups.get(key(v))
    if (!g || (v.createdAt || '') > (g.createdAt || '')) groups.set(key(v), v)
  }
  const on = [...groups.values()].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  on.forEach((v, i) => {
    v.active = true
    v.hot = false
    v.order = 1000 + i
    v.revived = TODAY
  })
  stats.on = on.length
}

// Russian pages list Russian texts (owner: no Ukrainian on the RU site): the newest Russian Tilda post per employer + city
// is switched on too — the catalog shows lang 'ru' posts on the RU pages only, the Ukrainian ones on the UA pages
if (!closed.some((v) => v.revived && v.lang === 'ru')) {
  const groups = new Map()
  for (const v of closed) {
    if (v.lang !== 'ru' || openToday.has(key(v))) continue
    const g = groups.get(key(v))
    if (!g || (v.createdAt || '') > (g.createdAt || '')) groups.set(key(v), v)
  }
  const base = 1000 + closed.filter((v) => v.revived).length
  ;[...groups.values()]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .forEach((v, i) => {
      v.active = true
      v.hot = false
      v.order = base + i
      v.revived = TODAY
    })
  stats.onRu = groups.size
}

// a revived post with the very title of one of today's vacancies is an older copy of that job: off the catalog
// (its page keeps working) — no two catalog cards and <title>s for one vacancy
const openTitle = new Set(active.filter((v) => v.active).flatMap((v) => [`${v.country}|${norm(v.title)}`, `${v.country}|${norm(v.ru?.title)}`]))
stats.offDup = 0
for (const v of closed)
  if (v.revived && v.active && openTitle.has(`${v.country}|${norm(v.title)}`)) {
    v.active = false
    stats.offDup++
  }

const ks = stats.k.sort((a, b) => a - b)
console.log({ ...stats, k: { min: ks[0], med: ks[Math.floor(ks.length / 2)], max: ks.at(-1) } })
if (DRY) console.log(JSON.stringify(examples, null, 1))
else fs.writeFileSync(CLOSED, JSON.stringify(closed, null, 1) + '\n')
