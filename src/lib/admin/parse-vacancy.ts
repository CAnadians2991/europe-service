/**
 * «Вставте текст вакансії» → the vacancy form. TypeScript port of scripts/import/extract_es_vacancies.py
 * (the format managers use on Tilda / Telegram / Viber: «КОРОТКО ПРО ОСНОВНЕ» with 💵 📈 🤝 🏠 📍 lines, then
 * «ЗАРОБІТНА ПЛАТА / ГРАФІК РОБОТИ / ОБОВʼЯЗКИ / ПРОЖИВАННЯ / ДОДАТКОВІ УМОВИ / МІСЦЕ РОБОТИ» with ◈ points),
 * plus looser texts: «Зарплата: …» lines, **bold** or CAPS headings, «- пункт» lists, HTML copied from Tilda.
 * Pure and dependency-light: runs in the browser on «Розпізнати».
 */
import { COUNTRIES } from '@/lib/site'
import { COUNTRY_PRESETS, type CountryPreset } from '@/lib/country-presets'
import type { Category, CountryCode, Currency, Review, Salary, Section, Vacancy, VacancyRu } from '@/lib/types'

export type ParsedField =
  | 'title' | 'company' | 'country' | 'city' | 'hubCity' | 'category' | 'salary' | 'schedule' | 'contract' | 'housing'
  | 'housingFree' | 'intro' | 'sections' | 'videos' | 'reviews' | 'housingNote' | 'noLanguage' | 'noExperience'

/** ok = taken from a line meant for it; guess = a heuristic, worth a look */
export type FieldStatus = { status: 'ok' | 'guess'; note?: string }

export interface ParsedVacancy {
  lang: 'uk' | 'ru'
  title: string
  company: string
  country: CountryCode | ''
  city: string
  hubCity: string
  category: Category | ''
  /** null — no pay found in the text */
  salary: Salary | null
  schedule: string
  contract: string
  housing: string
  housingFree: boolean
  intro: string
  sections: Section[]
  videos: string[]
  reviews: Review[]
  housingNote: string
  noLanguage: boolean
  noExperience: boolean
  how: Partial<Record<ParsedField, FieldStatus>>
  /** the text names a country the site doesn't have yet (one tap adds it from the presets) */
  newCountry?: CountryPreset
  /** lines nothing was taken from (shown to the manager as «не розпізнано») */
  leftovers: string[]
  warnings: string[]
}

/* ------------------------------------------------------------------ text helpers */

/** emoji, arrows, bullets and dashes in front of a line (⭐ stays: reviews start with a name and stars) */
const LEAD = /^[\s\u{1F000}-\u{1FAFF}\u2600-\u27BF\u2190-\u21FF\u2B00-\u2B4F\u2B51-\u2BFF\u25A0-\u25FF\u2300-\u23FF\uFE0F\u200D\u20E3\u2139\u203C\u2049\u2022\u2023\u2043\u2219\u00B7*\-–—>]+/u
/** a list point: never a heading (unless it repeats a known section name) */
const BULLET = /^\s*(?:[◈◇◆•●▪▫◦‣⁃∙·\-–—*✅✔☑➖➤►▶→▸○]|\u{1F539}|\u{1F538}|\u{1F53A}|\u{1F53B}|\d{1,2}[.)](?=\s))/u
const NOT_LETTER = '(?![\\p{L}])'

const bare = (s: string) => s.replace(LEAD, '').replace(/^\d{1,2}[.)]\s+(?=\p{L})/u, '').trim()
const fold = (s: string) => s.toLowerCase().replace(/[’ʼ`´']/g, "'").replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()
const cleanItem = (s: string) => bare(s).replace(/\*\*|__/g, '').replace(/\s+/g, ' ').replace(/;+$/, '').trim()
const hasCyr = (s: string) => /[а-яіїєґё]/i.test(s)

/** «ПАКУВАЛЬНИК НА СКЛАД AMAZON» → «Пакувальник на склад AMAZON» (Latin words — brands — keep their case) */
function sentenceCase(s: string) {
  const letters = s.replace(/[^\p{L}]/gu, '')
  if (!letters || letters !== letters.toUpperCase()) return s
  const out = s.replace(/\p{L}+/gu, (w) => (hasCyr(w) ? w.toLowerCase() : w))
  return out.replace(/\p{L}/u, (c) => c.toUpperCase())
}

function htmlToText(t: string) {
  return t
    .replace(/<iframe[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/iframe>/gi, '\n$1\n')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '\n')
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n**$1**\n')
    .replace(/<li[^>]*>/gi, '\n◈ ')
    .replace(/<br\s*\/?>|<\/p>|<p[^>]*>|<\/li>|<\/?(?:ul|ol|div)[^>]*>/gi, '\n')
    .split('\n')
    .map((l) => (/^\s*(?:[^<\p{L}\d]{0,4})<(strong|b)>[\s\S]*<\/\1>\s*:?\s*$/u.test(l) ? `**${l.replace(/<[^>]+>/g, '').trim()}**` : l))
    .join('\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
}

function toLines(input: string) {
  let t = input.replace(/\r\n?/g, '\n')
  if (/<(br|p|div|li|h[1-6]|strong)\b[^>]*>/i.test(t)) t = htmlToText(t)
  return t
    .replace(/[\u00A0\u2007\u2009\u202F]/g, ' ')
    .replace(/\u2800/g, ' ')
    .replace(/[\u200B\u200C\u2060\uFEFF]/g, '')
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
}

/* ------------------------------------------------------------------ sections */

type Kind =
  | 'summary' | 'salary' | 'schedule' | 'duties' | 'housing' | 'extra' | 'place' | 'requirements' | 'documents' | 'about'
  | 'photos' | 'housingPhotos' | 'video' | 'reviews' | 'section'

const SECTION_NAMES: [Kind, RegExp][] = [
  ['summary', /^(коротко( про .{0,20})?|основне|головне|основна інформація|кратко( об? .{0,20})?|основное|основная информация)$/],
  ['housingPhotos', /^фото (житла|проживання|жилья|проживания)$/],
  ['photos', /^(фото|фотографії|фотографии)( (з|с|із) (місця роботи|места работы|роботи|работы|виробництва|производства|заводу|завода|складу|склада))?$/],
  ['video', /^(відео|видео)( (з|с|із) [^:]{0,40})?$/],
  ['reviews', /^(відгуки|отзывы)( [^:]{0,40})?$/],
  ['salary', /^(заробітна плата|заробітня плата|зарплата|зарплатня|оплата( праці)?|заработная плата|оплата труда|ставка|ставки|зп|з\/п)$/],
  ['schedule', /^(графік( роботи)?|график( работы)?|режим роботи|режим работы|робочий час|рабочее время|години роботи|часы работы)$/],
  ['duties', /^(обов'язки( працівника)?|обязанности( работника)?|що потрібно робити|что нужно делать|опис роботи|описание работы|характер роботи|суть роботи|функціонал|функционал|чим займатись|чем заниматься|завдання|задачи)$/],
  ['housing', /^(проживання|житло|проживание|жилье)$/],
  ['extra', /^(додаткові умови|дополнительные условия|додатково|дополнительно|умови|условия|умови роботи|условия работы|ми пропонуємо|мы предлагаем|пропонуємо|предлагаем|переваги|преимущества|бонуси|бонусы)$/],
  ['place', /^(місце роботи|место работы|адреса( роботи)?|адрес( работы)?|локація|локация|де працювати|где работать)$/],
  ['requirements', /^(вимоги( до кандидата| до кандидатів| до працівника)?|требования( к кандидату| к кандидатам| к работнику)?|кого шукаємо|кого ищем|кандидат)$/],
  ['documents', /^(документи|документы|необхідні документи|необходимые документы|які документи потрібні)$/],
  ['about', /^(про компанію|о компании|про роботодавця|о работодателе|про підприємство|о предприятии|про вакансію|о вакансии)$/],
]

const CANONICAL: Partial<Record<Kind, { uk: string; ru: string; same?: RegExp }>> = {
  salary: { uk: 'Заробітна плата', ru: 'Заработная плата' },
  schedule: { uk: 'Графік роботи', ru: 'График работы' },
  duties: { uk: 'Обовʼязки', ru: 'Обязанности' },
  housing: { uk: 'Проживання', ru: 'Проживание' },
  extra: { uk: 'Додаткові умови', ru: 'Дополнительные условия', same: /^(додаткові умови|дополнительные условия|додатково|дополнительно)$/ },
  place: { uk: 'Місце роботи', ru: 'Место работы' },
  requirements: { uk: 'Вимоги', ru: 'Требования', same: /^(вимоги|требования)/ },
  documents: { uk: 'Документи', ru: 'Документы', same: /^(документи|документы)$/ },
}

/** the line opens a section: «💳 ЗАРОБІТНА ПЛАТА», «**Обов’язки**», «Проживання:», «Графік роботи» alone */
function headingOf(line: string): { name: string; kind: Kind } | null {
  const bold = line.match(/^\s*[^\p{L}\d*_]{0,6}(\*\*|__)(.+?)\1\s*:?\s*$/u)
  const raw = bold ? bold[2] : line
  const name = bare(raw).replace(/\*\*|__/g, '').replace(/[\s:.!]+$/, '').trim()
  if (!name || name.length > 70) return null
  const f = fold(name)
  const kind = SECTION_NAMES.find(([, re]) => re.test(f))?.[0]
  if (kind) return { name, kind }
  if (BULLET.test(line) && !bold) return null
  if (bold) return name.length <= 60 && !/\d{3,}/.test(name) ? { name, kind: 'section' } : null
  const letters = name.replace(/[^\p{L}]/gu, '')
  const caps = letters.length >= 5 && letters === letters.toUpperCase() && /[А-ЯІЇЄҐЁ]/.test(letters) && !/\d/.test(name) && name.length < 60
  return caps ? { name, kind: 'section' } : null
}

/* ------------------------------------------------------------------ summary lines */

type FieldKind = 'salary' | 'schedule' | 'contract' | 'housing' | 'place' | 'company' | 'country' | 'title'

const EMOJI_KIND: [FieldKind, RegExp][] = [
  ['salary', /^\s*(?:💵|💰|💶|💷|💴|💸|🤑|💲)/u],
  ['schedule', /^\s*(?:📈|⏰|⏱|⌚|🕐|🕑|🕒|🕓|🕔|🕕|🕖|🕗|🕘|🕙|🕚|🕛|🗓|📅|📆)/u],
  ['contract', /^\s*(?:🤝|📝|📄|📃|✍|📑)/u],
  ['housing', /^\s*(?:🏠|🏡|🛏|🏘|🏨|🛌)/u],
  ['place', /^\s*(?:📍|🌍|🌎|🌏|🗺|📌)/u],
]
/** «Ключ: значення» keys */
const KV_KEYS: [FieldKind, RegExp][] = [
  ['salary', /^(заробітна плата|заробітня плата|зарплата|зарплатня|з\/п|зп|оплата( праці)?|ставка|заработная плата|оплата труда|дохід|доход)$/],
  ['schedule', /^(графік( роботи)?|график( работы)?|режим( роботи| работы)?|години роботи|часы работы)$/],
  ['contract', /^(договір|договор|тип договору|вид договору|тип договора|вид договора|контракт|оформлення|оформление|працевлаштування|трудоустройство)$/],
  ['housing', /^(проживання|житло|проживание|жилье)$/],
  ['place', /^(місце роботи|место работы|місто|город|локація|локация|адреса|адрес|регіон|регион)$/],
  ['company', /^(компанія|компания|роботодавець|работодатель|фірма|фирма|підприємство|предприятие|бренд|клієнт)$/],
  ['country', /^(країна|страна)$/],
  ['title', /^(вакансія|вакансия|посада|должность|професія|профессия)$/],
]
/** summary lines without an emoji (in «КОРОТКО ПРО ОСНОВНЕ») */
const PREFIX_KIND: [FieldKind, RegExp][] = [
  ['salary', /^(заробітна плата|заробітня плата|зарплата|заработная плата|ставка)/],
  ['schedule', /^(робота по|работа по|графік|график|по \d)/],
  ['contract', /^(офіційне|официальное|umo|договір|договор|умова)/],
  ['housing', /^(проживання|житло|проживание|жилье)/],
  ['place', /^(м\.|місто|город|г\.)/],
]

function kvOf(line: string): { kind: FieldKind; value: string } | null {
  const m = bare(line).replace(/\*\*|__/g, '').match(/^([^:]{2,40}?)\s*:\s*(.+)$/)
  if (!m) return null
  const k = fold(m[1])
  const kind = KV_KEYS.find(([, re]) => re.test(k))?.[0]
  return kind ? { kind, value: m[2].replace(/[;.\s]+$/, '').trim() } : null
}

/* ------------------------------------------------------------------ countries, cities */

/** country names (not adjectives: «англійська мова», «польська фірма» say nothing about the place) */
const NAME_HINTS: Record<string, string> = {
  pl: 'Польщ|Польш[аеиу]|Poland|Polsk[aię]',
  cz: 'Чехі|Чехи[яиюей]|Чеськ\\S* Республік|Czech|Česk[oá]',
  de: 'Німеччин|Германи|Germany|Deutschland',
  nl: 'Нідерланд|Нидерланд|Голланді|Голланди|Netherlands|Nederland|Holland',
  lt: 'Литв|Litw|Lithuani|Lietuv',
  lv: 'Латві|Латви|Latvi|Latvij',
  sk: 'Словаччин|Словаки[яиюей]|Slovakia|Slovensk',
  ro: 'Румуні|Румыни|Romania|România',
  hu: 'Угорщин|Венгри|Hungary|Magyarorsz',
  gr: 'Греці|Греци|Greece|Ελλάδα',
  it: 'Італі|Итали|Italy|Italia',
  be: 'Бельгі|Бельги|Belgi',
  at: 'Австрі|Австри[яиюей]|Austria|Österreich',
  fr: 'Франці|Франци[яиюей]|France',
  gb: 'Англі(?!йськ)|Англи[яиюей](?!йск)|Великобритані|Великобритани|Британі|England|United Kingdom|UK(?![\\p{L}])',
  ca: 'Канад|Canada',
}
const CITY_HINTS: Record<string, string> = {
  pl: 'Варшав|Вроцлав|Познан|Лодз|Краків|Краков|Катовіц|Катовиц|Гданськ|Гданьск|Гдин|Щецин|Люблін|Люблин|Бидгощ|Білосток|Белосток|Ченстохов|Жешув|Ополе|Торун|Кельц|Ольштин|Слупськ|Сосновец|Гливіц|Гливиц|Warszaw|Wrocław|Wroclaw|Poznań|Poznan|Łódź|Lodz|Kraków|Krakow|Katowic|Gdańsk|Gdansk|Gdyni|Szczecin|Lublin|Bydgoszcz|Białystok|Bialystok|Częstochow|Rzeszów|Opole|Toruń|Kielce|Olsztyn|Sosnowiec|Gliwice',
  cz: 'Праг[аиуі]?(?![\\p{L}])|Празі|Брно|Острав|Пльзен|Оломоуц|Пардубіц|Ліберец|Кладно|Млада-Болеслав|Praha|Prague|Brno|Ostrava|Plzeň|Plzen|Olomouc|Pardubic|Liberec|Kladno|Mladá Boleslav',
  de: 'Берлін|Берлин|Гамбург|Мюнхен|Франкфурт|Кельн|Штутгарт|Дюссельдорф|Лейпциг|Дрезден|Бремен|Ганновер|Нюрнберг|Кассел|Дортмунд|Ессен|Білефельд|Мангейм|Аугсбург|Вісбаден|Майнц|Бонн|Мюнстер|Регенсбург|Інгольштадт|Вольфсбург|Ерфурт|Магдебург|Росток|Любек|Аахен|Дуйсбург|Карлсруе|Berlin|Hamburg|München|Munich|Frankfurt|Köln|Stuttgart|Düsseldorf|Leipzig|Dresden|Bremen|Hannover|Nürnberg|Karlsruhe|Kassel|Dortmund|Essen|Bielefeld|Mannheim|Augsburg|Wiesbaden|Mainz|Bonn|Münster|Regensburg|Ingolstadt|Wolfsburg|Erfurt|Magdeburg|Rostock|Lübeck|Aachen|Duisburg',
  nl: 'Амстердам|Роттердам|Гаага|Утрехт|Ейндговен|Эйндховен|Amsterdam|Rotterdam|Den Haag|Utrecht|Eindhoven|Venlo|Tilburg|Breda|Doetinchem',
  lt: 'Вільнюс|Вильнюс|Каунас|Клайпед|Шяуля|Паневежис|Vilnius|Kaunas|Kowno|Klaipėd|Klaiped|Šiauliai|Panevėž|Panevez',
  lv: 'Рига|Ризі|Риге|Riga|Rīga|Даугавпілс|Daugavpils',
  sk: 'Братислав|Кошиц|Bratislav|Košic|Žilin|Nitra|Trnava',
  ro: 'Бухарест|Клуж|Тімішоар|Тимишоар|București|Bucharest|Cluj|Timișoara|Timisoara',
  hu: 'Будапешт|Дебрецен|Дьор|Шарвар|Залаегерсег|Сомбатгей|Кечкемет|Budapest|Debrecen|Győr|Sárvár|Zalaegerszeg|Szombathely|Kecskemét',
  gr: 'Афін|Афин|Салонік|Родос|Крит(?:і|у|ом)?(?![\\p{L}])|Корфу|Халкідік|Закінф|Санторін|Міконос|Парос|Тінос|Athens|Thessalon|Rhodes|Crete|Corfu|Santorini|Mykonos|Кос(?![\\p{L}])',
  it: 'Рим(?:і)?(?![\\p{L}])|Мілан|Милан|Неапол|Турин|Roma(?![\\p{L}])|Milano|Milan(?![\\p{L}])|Napoli|Torino',
  be: 'Брюссел|Антверпен|Гент(?![\\p{L}])|Brussel|Bruxelles|Antwerp|Gent(?![\\p{L}])|Ghent',
  at: 'Відень|Відні|Вена(?![\\p{L}])|Зальцбург|Інсбрук|Wien|Vienna|Salzburg|Innsbruck|Graz|Linz',
  fr: 'Париж|Ліон|Лион|Марсел|Paris|Lyon|Marseille',
  gb: 'Лондон|Манчестер|Бірмінгем|London|Manchester|Birmingham',
  ca: 'Торонто|Монреаль|Ванкувер|Калгарі|Toronto|Montreal|Vancouver|Calgary',
}
/** letters of the local alphabet in a Latin place name */
const DIACRITICS: [string, RegExp, number][] = [
  ['pl', /[łśżźćńąę]/i, 3],
  ['cz', /[řěů]/i, 3],
  ['lt', /[ėįųū]/i, 3],
  ['ro', /[șțşţă]/i, 3],
  ['hu', /[őű]/i, 3],
  ['de', /[äöüß]/i, 2],
]
const CURRENCY_HINTS: [string, RegExp][] = [
  ['pl', /zł|(?<![\p{L}])зл(?![\p{L}])|злот|PLN/iu],
  ['cz', /Kč|CZK|(?<![\p{L}])крон/iu],
  ['gb', /£|фунт|GBP/iu],
  ['hu', /HUF|форинт|(?<![\p{L}])Ft(?![\p{L}])/u],
  ['ro', /RON|(?<![\p{L}])lei(?![\p{L}])|(?<![\p{L}])лей(?![\p{L}])/iu],
]

const re = (src: string, flags = 'iu') => new RegExp(`(?<![\\p{L}])(?:${src})`, flags)
const RX_CACHE = new Map<string, RegExp>()
function rxOf(src: string) {
  let r = RX_CACHE.get(src)
  if (!r) RX_CACHE.set(src, (r = re(src, 'giu')))
  r.lastIndex = 0
  return r
}
const count = (src: string, text: string) => (text.match(rxOf(src)) ?? []).length

/** name stems for every country (built-in hints + the ones added in /admin/countries) */
function nameHints(): Record<string, string> {
  const out: Record<string, string> = { ...NAME_HINTS }
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // «Іспанія» → «Іспані» (Іспанії, Іспанію…); short names («ОАЕ», «США») as whole words
  const stem = (n: string) => (n.length >= 5 ? esc(n.replace(/[яаьй]$/i, '')) : `${esc(n)}${NOT_LETTER}`)
  for (const c of COUNTRIES) {
    if (out[c.code]) continue
    out[c.code] = [...new Set([c.name, c.nameRu].filter(Boolean).map(stem))].join('|')
  }
  return out
}

function isCountryName(part: string) {
  const f = fold(part).replace(/[.]+$/, '')
  if (!f) return false
  if (/^(польща|польша|polska|poland|чехія|чехия|czechia|чеська республіка|німеччина|германия|deutschland|germany|нідерланди|нидерланды|голландія|голландия|netherlands|nederland|литва|lithuania|латвія|латвия|словаччина|словакия|румунія|румыния|угорщина|венгрия|греція|греция|італія|италия|бельгія|бельгия|австрія|австрия|франція|франция|англія|англия|великобританія|великобритания|канада|європа|европа)$/.test(f)) return true
  return COUNTRIES.some((c) => fold(c.name) === f || fold(c.nameRu) === f)
}

interface CountryGuess {
  code: CountryCode | ''
  status: 'ok' | 'guess'
  note: string
}

function guessCountry(o: { place: string; title: string; salaryText: string; text: string; kvCountry: string }): CountryGuess {
  const names = nameHints()
  const score: Record<string, number> = {}
  const why: Record<string, string> = {}
  const add = (code: string, n: number, reason: string) => {
    if (!n) return
    score[code] = (score[code] ?? 0) + n
    if (!why[code] || n >= 3) why[code] = why[code] && n < 3 ? why[code] : reason
  }
  const outer = o.place.replace(/\([^)]*\)?/g, ' ')
  const inner = (o.place.match(/\(([^)]*)\)?/g) ?? []).join(' ')
  for (const [code, src] of Object.entries(names)) {
    if (o.kvCountry && count(src, o.kvCountry)) add(code, 12, `рядок «Країна: ${o.kvCountry}»`)
    if (count(src, outer)) add(code, 6, 'назва країни в місці роботи')
    if (count(src, inner)) add(code, 1, 'назва країни в дужках місця роботи')
    if (count(src, o.title)) add(code, 4, 'назва країни в заголовку')
    add(code, Math.min(3, count(src, o.text)), 'назва країни в тексті')
  }
  for (const [code, src] of Object.entries(CITY_HINTS)) {
    if (count(src, outer)) add(code, 5, 'місто в місці роботи')
    if (count(src, inner)) add(code, 1, 'місто в дужках місця роботи')
    if (count(src, o.title)) add(code, 3, 'місто в заголовку')
  }
  for (const [code, rx, n] of DIACRITICS) if (rx.test(outer)) add(code, n, 'місцеві літери в назві міста')
  const money = `${o.salaryText} ${o.text}`
  for (const [code, rx] of CURRENCY_HINTS) if (rx.test(money)) add(code, rx.test(o.salaryText) ? 4 : 2, 'валюта зарплати')
  // a Polish contract — unless the worker is posted abroad from Poland (A1)
  const posted = /(?<![\p{L}\d])[AА]-?1(?![\p{L}\d])|відрядж|командиров/iu.test(o.text)
  if (/umo[wv]a|умова зл|ZUS|PESEL|karta pobytu/i.test(o.text) && !posted) add('pl', 2, 'польський договір (Umowa)')
  // «по А1» = a Polish firm posts the worker to another country
  if (posted && score.pl) score.pl -= 3
  for (const m of o.text.matchAll(/([\u{1F1E6}-\u{1F1FF}])([\u{1F1E6}-\u{1F1FF}])/gu)) {
    const code = String.fromCharCode(m[1].codePointAt(0)! - 0x1f1e6 + 97, m[2].codePointAt(0)! - 0x1f1e6 + 97)
    add(code === 'uk' ? 'gb' : code, 4, 'прапор у тексті')
  }
  const known = new Set(COUNTRIES.map((c) => c.code))
  const ranked = Object.entries(score)
    .filter(([c]) => known.has(c))
    .sort((a, b) => b[1] - a[1])
  if (!ranked.length) return { code: '', status: 'guess', note: '' }
  const [best, second] = ranked
  const sure = best[1] >= 5 && (!second || best[1] - second[1] >= 3)
  return { code: best[0], status: sure ? 'ok' : 'guess', note: why[best[0]] ?? '' }
}

/** «м. Ełk (130 км від Białystok)» → «Ełk»; «Німеччина, Бремен (стартова локація…)» → «Бремен» */
function cityOf(place: string) {
  let p = place.replace(/^(м\.|місто|с\.|смт|г\.|город|село|містечко)\s*/i, '')
  p = p.replace(/\s*\(.*$/, '').trim().replace(/[.,;:]+$/, '')
  const parts = p.split(/\s*,\s*/).filter(Boolean)
  const kept = parts.filter((x) => !isCountryName(x))
  p = (kept.length ? kept : parts).join(', ').replace(/^(м\.|місто|с\.|смт|г\.)\s*/i, '')
  return p.slice(0, 60).trim()
}

/** «(20 км від Катовіце)» → hub city for the city landings (Poland and Czechia only, like the import) */
const HUB_FORMS: [string, RegExp][] = [
  ['Warszawa', /Варшав|Warszaw|Warsaw/i], ['Wrocław', /Вроцлав|Wrocław|Wroclaw/i], ['Poznań', /Познан|Poznań|Poznan/i],
  ['Łódź', /Лодз|Łódź|Lodz/i], ['Katowice', /Катовіц|Катовиц|Katowic/i], ['Kraków', /Кракова|Краків|Краков|Kraków|Krakow/i],
  ['Gdańsk', /Гданськ|Гданьск|Gdańsk|Gdansk/i], ['Lublin', /Любл[іи]н|Lublin/i], ['Szczecin', /Щецин|Szczecin/i],
  ['Bydgoszcz', /Бидгощ|Bydgoszcz/i], ['Gorzów Wielkopolski', /Гожув|Gorzów|Gorzow/i], ['Zielona Góra', /Зелена Гура|Зеленої Гури|Zielona Góra|Zielona Gora/i],
  ['Rzeszów', /Жешув|Rzeszów|Rzeszow/i], ['Opole', /Ополе|Opole/i], ['Białystok', /Білосток|Белосток|Białystok|Bialystok/i],
  ['Toruń', /Торун|Toruń|Torun/i], ['Kielce', /Кельц|Kielce/i], ['Olsztyn', /Ольштин|Olsztyn/i],
  ['Praha', /Праг[аиуі]?(?![\p{L}])|Празі|Praha|Prague/iu], ['Brno', /Брно|Brno/i], ['Ostrava', /Острав|Ostrava/i], ['Plzeň', /Пльзен|Plzeň|Plzen/i],
]
const hubOf = (place: string) => HUB_FORMS.find(([, rx]) => rx.test(place))?.[0] ?? ''

/* ------------------------------------------------------------------ category, company */

const CATEGORY_RULES: [Category, RegExp][] = [
  ['care', /доглядаль|опікун|доглядач|сиділк|сиделк/iu],
  ['driver', /водій|водія|водител|кур.?єр|курьер|далекобій|дальнобой|категорі[яї] [BCDE](?![\p{L}])|автобус/iu],
  ['construction', /будів|строит|муляр|каменяр|бруків|плиточник|маляр|штукатур|арматурник|опалубник|зварюв|сварщ|монтаж вікон|(?<![а-яіїєґ])кладк|покрівел|бетон|сантехн|електрик|электрик|сонячн/iu],
  ['horeca', /готел|отел[ьяе]|ресторан|кухар|повар|офіціант|официант|бармен|кейтерин|піцайол|сушист|McDonald|рецепц/iu],
  ['cleaning', /прибира|клінінг|клининг|пральн|покоївк|горничн|уборщ/iu],
  ['agro', /ферм|теплиц|тюльпан|квіт|цвет|сільськ|сельск|урожа|збир(ання|ач) (полуниц|ягід|овоч|фрукт)|шампіньйон|рибалк|дояр|грибн|спарж/iu],
  ['auto', /автомобіл|автомобил|автокрісел|автокомпонент|автозавод|автозапчаст|Toyota|BMW|Skoda|Škoda|Audi(?![\p{L}])|Mercedes|Tesla|Тесла|Volkswagen|Maserati|Ford(?![\p{L}])|Adient|APTIV|Valeo|Tenneco|Motherson|REINER/iu],
  ['food', /кондитер|солодощ|сладост|цукер|конфет|шоколад|хліб|хлеб|пекарн|молочн|м.яс|мяс|ковбас|колбас|(?<![\p{L}])риб|(?<![\p{L}])рыб|кав[аи](?![\p{L}])|кофе|чаю|напо[її]в|напит|пив[аоу](?![\p{L}])|сніданк|Nutella|Ferrero|Nescafe|Coca|Orbit|Lipton|Red Bull|Mars(?![\p{L}])|Kinder|Jacobs|Cinnabon|ланч|овоч|курячому|кишков|Animex|напівфабрикат|морозив|сир[уа](?![\p{L}])/iu],
  ['warehouse', /склад|логіст|логист|комплектуваль|комплектовщ|пакувальн|пакуван|упаковщ|упаковк|сортуваль|сортуван|сортировщ|збирач замовлень|Amazon|DHL|DPD|FedEx|GLS(?![\p{L}])|Ambro/iu],
  ['retail', /магазин|супермаркет|Biedronka|Żabka|Zabka|MAKRO|касир|кассир|викладк|выкладк|Lidl|Auchan|Stokrotka/iu],
  ['factory', /виробництв|производств|завод|фабрик|фабриц|швея|швей|оператор|монтер|друкарн|типограф|цегель/iu],
]
const categoryIn = (text: string) => CATEGORY_RULES.find(([, rx]) => rx.test(text))?.[0]

const COMPANY_STOP = new Set(['B', 'C', 'D', 'E', 'CE', 'C+E', 'B+E', 'AC', 'ACV', 'WI', 'FI', 'LTE', 'I', 'II', 'III', 'IV', 'V', 'UA', 'EU', 'ЄС', 'A1', 'А1', 'CNC', 'NC', 'ЧПК', 'ЧПУ', 'АЗС', 'MIG', 'MAG', 'TIG', 'MIG/MAG', 'TIG/MIG', 'HR', 'IT', 'SPA'])

/** trailing Latin brand of the title: «Працівник складу MBB Logistics» → «MBB Logistics» */
function companyOf(title: string) {
  const t = title.replace(/\(.*?\)/g, '').replace(/[«»"“”]/g, '').trim()
  const m = `${t} `.match(/((?:[A-ZŁŚŻŹĆÓĄĘÄÖÜ0-9][\p{L}\p{N}_’'&.+/-]*(?:\s+|$))+)$/u)
  if (!m) {
    const m2 = t.match(/([A-ZА-ЯІЇЄҐ][A-ZА-ЯІЇЄҐ0-9]{2,}(?:\s+[A-ZА-ЯІЇЄҐ0-9]{2,})*)\s*$/u)
    return m2 && !/[а-яіїєґ]/.test(m2[1]) && !COMPANY_STOP.has(m2[1].trim()) ? m2[1].trim() : ''
  }
  const c = m[1].trim().replace(/^[\d\s/.-]+/, '')
  if ((c.match(/\p{L}/gu) ?? []).length < 2 || COMPANY_STOP.has(c) || c.split('/').every((x) => COMPANY_STOP.has(x))) return ''
  return c
}

/* ------------------------------------------------------------------ salary */

const NUM = /\d+(?:[.,]\d+)?/g
const toNum = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'))
/** «15,88 зл/год нетто, резидент — 19,85 зл/год нетто» → 15,88–19,85; «11–12 € нетто (14,40 брутто)» stays 11–12 */
const widen = (r: [number, number], next: [number, number], had: string, got: string): [number, number] =>
  (got === had || !got) && next[1] > r[1] && next[1] <= r[0] * 3 ? [r[0], next[1]] : r

const DEFAULT_CURRENCY: Record<string, Currency> = { pl: 'PLN', cz: 'CZK', ro: 'EUR', hu: 'EUR', gb: 'GBP', ca: 'USD', us: 'USD', ch: 'CHF', se: 'SEK', no: 'NOK', dk: 'DKK', au: 'USD' }

export function parseSalary(lines: string[], country: string): Salary | null {
  const text = lines
    .map((s) => bare(s).replace(/^(заробітна плата|заробітня плата|зарплата|заработная плата|з\/п|зп)\s*:?\s*/i, '').replace(/[;.\s]+$/, ''))
    .filter(Boolean)
    .join('; ')
  if (!text) return null
  let t = text
    .replace(/(?<=\d) (?=\d{3}(?!\d))/g, '') // 56 000 → 56000
    .replace(/(?<=\d)\.(?=\d{3}(?![\d.,]))/g, '') // 1.500 → 1500
    .replace(/\([^)]*(?:грн|\$|usd|долар|доллар)[^)]*\)/gi, '') // «(56 000 грн)» is a conversion, not the pay
    .replace(/[\d.,]+(?:\s*[-–—]\s*[\d.,]+)?\s*(?:грн|uah)\.?/gi, '')
  const usdOnly = /\$|usd|долар|доллар/i.test(t) && !/zł|зл|PLN|Kč|крон|CZK|£|фунт|€|євро|евро|EUR|lei|RON|лей|HUF|форинт|CHF|франк/i.test(t)
  if (!usdOnly) t = t.replace(/[\d.,]+(?:\s*[-–—]\s*[\d.,]+)?\s*(?:\$|usd|долар\w*|доллар\w*)/gi, '').replace(/\$\s*[\d.,]+(?:\s*[-–—]\s*[\d.,]+)?/g, '')
  let cur: Currency = DEFAULT_CURRENCY[country] ?? 'EUR'
  if (usdOnly) cur = 'USD'
  else if (/zł|(?<![\p{L}])зл|PLN|злот/iu.test(t)) cur = 'PLN'
  else if (/Kč|CZK/i.test(t) || (/(?<![\p{L}])крон/iu.test(t) && !['se', 'no', 'dk'].includes(country))) cur = 'CZK'
  else if (/(?<![\p{L}])крон|SEK|NOK|DKK/iu.test(t)) cur = /NOK/i.test(t) || country === 'no' ? 'NOK' : /DKK/i.test(t) || country === 'dk' ? 'DKK' : 'SEK'
  else if (/£|фунт|GBP/i.test(t)) cur = 'GBP'
  else if (/€|євро|евро|EUR/i.test(t)) cur = 'EUR'
  else if (/RON|(?<![\p{L}])lei|(?<![\p{L}])лей/iu.test(t)) cur = 'RON'
  else if (/HUF|форинт|(?<![\p{L}])Ft(?![\p{L}])/iu.test(t)) cur = 'HUF'
  else if (/CHF|франк/i.test(t)) cur = 'CHF'
  let hour: [number, number] | null = null
  let month: [number, number] | null = null
  // нетто / брутто of the segment each figure came from: «12,83 €/год брутто; 1500 € нетто/міс» — the card shows the month
  const label = (seg: string) => (/нетто|netto|на руки|чист(ими|ыми|і|ые)/i.test(seg) ? 'net' : /брутто|brutto|gross/i.test(seg) ? 'gross' : '')
  let hourLabel = ''
  let monthLabel = ''
  const hourCap = cur === 'PLN' || cur === 'RON' ? 100 : cur === 'CZK' || cur === 'HUF' || cur === 'SEK' || cur === 'NOK' || cur === 'DKK' ? 400 : 40
  // «31,40 зл/год брутто, 5500 зл/міс» — a comma with a space parts two figures (a decimal comma has none)
  // and «17 зл/год (від 3400 зл/міс)» — a bracket with a figure is a figure of its own
  for (let seg of t.split(/;|\n|,\s+(?=[^\d]{0,12}\d)|\s\((?=[^)]*\d)/)) {
    if (!usdOnly && /грн|\$/.test(seg) && !/zł|зл|€|євро|евро|Kč|крон|£/i.test(seg)) continue
    // «10–12 год/день» is the schedule, not the pay
    seg = seg.replace(/(?:\d+\s*[-–—]\s*)?\d+\s*(?:год|годин|часов|часа|час|ч)\p{L}*\.?\s*(?:\/|на|в)\s*(?:день|добу|сутки|тиждень|неделю)/giu, '')
    const nums = (seg.match(NUM) ?? []).map(toNum).filter((n) => Number.isFinite(n))
    if (!nums.length) continue
    const rng: [number, number] = [nums[0], nums.length > 1 && nums[1] >= nums[0] && nums[1] <= nums[0] * 3 ? nums[1] : nums[0]]
    // per day / per box / per room / per m² — the text says it; no hourly or monthly figure
    if (/день|добу|сутки|ящик|номер|м2|м²|\/\s*1?м(?![\p{L}])|штук|шт\./iu.test(seg)) continue
    if (/\/\s*год|за год|на год|в год(?![\p{L}])|\/h(?![\p{L}])|в годину|за годину|год(?![\p{L}]).*нетто|godz|\/\s*час|в час(?![\p{L}])|за час(?![\p{L}])|\/\s*ч(?![\p{L}])|per hour|\/hr/iu.test(seg) && rng[0] < 200) {
      if (!hour) [hour, hourLabel] = [rng, label(seg)]
      else hour = widen(hour, rng, hourLabel, label(seg))
    } else if (/міс|мес|month|в місяць|на місяць/iu.test(seg) || rng[0] >= 300) {
      if (!month) [month, monthLabel] = [rng, label(seg)]
      else month = widen(month, rng, monthLabel, label(seg))
    } else if (rng[0] < hourCap) {
      if (!hour) [hour, hourLabel] = [rng, label(seg)]
      else hour = widen(hour, rng, hourLabel, label(seg))
    }
  }
  // the figure the card shows: the month when it is a real monthly pay, else the hour (format.ts monthPlausible)
  const shown = month && (!hour || month[1] >= hour[0] * 60) ? monthLabel : hour ? hourLabel : ''
  const hasNet = /нетто|netto|на руки|чист(ими|ыми|і|ые)/i.test(t)
  const hasGross = /брутто|brutto|gross/i.test(t)
  // the text for the page: without the «68 800–85 800 грн; 1650–2040$» conversions (they go stale with every rate change)
  const conv = usdOnly ? /^[≈~\s]*(?:від|до|от)?\s*[\d\s.,]+(?:\s*[-–—]\s*[\d\s.,]+)?\s*(?:грн|uah)\.?$/i : /^[≈~\s]*(?:від|до|от)?\s*\$?\s*[\d\s.,]+(?:\s*[-–—]\s*[\d\s.,]+)?\s*(?:грн|uah|\$|usd|долар\p{L}*|доллар\p{L}*)\.?$/iu
  const pageText = text
    .replace(usdOnly ? /\s*\([^()]*(?:грн|uah)[^()]*\)/gi : /\s*\([^()]*(?:грн|uah|\$|usd|долар|доллар)[^()]*\)/gi, '')
    .split(/;\s*/)
    .filter((seg) => seg.trim() && !conv.test(seg.trim()))
    .join('; ')
  return {
    text: (pageText || text).replace(/\s+/g, ' ').trim(),
    hourMin: hour ? hour[0] : null,
    hourMax: hour ? hour[1] : null,
    monthMin: month ? month[0] : null,
    monthMax: month ? month[1] : null,
    currency: cur,
    // «… брутто (≈ … нетто)» with no label at the figure itself: the net figure is what the text leads with
    net: shown ? shown === 'net' : hasNet || !hasGross,
    ...(!hasNet && !hasGross ? { unlabelled: true } : {}),
  }
}

/* ------------------------------------------------------------------ contract */

/** Cyrillic look-alikes typed into «Umowa» (Umоwa with a Cyrillic «о») and the usual spellings → one form */
export function normalizeContract(s: string) {
  let c = s
  if (/umo|умов/i.test(c)) {
    const map: Record<string, string> = { о: 'o', О: 'O', а: 'a', А: 'A', е: 'e', Е: 'E', р: 'p', Р: 'P', с: 'c', С: 'C', і: 'i', І: 'I', у: 'y', У: 'Y', к: 'k', К: 'K', м: 'm', М: 'M', т: 't', Т: 'T', х: 'x', Х: 'X', в: 'w' }
    c = c.replace(/[A-Za-zоОаАеЕрРсСіІуУкКмМтТхХęłóąśżźćń]+/g, (w) => (/[A-Za-z]/.test(w) ? w.replace(/[оОаАеЕрРсСіІуУкКмМтТхХ]/g, (ch) => map[ch] ?? ch) : w))
  }
  c = c
    .replace(/umo[vw]a\s+zlecen\p{L}*/giu, 'Umowa Zlecenie')
    .replace(/умов[аи]\s+зле[цн]\p{L}*/giu, 'Umowa Zlecenie')
    .replace(/umo[vw]a\s+[oо]\s+prac\p{L}*/giu, 'Umowa o Pracę')
    .replace(/умов[аи]\s+о\s+прац\p{L}*/giu, 'Umowa o Pracę')
    .replace(/umo[vw]a\s+[oо]\s+dzie\p{L}*/giu, 'Umowa o Dzieło')
    .replace(/(?<![\p{L}\d])А-?1(?![\p{L}\d])/gu, 'A1')
  return c.replace(/^[(\s]+|[)\s.;]+$/g, '').trim()
}

/* ------------------------------------------------------------------ the parser */

const YT = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^\s]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/gi
export function youtubeIds(text: string) {
  return [...new Set([...text.matchAll(YT)].map((m) => m[1]))]
}

const BREADCRUMB = /^(головна|главная|home)\s*\/.+/i
const JUNK_TITLE = /^(вакансія|вакансия|вакансії|вакансии|терміново|срочно|терміновий набір|срочный набор|гаряча вакансія|горящая вакансия|актуально|new|новинка|нова вакансія|новая вакансия)[\s:!—–-]*$/i

function cleanTitle(s: string) {
  let t = bare(s.replace(/\*\*|__/g, ''))
  t = t.replace(/^(вакансія|вакансия|терміново|срочно|терміновий набір|срочный набор|гаряча вакансія|горящая вакансия|нова вакансія|новая вакансия)\s*[:!—–-]+\s*/i, '')
  t = t.replace(/[\s.!:;*\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]+$/u, '').replace(/\s+/g, ' ').trim()
  // «… (виробництво автокрісел для BMW» — the closing bracket got lost
  if ((t.match(/\(/g) ?? []).length > (t.match(/\)/g) ?? []).length) t += ')'
  return sentenceCase(t)
}

type SummaryLine = { kind: FieldKind; value: string; primary: boolean; raw: string }

export function parseVacancyText(input: string): ParsedVacancy {
  const lines = toLines(input)
  const how: ParsedVacancy['how'] = {}
  const warnings: string[] = []
  const leftovers: string[] = []
  const all = lines.join('\n')
  const videos = youtubeIds(all)
  const isUrl = (l: string) => /^(https?:\/\/|www\.)\S+$/i.test(bare(l))

  // language: letters only Russian has vs. only Ukrainian has
  const ru = (all.match(/[ыэъё]/gi) ?? []).length
  const uk = (all.match(/[іїєґ]/gi) ?? []).length
  const lang: 'uk' | 'ru' = ru > uk ? 'ru' : 'uk'

  /* title: the first real line (the breadcrumb, «Вакансія» and emoji-only lines skipped) */
  let i = 0
  let crumb = ''
  let title = ''
  const summary: SummaryLine[] = []
  for (; i < lines.length; i++) {
    const l = lines[i]
    if (!l || isUrl(l) || !/\p{L}/u.test(l) || JUNK_TITLE.test(bare(l))) continue
    if (BREADCRUMB.test(l)) {
      crumb = l.split('/').pop()?.trim() ?? ''
      continue
    }
    const kv = kvOf(l)
    if (kv?.kind === 'title') {
      title = cleanTitle(kv.value)
      i++
      break
    }
    const h = headingOf(l)
    if ((h && h.kind !== 'section') || EMOJI_KIND.some(([, rx]) => rx.test(l)) || kv) break
    // a whole sentence about the company is the intro, not a title (the breadcrumb then names the vacancy)
    if (bare(l).length > 110 || (bare(l).split(/\s+/).length > 14 && /[.!]$/.test(l))) break
    title = cleanTitle(l)
    i++
    break
  }
  if (!title && crumb) title = cleanTitle(crumb)
  if (title) how.title = { status: 'ok' }

  /* body */
  type Mode = 'intro' | 'summary' | 'section' | 'housingPhotos' | 'skip' | 'reviews'
  let mode: Mode = 'intro'
  const intro: string[] = []
  const sections: (Section & { kind: Kind })[] = []
  let cur: (Section & { kind: Kind }) | null = null
  let housingNote = ''
  const reviewLines: string[] = []
  const tTitle = fold(title)

  for (; i < lines.length; i++) {
    const l = lines[i]
    if (!l) continue
    if (isUrl(l) || /youtu\.?be/i.test(l)) continue
    if (BREADCRUMB.test(l)) continue
    if (tTitle && fold(cleanTitle(l)) === tTitle) continue
    const h = headingOf(l)
    // «🏠 Проживання 600 зл» is a summary line, «🏠 ПРОЖИВАННЯ» a heading
    if (h) {
      if (h.kind === 'summary') mode = 'summary'
      else if (h.kind === 'housingPhotos') mode = 'housingPhotos'
      else if (h.kind === 'photos' || h.kind === 'video') mode = 'skip'
      else if (h.kind === 'reviews') mode = 'reviews'
      else {
        const canon = CANONICAL[h.kind]
        const f = fold(h.name)
        const name = canon && (!canon.same || canon.same.test(f)) ? canon[lang] : sentenceCase(h.name)
        cur = { title: name, items: [], kind: h.kind }
        sections.push(cur)
        mode = 'section'
      }
      continue
    }
    const kv = kvOf(l)
    if (mode === 'intro' || mode === 'summary') {
      // without an emoji: any line of the summary, or a short «Ставка 9 €/год» line in the intro
      const plain = !kv && (mode === 'summary' || (bare(l).length < 90 && /\d/.test(l)))
      const ek = EMOJI_KIND.find(([, rx]) => rx.test(l))?.[0] ?? (plain ? PREFIX_KIND.find(([, rx]) => rx.test(fold(bare(l))))?.[0] : undefined)
      if (ek) summary.push({ kind: ek, value: bare(l), primary: true, raw: l })
      else if (kv) summary.push({ kind: kv.kind, value: kv.value, primary: true, raw: l })
      else if (mode === 'summary') leftovers.push(bare(l) || l)
      else {
        const item = cleanItem(l)
        if (item) intro.push(item)
      }
      continue
    }
    if (mode === 'housingPhotos') {
      housingNote = `${housingNote} ${l.replace(/^[*()\s]+|[*()\s]+$/g, '')}`.trim()
      continue
    }
    if (mode === 'skip') {
      if (!/^\*?\(?(варіант|вариант)/i.test(l)) leftovers.push(l)
      continue
    }
    if (mode === 'reviews') {
      reviewLines.push(l)
      continue
    }
    if (cur) {
      // 💵 / 📍 lines under a heading we don't know (a cut «КОРОТКО ПРО ОСНОВН», «ТЕРМІНОВО») are the summary
      const ek = cur.kind === 'section' && !BULLET.test(l) ? EMOJI_KIND.find(([, rx]) => rx.test(l))?.[0] : undefined
      if (ek) {
        summary.push({ kind: ek, value: bare(l), primary: true, raw: l })
        continue
      }
      // «Житло: 300 зл» inside another section still tells the housing (used when the summary has none)
      if (kv && !BULLET.test(l) && kv.kind !== 'title' && kv.kind !== cur.kind) summary.push({ kind: kv.kind, value: kv.value, primary: false, raw: l })
      const item = cleanItem(l)
      if (!item) continue
      const last = cur.items[cur.items.length - 1]
      // «☑ …» sub-points and continuation lines join the previous point
      if (last && (/^\s*☑/.test(l) || (!BULLET.test(l) && !LEAD.test(l) && last.endsWith(':')))) cur.items[cur.items.length - 1] = `${last} ${item}`
      else cur.items.push(item)
    }
  }

  /* reviews: «Ім’я ⭐⭐⭐⭐⭐» then the text */
  const reviews: Review[] = []
  const reviewSecs = sections.filter((s) => /відгук|отзыв/i.test(s.title))
  for (const it of [...reviewLines, ...reviewSecs.flatMap((s) => s.items)]) {
    const m = cleanItem(it).match(/^(\S[^⭐]{0,30}?)\s*(⭐+)\s*(.*)$/u)
    if (m) {
      if (reviews.length && !reviews[reviews.length - 1].text) reviews.pop()
      reviews.push({ name: m[1].trim(), text: m[3].trim(), rating: Math.min(5, [...m[2]].length) })
    } else if (reviews.length) reviews[reviews.length - 1].text = `${reviews[reviews.length - 1].text} ${cleanItem(it)}`.trim()
  }
  const goodReviews = reviews.filter((r) => r.text)
  const finalSections: Section[] = sections
    .filter((s) => !reviewSecs.includes(s) && s.items.length)
    .map((s) => ({ title: s.title, items: s.items }))

  /* summary fields */
  const pick = (kind: FieldKind) => summary.find((s) => s.kind === kind && s.primary) ?? summary.find((s) => s.kind === kind)
  const secOf = (kind: Kind) => sections.find((s) => s.kind === kind && s.items.length)

  // place → city, country
  let place = pick('place')?.value.replace(/^(місце роботи|место работы|місто|город|локація|локация|адреса|адрес)\s*:?\s*/i, '') ?? ''
  let placeFrom: 'ok' | 'guess' = 'ok'
  if (!place && secOf('place')) {
    place = secOf('place')!.items[0]
    placeFrom = 'ok'
  }
  place = place.replace(/[;.\s]+$/, '')

  // salary lines: every 💵 / 💰 line of the summary, else the «Заробітна плата» section
  const salSummary = summary.filter((s) => s.kind === 'salary' && s.primary)
  const salLines = salSummary.length ? salSummary.map((s) => s.value) : summary.filter((s) => s.kind === 'salary').map((s) => s.value)
  let salaryStatus: 'ok' | 'guess' = 'ok'
  const salSec = secOf('salary')
  const kvCountry = pick('country')?.value ?? ''
  const fullText = [title, intro.join(' '), summary.map((s) => s.value).join(' '), finalSections.map((s) => `${s.title} ${s.items.join(' ')}`).join(' ')].join(' \n ')
  const country = guessCountry({ place, title, salaryText: salLines.join(' ') || salSec?.items.slice(0, 3).join(' ') || '', text: fullText, kvCountry })
  if (country.code) how.country = { status: country.status, note: country.note }
  // «Робота в Іспанії» while Spain isn't on the site yet → offer to add it
  let newCountry: CountryPreset | undefined
  if (!country.code || country.status === 'guess') {
    const known = new Set(COUNTRIES.map((c) => c.code))
    const hay = `${place} ${title} ${kvCountry}`
    newCountry = COUNTRY_PRESETS.find((pr) => !known.has(pr.code) && [pr.name, pr.nameRu].some((n) => count(n.length >= 5 ? n.replace(/[яаьй]$/i, '') : `${n}${NOT_LETTER}`, hay)))
    if (newCountry) warnings.push(`Схоже, це ${newCountry.name} — такої країни ще немає на сайті. Додайте її кнопкою нижче або в полі «Країна».`)
  }
  let salary = parseSalary(salLines, country.code || 'pl')
  if ((!salary || (salary.hourMin == null && salary.monthMin == null)) && salSec) {
    const fromSec = parseSalary(salSec.items.slice(0, 3), country.code || 'pl')
    if (fromSec && (fromSec.hourMin != null || fromSec.monthMin != null)) {
      salary = salary?.text ? { ...fromSec, text: salary.text } : { ...fromSec, text: salSec.items.slice(0, 2).join('; ').replace(/[;.\s]+$/, '') }
      salaryStatus = 'guess'
    }
  }
  if (salary) {
    const figures = salary.hourMin != null || salary.monthMin != null
    how.salary = { status: figures ? salaryStatus : 'guess', note: figures ? undefined : 'цифр не знайдено — впишіть «від / до»' }
    if (salary.unlabelled) warnings.push('У тексті немає «нетто» чи «брутто» — оберіть, як вказана сума.')
  }

  // schedule / contract / housing: summary lines, then the sections
  let schedule = (pick('schedule')?.value ?? '').replace(/^(робота|работа)\s+/i, '').replace(/^(графік роботи|графік|график работы|график)\s*:?\s*/i, '').replace(/[;.\s]+$/, '')
  if (schedule) how.schedule = { status: 'ok' }
  else if (secOf('schedule')) {
    schedule = secOf('schedule')!.items.filter((x) => x.length <= 70).slice(0, 2).join(', ').replace(/[;.\s]+$/, '')
    if (schedule) how.schedule = { status: 'guess', note: 'з розділу «Графік роботи»' }
  }

  let contract = (pick('contract')?.value ?? '').replace(/^(договір|договор|тип договору|вид договору|контракт|оформлення|оформление)\s*:?\s*/i, '')
  contract = contract.replace(/^(офіційне працевлаштування|официальное трудоустройство)(\s+(за|по)\s+(договором|договору))?\s*/i, '')
  contract = normalizeContract(contract)
  if (contract) how.contract = { status: 'ok' }
  else {
    const m = fullText.match(/umo[vw]a\s+(?:zlecen\w*|[oо]\s+prac\w*|[oо]\s+dzie\w*)|умов[аи]\s+(?:злец|зленц)\w*/i)
    if (m) {
      contract = normalizeContract(m[0])
      how.contract = { status: 'guess', note: 'знайдено в тексті' }
    }
  }

  let housing = (pick('housing')?.value ?? '').replace(/^(проживання|житло|проживание|жилье|жильё)\s*:?\s*/i, '').replace(/[;.\s]+$/, '')
  const hSec = secOf('housing')
  if (housing) how.housing = { status: 'ok' }
  else if (hSec && hSec.items[0].length <= 90) {
    housing = hSec.items[0].replace(/[;.\s]+$/, '')
    how.housing = { status: 'guess', note: 'перший пункт розділу «Проживання»' }
  }
  const housingFree = /безкоштов|безплатн|бесплатн|за рахунок роботодавця|за счет работодателя|за счёт работодателя|оплачує роботодав|оплачивает работодат|free/i.test(`${housing} ${(hSec?.items ?? []).slice(0, 2).join(' ')}`)
  if (housing || hSec) how.housingFree = { status: 'guess' }

  const city = place ? cityOf(place) : ''
  if (city) how.city = { status: placeFrom, note: /[;,]| і | та /.test(city) ? 'кілька міст — перевірте' : undefined }
  const hubCity = country.code === 'pl' || country.code === 'cz' ? hubOf(place) : ''
  if (hubCity) how.hubCity = { status: 'guess' }

  // category: the title first, then the intro, then the duties
  const introText = intro.join(' ')
  const duties = secOf('duties')?.items.join(' ') ?? ''
  const cat = categoryIn(title) ?? categoryIn(`${title} ${introText}`) ?? categoryIn(duties)
  if (cat) how.category = { status: 'guess', note: categoryIn(title) ? 'за назвою' : 'за описом' }

  // company: «Компанія: …» line, else the brand at the end of the title, else «…» quotes
  let company = pick('company')?.value ?? ''
  if (company) how.company = { status: 'ok' }
  else {
    company = companyOf(title)
    if (!company) company = (title.match(/«([^»]{2,40})»|"([^"]{2,40})"/) ?? []).slice(1).find(Boolean) ?? ''
    if (company) how.company = { status: 'guess', note: 'з назви вакансії' }
  }

  const noLanguage = /без знан(ня|ия) (мов|язык|англ|польськ|німецьк|польск|немецк)|знан(ня|ие) (мови|мов|языка) не (потрібн|обов|нужн|обяз)|мова не потрібна|язык не нужен/i.test(fullText)
  const noExperience = /без досвіду|досвід (роботи )?не (потрібен|обов|вимага)|без опыта|опыт (работы )?не (нужен|обяз|требу)/i.test(fullText)
  if (noLanguage) how.noLanguage = { status: 'guess' }
  if (noExperience) how.noExperience = { status: 'guess' }

  if (finalSections.length) how.sections = { status: 'ok', note: `${finalSections.length} розд., ${finalSections.reduce((n, s) => n + s.items.length, 0)} пункт.` }
  if (introText) how.intro = { status: 'ok' }
  if (videos.length) how.videos = { status: 'ok' }
  if (goodReviews.length) how.reviews = { status: 'ok' }
  if (housingNote) how.housingNote = { status: 'ok' }

  // summary lines with a known emoji whose field was already filled are not «leftovers»; unknown kv keys are
  if (lang === 'ru') warnings.push('Текст російською. Для української версії перекладіть його або вставте цей текст у вкладку «Русский».')

  return {
    lang,
    title,
    company,
    country: country.code,
    city,
    hubCity,
    category: cat ?? '',
    salary,
    schedule,
    contract,
    housing,
    housingFree,
    intro: introText,
    sections: finalSections,
    videos,
    reviews: goodReviews,
    housingNote,
    noLanguage,
    noExperience,
    how,
    newCountry,
    leftovers,
    warnings,
  }
}

/* ------------------------------------------------------------------ into the form */

/** The recognised fields over the current form; anything not found keeps what the form has */
export function applyParsed(v: Vacancy, p: ParsedVacancy): Vacancy {
  const next: Vacancy = { ...v }
  if (p.title) next.title = p.title
  if (p.company) next.company = p.company
  if (p.country) next.country = p.country
  if (p.city) next.city = p.city
  next.hubCity = p.hubCity || (p.city ? '' : v.hubCity)
  if (p.category) next.category = p.category
  if (p.salary) next.salary = { ...p.salary }
  if (p.schedule) next.schedule = p.schedule
  if (p.contract) next.contract = p.contract
  if (p.housing) next.housing = p.housing
  if (p.how.housingFree) next.housingFree = p.housingFree
  if (p.intro) next.intro = p.intro
  if (p.sections.length) next.sections = p.sections
  if (p.videos.length) next.videos = p.videos
  if (p.reviews.length) next.reviews = [...v.reviews.filter((r) => r.name || r.text), ...p.reviews]
  if (p.housingNote) next.housingNote = p.housingNote
  if (p.noLanguage) next.noLanguage = true
  if (p.noExperience) next.noExperience = true
  return next
}

/** The same text pasted on the «Русский» tab → the Russian fields */
export function applyParsedRu(ru: VacancyRu | undefined, p: ParsedVacancy): VacancyRu {
  const next: VacancyRu = { title: '', ...ru }
  if (p.title) next.title = p.title
  if (p.city) next.city = p.city
  if (p.salary?.text) next.salaryText = p.salary.text
  if (p.schedule) next.schedule = p.schedule
  if (p.contract) next.contract = p.contract
  if (p.housing) next.housing = p.housing
  if (p.intro) next.intro = p.intro
  if (p.housingNote) next.housingNote = p.housingNote
  if (p.sections.length) next.sections = p.sections
  return next
}

export const FIELD_LABEL: Record<ParsedField, string> = {
  title: 'Назва',
  company: 'Компанія',
  country: 'Країна',
  city: 'Місто',
  hubCity: 'Велике місто поруч',
  category: 'Сфера',
  salary: 'Зарплата',
  schedule: 'Графік',
  contract: 'Договір',
  housing: 'Проживання',
  housingFree: 'Житло безкоштовне',
  intro: 'Вступ',
  sections: 'Розділи опису',
  videos: 'Відео YouTube',
  reviews: 'Відгуки',
  housingNote: 'Підпис до фото житла',
  noLanguage: 'Без знання мови',
  noExperience: 'Без досвіду',
}

/** What the manager must look at: the main fields that were not found */
export const REQUIRED_FIELDS: ParsedField[] = ['title', 'country', 'city', 'salary', 'schedule', 'contract', 'housing', 'sections']
