import 'server-only'
import { COUNTRY, GENDERS, SITE, type CountryInfo } from '@/lib/site'
import { salaryHour, salaryMain } from '@/lib/format'
import { localize } from '@/lib/vacancy-i18n'
import { countryLanding, countrySeo, landingList, LANDINGS, type LandingPage } from '@/lib/landing'
import type { Article, Block, ContentPage } from '@/lib/content'
import type { VisaPage } from '@/lib/visa'
import type { QuizLanding } from '@/lib/quizzes'
import type { Vacancy } from '@/lib/types'
import { blocksMd, faqMd, mdUrl, rich, topicPath, type MdDoc } from './core'

type L2 = 'uk' | 'ru'
const t = (lang: L2, uk: string, ru: string) => (lang === 'ru' ? ru : uk)
const countryName = (code: string, lang: L2) => (lang === 'ru' ? COUNTRY[code]?.nameRu : COUNTRY[code]?.name) ?? code
export const inCountry = (code: string, lang: L2) => (lang === 'ru' ? COUNTRY[code]?.inNameRu : COUNTRY[code]?.inName) ?? code

/** the way to apply, as on every vacancy page (form + free phone) and the paid part as on /poslugi */
const howToApply = (lang: L2, url: string) =>
  t(
    lang,
    `## Як податися\n\nЗалиште заявку на сторінці вакансії (${url}) або зателефонуйте ${SITE.phoneDisplay} — безкоштовно з усіх операторів України. Консультація й підбір вакансії безкоштовні; оформлення документів і супровід — за пакетами послуг: ${SITE.url}/poslugi`,
    `## Как откликнуться\n\nОставьте заявку на странице вакансии (${url}) или позвоните ${SITE.phoneDisplay} — бесплатно со всех операторов Украины. Консультация и подбор вакансии бесплатны; оформление документов и сопровождение — по пакетам услуг: ${SITE.url}/ru/services`,
  )

/** one line of a vacancy in a list: place and pay, with the link to its Markdown page */
export function vacancyLine(v: Vacancy, lang: L2) {
  const pay = salaryMain(v.salary, lang)
  const bits = [v.city || countryName(v.country, lang), pay && `${pay}${v.salary.net ? t(lang, ' на руки', ' на руки') : ''}`, v.housingFree ? t(lang, 'житло безкоштовне', 'жильё бесплатное') : v.housing ? t(lang, 'житло надається', 'жильё предоставляется') : ''].filter(Boolean)
  return `- [${v.title}](${mdUrl(v.path)}) — ${bits.join('; ')}`
}

export function vacancyDoc(v0: Vacancy, as: L2): MdDoc {
  const lang = as
  const v = lang === 'ru' && v0.lang !== 'ru' ? localize(v0, 'ru') : v0
  const place = [v.city, countryName(v.country, lang)].filter(Boolean).join(', ')
  const month = salaryMain(v.salary, lang)
  const hour = salaryHour(v.salary, lang)
  const net = v.salary.unlabelled ? '' : v.salary.net ? t(lang, ' (нетто, на руки)', ' (нетто, на руки)') : t(lang, ' (брутто)', ' (брутто)')
  const genders = v.genders?.length ? v.genders.map((g) => GENDERS.find((x) => x.code === g)?.[lang === 'ru' ? 'shortRu' : 'short']).filter(Boolean).join(', ') : ''
  const facts = [
    [t(lang, 'Країна, місто', 'Страна, город'), place],
    [t(lang, 'Роботодавець', 'Работодатель'), v.company],
    [t(lang, 'Зарплата', 'Зарплата'), month ? month + net + (hour && hour !== month ? ` · ${hour}` : '') : ''],
    [t(lang, 'Зарплата в оголошенні', 'Зарплата в объявлении'), v.salary.text && v.salary.text !== month ? v.salary.text : ''],
    [t(lang, 'Графік', 'График'), v.schedule],
    [t(lang, 'Договір', 'Договор'), v.contract],
    [t(lang, 'Житло', 'Жильё'), [v.housing, v.housingFree ? t(lang, 'безкоштовне', 'бесплатное') : ''].filter(Boolean).join(' — ')],
    [t(lang, 'Кого запрошують', 'Кого приглашают'), genders],
    [t(lang, 'Без знання мови', 'Без знания языка'), v.noLanguage ? t(lang, 'так', 'да') : ''],
    [t(lang, 'Без досвіду', 'Без опыта'), v.noExperience ? t(lang, 'так', 'да') : ''],
  ].filter(([, x]) => x && String(x).trim())
  const parts = [
    facts.map(([k, x]) => `- **${k}:** ${String(x).replace(/\s*\n\s*/g, ' ')}`).join('\n'),
    v.headline ? `**${v.headline.trim()}**` : '',
    v.intro?.trim() ? rich(v.intro.trim()) : '',
    ...(v.sections ?? []).filter((s) => s.items?.length).map((s) => `## ${s.title}\n\n${s.items.map((i) => `- ${rich(i.replace(/\s*\n\s*/g, ' '))}`).join('\n')}`),
    v.housingNote ? `## ${t(lang, 'Житло', 'Жильё')}\n\n${v.housingNote}` : '',
    v.reviews?.length
      ? `## ${t(lang, 'Відгуки працівників', 'Отзывы работников')}\n\n${v.reviews.map((r) => `> ${r.text.replace(/\s*\n\s*/g, ' ')}\n>\n> — ${r.name}${r.date ? `, ${r.date}` : ''}`).join('\n\n')}`
      : '',
    v.videos?.length ? `## ${t(lang, 'Відео з місця роботи', 'Видео с места работы')}\n\n${v.videos.map((id) => `- https://www.youtube.com/watch?v=${id}`).join('\n')}` : '',
    howToApply(lang, SITE.url + v.path),
  ]
  return {
    path: v.path,
    lang,
    title: v.title,
    description: [place, month].filter(Boolean).join(' · '),
    purpose: t(lang, `вакансія ${inCountry(v.country, lang)}: зарплата, графік, житло, договір, обов'язки, як податися`, `вакансия ${inCountry(v.country, lang)}: зарплата, график, жильё, договор, обязанности, как откликнуться`),
    topic: `vacancies-${v.country}`,
    updated: v.updatedAt,
    body: parts.filter(Boolean).join('\n\n'),
  }
}

export function articleDoc(a: Article): MdDoc {
  const date = a.datePublished || a.date || undefined
  return {
    path: a.path,
    lang: a.lang,
    title: a.title,
    purpose: t(a.lang, 'стаття Europe Service про роботу й життя за кордоном', 'статья Europe Service о работе и жизни за границей'),
    topic: 'guides',
    updated: date ?? undefined,
    body: [
      date ? t(a.lang, `Опубліковано: ${date.slice(0, 10)}`, `Опубликовано: ${date.slice(0, 10)}`) : '',
      a.outdated && a.outdatedNote ? `> ${a.outdatedNote}` : a.outdated ? t(a.lang, '> Архівна стаття: правила з того часу могли змінитися.', '> Архивная статья: правила с того времени могли измениться.') : '',
      blocksMd(a.blocks),
      faqMd(a.faq, a.lang),
    ]
      .filter(Boolean)
      .join('\n\n'),
  }
}

const shownQuestions = (blocks: Block[]) => new Set(blocks.flatMap((b) => (b.type === 'details' ? [b.summary.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')] : [])))
/** the landing's FAQ unless its Tilda text already has the same questions (as the HTML page does) */
function landingFaq(l: { blocks: Block[]; faq?: { q: string; a: string }[] }, lang: L2) {
  if (!l.faq?.length) return ''
  const shown = shownQuestions(l.blocks)
  return l.faq.every((f) => shown.has(f.q.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ''))) ? '' : faqMd(l.faq, lang)
}

function vacancyList(list: Vacancy[], lang: L2, title: string) {
  return list.length ? `## ${title} (${list.length})\n\n${list.map((v) => vacancyLine(lang === 'ru' && v.lang !== 'ru' ? localize(v, 'ru') : v, lang)).join('\n')}` : ''
}

export function landingDoc(l: LandingPage, active: Vacancy[]): MdDoc {
  const lang = l.lang
  const { list, narrowed } = landingList(l, active)
  // a landing without its own filter shows the whole country's (or every) catalog: the topic map lists it once
  const all = l.country === 'all' ? t(lang, 'усі вакансії за країнами', 'все вакансии по странам') : t(lang, `усі вакансії ${inCountry(l.country, lang)}`, `все вакансии ${inCountry(l.country, lang)}`)
  const catalog = narrowed ? vacancyList(list, lang, t(lang, 'Вакансії', 'Вакансии')) : `## ${t(lang, 'Вакансії', 'Вакансии')}\n\n${t(lang, 'Список', 'Список')} — ${all}: ${l.country === 'all' ? `${SITE.url}/sitemap.md` : SITE.url + topicPath(lang, `vacancies-${l.country}`)}`
  return {
    path: l.path,
    lang,
    title: l.h1 || l.title,
    description: l.intro || l.description,
    purpose: l.country === 'all' ? t(lang, 'добірка вакансій за кордоном', 'подборка вакансий за границей') : t(lang, `добірка вакансій ${inCountry(l.country, lang)} з описом умов`, `подборка вакансий ${inCountry(l.country, lang)} с описанием условий`),
    topic: `jobs-${l.country}`,
    body: [
      blocksMd(l.blocks),
      landingFaq(l, lang),
      catalog,
      l.links?.length ? `## ${t(lang, 'Дивіться також', 'Смотрите также')}\n\n${l.links.filter((x) => x.href.startsWith('/')).map((x) => `- [${x.label}](${mdUrl(x.href)})`).join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  }
}

export function countryDoc(c: CountryInfo, lang: L2, path: string, landing: LandingPage | undefined, active: Vacancy[]): MdDoc {
  const own = landing ?? countryLanding(c.code, lang)
  const s = countrySeo(c, lang, own)
  const list = active.filter((v) => v.country === c.code)
  const more = LANDINGS.filter((x) => x.lang === lang && x.country === c.code && x.kind !== 'country' && !x.canonical)
  return {
    path,
    lang,
    title: s.h1,
    description: s.text,
    purpose: t(lang, `робота ${c.inName}: умови, документи, міста й усі вакансії країни`, `работа ${c.inNameRu}: условия, документы, города и все вакансии страны`),
    topic: `jobs-${c.code}`,
    body: [
      own?.blocks?.length ? blocksMd(own.blocks) : s.body.join('\n\n'),
      own ? landingFaq(own, lang) : '',
      vacancyList(list, lang, t(lang, `Вакансії ${c.inName}`, `Вакансии ${c.inNameRu}`)),
      more.length ? `## ${t(lang, 'Міста, сфери й професії', 'Города, сферы и профессии')}\n\n${more.map((x) => `- [${x.h1 || x.title}](${mdUrl(x.path)})`).join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  }
}

export function visaDoc(p: VisaPage): MdDoc {
  const lang = p.lang
  const list = (title: string, xs: string[]) => (xs?.length ? `## ${title}\n\n${xs.map((x) => `- ${rich(x)}`).join('\n')}` : '')
  return {
    path: p.path,
    lang,
    title: p.h1,
    description: p.lead,
    purpose: t(lang, 'послуга візового супроводу: ціна, що входить, кроки, документи, строки', 'услуга визового сопровождения: цена, что входит, шаги, документы, сроки'),
    topic: 'visa',
    updated: p.updated.split('.').reverse().join('-'),
    body: [
      `## ${p.price.title}\n\n**${p.price.amount}** — ${p.price.note}\n\n${p.price.items.map((x) => `- ${rich(x)}`).join('\n')}`,
      p.facts?.length ? p.facts.map(([k, v]) => `- **${k}:** ${v}`).join('\n') : '',
      p.scheme?.nodes?.length ? `## ${p.scheme.title}\n\n${p.scheme.nodes.map((n) => `- **${n.title}** — ${n.text}`).join('\n')}` : '',
      p.steps?.length ? `## ${t(lang, 'Кроки', 'Шаги')}\n\n${p.steps.map((s, i) => `${i + 1}. **${s.title}**${s.time ? ` (${s.time})` : ''} — ${rich(s.text)}`).join('\n')}` : '',
      list(t(lang, 'Що робимо ми', 'Что делаем мы'), p.weDo),
      list(t(lang, 'Що робите ви', 'Что делаете вы'), p.youDo),
      list(t(lang, 'Документи', 'Документы'), p.docs),
      list(t(lang, 'Оплачується окремо', 'Оплачивается отдельно'), p.separately),
      list(t(lang, 'Кому підходить', 'Кому подходит'), p.forWhom),
      p.honest?.items?.length ? list(p.honest.title, p.honest.items) : '',
      blocksMd(p.blocks),
      faqMd(p.faq, lang),
      p.links?.length ? `## ${t(lang, 'Дивіться також', 'Смотрите также')}\n\n${p.links.map((x) => `- [${x.label}](${x.href.startsWith('/') ? mdUrl(x.href) : x.href})`).join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  }
}

export function quizDoc(q: QuizLanding, lang: L2): MdDoc {
  return {
    path: q.path,
    lang,
    title: q.h1 || q.title,
    description: q.subtitle,
    purpose: t(lang, 'коротка анкета для підбору вакансії (менеджер передзвонює)', 'короткая анкета для подбора вакансии (менеджер перезванивает)'),
    topic: 'quizzes',
    body: [q.description, q.bullets?.length ? q.bullets.map((b) => `- ${b}`).join('\n') : '', t(lang, `Анкета заповнюється на сторінці ${SITE.url}${q.path}; телефон ${SITE.phoneDisplay}.`, `Анкета заполняется на странице ${SITE.url}${q.path}; телефон ${SITE.phoneDisplay}.`)]
      .filter(Boolean)
      .join('\n\n'),
  }
}

export function legalDoc(d: { path: string; title: string; blocks: Block[] }, lang: L2): MdDoc {
  return { path: d.path, lang, title: d.title, purpose: t(lang, 'юридичний документ Europe Service', 'юридический документ Europe Service'), topic: 'legal', body: blocksMd(d.blocks) }
}

export function contentPageDoc(p: ContentPage): MdDoc {
  return { path: p.path, lang: p.lang, title: p.title, purpose: t(p.lang, 'сторінка про агентство Europe Service', 'страница об агентстве Europe Service'), topic: 'agency', body: blocksMd(p.blocks) }
}
