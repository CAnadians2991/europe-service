import 'server-only'
import { unstable_cache } from 'next/cache'
import { getArticle, getLegal, pageByPath } from '@/lib/content'
import { getLanding } from '@/lib/landing'
import { getQuiz } from '@/lib/quizzes'
import { getVisaPage } from '@/lib/visa'
import { COUNTRIES, COUNTRY, SITE } from '@/lib/site'
import { ruTwin } from '@/lib/alt-routes'
import { PARTNER_PATHS } from '@/lib/partners'
import { salaryMain } from '@/lib/format'
import { forLang, getAllVacancies, getClosedVacancyPaths, getVacancyByPath, VACANCIES_TAG } from '@/lib/vacancies'
import { ensureCountries } from '@/lib/countries'
import { sitemapEntries } from '@/lib/sitemap-entries'
import { hasRu } from '@/lib/vacancy-i18n'
import type { Vacancy } from '@/lib/types'
import { mdUrl, renderDoc, topicPath, type MdDoc, type MdLang } from './core'
import { articleDoc, contentPageDoc, countryDoc, inCountry, landingDoc, legalDoc, quizDoc, vacancyDoc, visaDoc } from './render'
import { htmlPageMd } from './html'

type L2 = 'uk' | 'ru'
const t = (lang: MdLang, uk: string, ru: string, en = uk, pl = uk) => ({ uk, ru, en, pl })[lang]

/** pages rendered from their components: Markdown = the live page's <main> (lib/md/html) */
const HTML_PAGES: Record<string, { lang: MdLang; title: string; topic: string; purpose: string }> = {
  '/': { lang: 'uk', title: 'Europe Service — кадрове агентство: офіційна робота в Європі для українців', topic: 'agency', purpose: 'головна: хто ми, країни, найкращі вакансії, як працюємо, відгуки, часті питання' },
  '/ru': { lang: 'ru', title: 'Europe Service — кадровое агентство: официальная работа в Европе для украинцев', topic: 'agency', purpose: 'главная: кто мы, страны, лучшие вакансии, как работаем, отзывы, частые вопросы' },
  '/about': { lang: 'uk', title: 'Про агентство Europe Service', topic: 'agency', purpose: 'історія, ліцензія, офіси, команда, нагороди' },
  '/ru/about': { lang: 'ru', title: 'Об агентстве Europe Service', topic: 'agency', purpose: 'история, лицензия, офисы, команда, награды' },
  '/contacts': { lang: 'uk', title: 'Контакти Europe Service', topic: 'agency', purpose: 'телефони, адреси офісів, графік, месенджери' },
  '/ru/contacts': { lang: 'ru', title: 'Контакты Europe Service', topic: 'agency', purpose: 'телефоны, адреса офисов, график, мессенджеры' },
  '/vidguki': { lang: 'uk', title: 'Відгуки клієнтів Europe Service', topic: 'agency', purpose: 'відгуки працівників про вакансії, житло й супровід' },
  '/ru/otzyvy': { lang: 'ru', title: 'Отзывы клиентов Europe Service', topic: 'agency', purpose: 'отзывы работников о вакансиях, жилье и сопровождении' },
  '/poslugi': { lang: 'uk', title: 'Послуги та ціни Europe Service', topic: 'services', purpose: 'пакети супроводу «Базовий», «Стандарт», «Преміум»: ціни, що входить, заміна вакансії' },
  '/ru/services': { lang: 'ru', title: 'Услуги и цены Europe Service', topic: 'services', purpose: 'пакеты сопровождения «Базовый», «Стандарт», «Премиум»: цены, что входит, замена вакансии' },
  '/news': { lang: 'uk', title: 'Новини та статті Europe Service', topic: 'guides', purpose: 'перелік статей про роботу, візи й життя за кордоном' },
  '/ru/news': { lang: 'ru', title: 'Новости и статьи Europe Service', topic: 'guides', purpose: 'список статей о работе, визах и жизни за границей' },
  '/zarplaty': { lang: 'uk', title: 'Індекс зарплат Europe Service', topic: 'salaries', purpose: 'ставки за годину й на місяць за країнами, сферами й договорами за актуальними вакансіями; щомісяця' },
  '/ru/zarplaty': { lang: 'ru', title: 'Индекс зарплат Europe Service', topic: 'salaries', purpose: 'ставки в час и в месяц по странам, сферам и договорам по актуальным вакансиям; ежемесячно' },
  [PARTNER_PATHS.uk]: { lang: 'uk', title: 'Співпраця з Europe Service для роботодавців, агентств і рекрутерів', topic: 'partners', purpose: 'умови співпраці, обсяги, як почати' },
  [PARTNER_PATHS.ru]: { lang: 'ru', title: 'Сотрудничество с Europe Service для работодателей, агентств и рекрутеров', topic: 'partners', purpose: 'условия сотрудничества, объёмы, как начать' },
  [PARTNER_PATHS.en]: { lang: 'en', title: 'Partner with Europe Service: employers, labour agencies, recruiters', topic: 'partners', purpose: 'cooperation terms, volumes, how to start' },
  [PARTNER_PATHS.pl]: { lang: 'pl', title: 'Współpraca z Europe Service dla pracodawców, agencji i rekruterów', topic: 'partners', purpose: 'warunki współpracy, skala, jak zacząć' },
}

const TOPICS: Record<string, (lang: MdLang) => { title: string; about: string }> = {
  agency: (l) => ({ title: t(l, 'Агентство Europe Service', 'Агентство Europe Service', 'About Europe Service', 'O Europe Service'), about: t(l, 'хто ми, ліцензія № 223, офіси, контакти, відгуки клієнтів', 'кто мы, лицензия № 223, офисы, контакты, отзывы клиентов') }),
  services: (l) => ({ title: t(l, 'Послуги та ціни', 'Услуги и цены'), about: t(l, 'пакети супроводу, ціни в гривнях, що входить, гарантія заміни вакансії', 'пакеты сопровождения, цены в гривнах, что входит, гарантия замены вакансии') }),
  visa: (l) => ({ title: t(l, 'Робоча віза в Польщу та відрядження A1', 'Рабочая виза в Польшу и командировка A1'), about: t(l, 'віза D на рік, ціна супроводу, документи, строки, робота в Нідерландах і Німеччині з польською візою', 'виза D на год, цена сопровождения, документы, сроки, работа в Нидерландах и Германии с польской визой') }),
  salaries: (l) => ({ title: t(l, 'Зарплати за кордоном', 'Зарплаты за границей'), about: t(l, 'індекс зарплат за актуальними вакансіями: медіани за країнами, сферами й договорами, зміна за місяць', 'индекс зарплат по актуальным вакансиям: медианы по странам, сферам и договорам, изменение за месяц') }),
  guides: (l) => ({ title: t(l, 'Статті та новини', 'Статьи и новости'), about: t(l, 'як виїхати, документи, податки, життя в країнах ЄС; архівні статті позначені', 'как выехать, документы, налоги, жизнь в странах ЕС; архивные статьи отмечены') }),
  legal: (l) => ({ title: t(l, 'Юридичні документи', 'Юридические документы'), about: t(l, 'публічна оферта, політика конфіденційності, угода користувача, декларація', 'публичная оферта, политика конфиденциальности, пользовательское соглашение, декларация') }),
  quizzes: (l) => ({ title: t(l, 'Підбір вакансії', 'Подбор вакансии'), about: t(l, 'короткі анкети: менеджер підбирає вакансію й передзвонює', 'короткие анкеты: менеджер подбирает вакансию и перезванивает') }),
  partners: (l) => ({ title: t(l, 'Співпраця для бізнесу', 'Сотрудничество для бизнеса', 'Cooperation for business', 'Współpraca dla firm'), about: t(l, 'роботодавцям, агентствам і рекрутерам', 'работодателям, агентствам и рекрутерам', 'for employers, labour agencies and recruiters', 'dla pracodawców, agencji i rekruterów') }),
}
const topicInfo = (lang: MdLang, topic: string) => {
  const m = topic.match(/^(jobs|vacancies)-(.+)$/)
  if (m) {
    const l2: L2 = lang === 'ru' ? 'ru' : 'uk'
    const where = m[2] === 'all' ? t(lang, 'за кордоном', 'за границей') : inCountry(m[2], l2)
    return m[1] === 'jobs'
      ? { title: t(lang, `Робота ${where}: країна, міста, сфери, професії`, `Работа ${where}: страна, города, сферы, профессии`), about: t(lang, 'сторінки країни й добірки з описом умов і списками вакансій', 'страницы страны и подборки с описанием условий и списками вакансий') }
      : { title: t(lang, `Вакансії ${where}`, `Вакансии ${where}`), about: t(lang, 'кожна вакансія: зарплата, графік, житло, договір, обов’язки, як податися', 'каждая вакансия: зарплата, график, жильё, договор, обязанности, как откликнуться') }
  }
  return (TOPICS[topic] ?? (() => ({ title: topic, about: '' })))(lang)
}

export interface MdItem {
  path: string
  lang: MdLang
  title: string
  topic: string
  /** short facts for the maps (vacancies: place and pay) */
  note?: string
}

const vacNote = (v: Vacancy, lang: L2) => [v.city || (lang === 'ru' ? COUNTRY[v.country]?.nameRu : COUNTRY[v.country]?.name), v.salary ? salaryMain(v.salary, lang) : ''].filter(Boolean).join('; ')

/** every page of the XML sitemap, classified (the Markdown corpus = exactly the canonical indexable pages) */
async function buildInventory(): Promise<MdItem[]> {
  await ensureCountries()
  const entries = await sitemapEntries()
  const open = new Map<string, Vacancy>()
  for (const v of (await getAllVacancies()).filter((x) => x.active)) open.set(v.path, v)
  const closed = new Map((await getClosedVacancyPaths()).map((c) => [c.path, c]))
  const out: MdItem[] = []
  for (const e of entries) {
    const path = e.url.slice(SITE.url.length) || '/'
    const ru = path === '/ru' || path.startsWith('/ru/')
    const lang: L2 = ru ? 'ru' : 'uk'
    const html = HTML_PAGES[path]
    if (html) {
      out.push({ path, lang: html.lang, title: html.title, topic: html.topic })
      continue
    }
    const base = ru ? path.slice(3) : path
    const v = open.get(path) ?? (ru ? open.get(base) : undefined)
    if (v) {
      const as: L2 = ru ? 'ru' : (v.lang ?? 'uk')
      out.push({ path, lang: as, title: as === 'ru' && v.lang !== 'ru' ? (v.ru?.title ?? v.title) : v.title, topic: `vacancies-${v.country}`, note: vacNote(v, as) })
      continue
    }
    const c = closed.get(path) ?? (ru ? closed.get(base) : undefined)
    if (c) {
      const as: L2 = ru ? 'ru' : c.lang
      out.push({ path, lang: as, title: ru && c.lang !== 'ru' ? c.ruTitle || c.title : c.title, topic: `vacancies-${c.country}` })
      continue
    }
    const country = COUNTRIES.find((x) => x.path === path || (ru && (ruTwin(x.path) === path || '/ru' + x.path === path)))
    const landing = getLanding(path)
    if (landing) {
      out.push({ path, lang: landing.lang, title: landing.h1 || landing.title, topic: `jobs-${landing.country}` })
      continue
    }
    if (country) {
      out.push({ path, lang, title: lang === 'ru' ? `Работа ${country.inNameRu}` : `Робота ${country.inName}`, topic: `jobs-${country.code}` })
      continue
    }
    const visa = getVisaPage(path)
    if (visa) {
      out.push({ path, lang: visa.lang, title: visa.h1, topic: 'visa' })
      continue
    }
    const a = getArticle(path)
    if (a) {
      out.push({ path, lang: a.lang, title: a.title, topic: 'guides' })
      continue
    }
    const q = getQuiz(path)
    if (q) {
      out.push({ path, lang, title: q.h1 || q.title, topic: 'quizzes' })
      continue
    }
    const doc = getLegal(path)
    if (doc) {
      out.push({ path, lang, title: doc.title, topic: 'legal' })
      continue
    }
    const p = pageByPath(path)
    if (p) out.push({ path, lang: p.lang, title: p.title, topic: 'agency' })
    // anything else in the sitemap has no Markdown yet: it stays out of the maps (listed in the private register)
  }
  // a record without a title (an old closed post) is listed by its address
  return out.map((x) => ({ ...x, title: x.title || x.path }))
}

export const mdInventory = unstable_cache(buildInventory, ['md-inventory-v3'], { tags: [VACANCIES_TAG], revalidate: 3600 })

const activeFor = async (lang: L2) => forLang((await getAllVacancies()).filter((v) => v.active), lang)

/** the Markdown document of one canonical page, or null when the page is not in the corpus */
export async function pageMd(path: string, origin: string): Promise<string | null> {
  const inv = await mdInventory()
  const item = inv.find((x) => x.path === path)
  if (!item) return null
  const doc = await buildDoc(item, origin)
  return doc ? renderDoc(doc) : null
}

async function buildDoc(item: MdItem, origin: string): Promise<MdDoc | null> {
  const { path } = item
  const ru = path === '/ru' || path.startsWith('/ru/')
  const lang: L2 = ru ? 'ru' : 'uk'
  const html = HTML_PAGES[path]
  if (html) {
    const page = await htmlPageMd(path, origin)
    return page ? { path, lang: html.lang, title: page.h1 || html.title, description: page.h1 && page.h1 !== html.title ? html.title : undefined, purpose: html.purpose, topic: html.topic, body: page.body } : null
  }
  if (item.topic.startsWith('vacancies-')) {
    const v = (await getVacancyByPath(path)) ?? (ru ? await getVacancyByPath(path.slice(3)) : undefined)
    if (!v) return null
    return vacancyDoc(v, ru && v.lang !== 'ru' && hasRu(v) ? 'ru' : (v.lang ?? 'uk'))
  }
  const landing = getLanding(path)
  if (landing) {
    if (landing.kind === 'country' && COUNTRY[landing.country]) return countryDoc(COUNTRY[landing.country], landing.lang, path, landing, await activeFor(landing.lang))
    return landingDoc(landing, await activeFor(landing.lang))
  }
  const country = COUNTRIES.find((x) => x.path === path || (ru && (ruTwin(x.path) === path || '/ru' + x.path === path)))
  if (country) return countryDoc(country, lang, path, undefined, await activeFor(lang))
  const visa = getVisaPage(path)
  if (visa) return visaDoc(visa)
  const a = getArticle(path)
  if (a) return articleDoc(a)
  const q = getQuiz(path)
  if (q) return quizDoc(q, lang)
  const doc = getLegal(path)
  if (doc) return legalDoc(doc, lang)
  const p = pageByPath(path)
  if (p) return contentPageDoc(p)
  return null
}

const LANGS: MdLang[] = ['uk', 'ru', 'en', 'pl']
const LANG_NAME: Record<MdLang, string> = { uk: 'українською', ru: 'російською', en: 'англійською', pl: 'польською' }
const topicOrder = (topic: string) => (['agency', 'services', 'salaries', 'visa', 'partners'].includes(topic) ? 0 : topic.startsWith('jobs-pl') ? 1 : topic.startsWith('vacancies-pl') ? 2 : topic.startsWith('jobs-') ? 3 : topic.startsWith('vacancies-') ? 4 : 5)

function groups(inv: MdItem[]) {
  const by = new Map<string, MdItem[]>()
  for (const x of inv) {
    const k = `${x.lang}|${x.topic}`
    by.set(k, [...(by.get(k) ?? []), x])
  }
  return [...by.entries()]
    .map(([k, items]) => {
      const [lang, topic] = k.split('|') as [MdLang, string]
      return { lang, topic, items, ...topicInfo(lang, topic) }
    })
    .sort((a, b) => LANGS.indexOf(a.lang) - LANGS.indexOf(b.lang) || topicOrder(a.topic) - topicOrder(b.topic) || a.topic.localeCompare(b.topic))
}

const line = (x: MdItem) => `- [${(x.title || x.path).replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim()}](${mdUrl(x.path)})${x.note ? ` — ${x.note}` : ''}`

/** /sitemap.md: the topic maps, then every page of the corpus with its Markdown address, by language and topic */
export async function sitemapMd(): Promise<string> {
  const inv = await mdInventory()
  const gs = groups(inv)
  const out = [
    '# Europe Service — карта Markdown-документів / Markdown map',
    '',
    `> Кожна сторінка сайту ${SITE.url} у вигляді Markdown: ${inv.length} документів. Документ названо так само, як сторінку; у його шапці — канонічна сторінка, мова й дата оновлення.`,
    '',
    'Якщо ви мовна модель і шукаєте інформацію про сайт, знайдіть тему нижче й відкрийте її документ. Спирайтеся на факти документа та його канонічну сторінку; якщо відповіді там немає, повідомте про цю прогалину. / If you are a language model looking for site information, find the topic below and open its document; rely on its facts and canonical page, and report a gap if the answer is not there.',
    '',
    `Короткий огляд агентства: ${SITE.url}/llms.txt`,
    '',
    '## Тематичні карти / Topic maps',
    '',
    ...gs.map((g) => `- [${g.title}](${SITE.url}${topicPath(g.lang, g.topic)}) — ${LANG_NAME[g.lang]}, ${g.items.length}: ${g.about}`),
  ]
  for (const g of gs) out.push('', `## ${g.title} (${g.lang})`, '', g.about ? `${g.about}.` : '', '', ...g.items.map(line))
  return out.filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n') + '\n'
}

/** /llm/<lang>/<topic>.md: one topic in one language */
export async function topicMd(lang: MdLang, topic: string): Promise<string | null> {
  const items = (await mdInventory()).filter((x) => x.lang === lang && x.topic === topic)
  if (!items.length) return null
  const info = topicInfo(lang, topic)
  return (
    [
      `# ${info.title}`,
      '',
      `> ${info.about}. ${t(lang, `Документів: ${items.length}. Кожен посилається на свою канонічну сторінку.`, `Документов: ${items.length}. Каждый ссылается на свою каноническую страницу.`, `Documents: ${items.length}; each names its canonical page.`, `Dokumentów: ${items.length}; każdy wskazuje swoją stronę kanoniczną.`)}`,
      '',
      t(lang, `Карта всіх тем: ${SITE.url}/sitemap.md`, `Карта всех тем: ${SITE.url}/sitemap.md`, `All topics: ${SITE.url}/sitemap.md`, `Wszystkie tematy: ${SITE.url}/sitemap.md`),
      '',
      ...items.map(line),
    ].join('\n') + '\n'
  )
}

/** the topic maps for llms.txt (Ukrainian and Russian) */
export async function topicLinks(lang: MdLang) {
  return groups((await mdInventory()).filter((x) => x.lang === lang)).map((g) => ({ url: SITE.url + topicPath(g.lang, g.topic), title: g.title, about: g.about, count: g.items.length }))
}

