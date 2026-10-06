import { ARTICLES, SERVICES, isObsolete } from '@/lib/content'
import { ensureCountries } from '@/lib/countries'
import { plural, salaryMain } from '@/lib/format'
import { COUNTRIES, COUNTRY, SITE } from '@/lib/site'
import { getActiveVacancies } from '@/lib/vacancies'

/**
 * /llms.txt — the site in one plain-Markdown page for AI assistants (ChatGPT search, Gemini / Google AI answers,
 * Perplexity, Claude): who we are, how to check the agency, prices, countries and every current vacancy with a link.
 * Built from the live catalog; refreshed hourly.
 */
export const revalidate = 3600

const u = (p: string) => SITE.url + p
const vac = (n: number) => `${n} ${plural(n, ['вакансія', 'вакансії', 'вакансій'])}`

export async function GET() {
  await ensureCountries()
  const vacancies = await getActiveVacancies()
  const byCountry = COUNTRIES.map((c) => ({ c, list: vacancies.filter((v) => v.country === c.code) })).filter((x) => x.list.length)
  const packages = SERVICES.uk.packages.slice(0, 3)
  const guarantee = (p: (typeof packages)[number]) => p.features.find((f) => /заміна вакансії/i.test(f))?.replace(/\.$/, '') ?? ''
  const articles = ARTICLES.filter((a) => a.lang === 'uk' && !isObsolete(a) && !a.outdated)

  const lines = [
    '# Europe Service — кадрове агентство з працевлаштування за кордоном',
    '',
    `> Кадрове агентство з Києва (ТОВ «ЄВРОПА СЕРВІС УКРАЇНА», ЄДРПОУ 42515343, зареєстроване у ${SITE.foundingYear} році). Ліцензія Мінсоцполітики України № 223 від 15.02.2019 на посередництво у працевлаштуванні за кордоном, декларація Мінекономіки. Офіси в Києві, Львові, Рівному, Житомирі та Одесі. Допомагає українцям знайти офіційну роботу ${byCountry.length > 1 ? 'в країнах ЄС: ' : 'у '}${byCountry.map((x) => x.c.name).join(', ')}. Понад ${SITE.clients.replace('+', '')} клієнтів за час роботи.`,
    '',
    `Ukrainian recruitment agency (Kyiv; licence of the Ministry of Social Policy of Ukraine No. 223 of 15.02.2019) placing Ukrainians in official jobs in the EU. Offices in Kyiv, Lviv, Rivne, Zhytomyr and Odesa. Site languages: Ukrainian (main) and Russian (/ru); employers: ${u('/cooperation')} (English).`,
    '',
    '## Ключові факти',
    `- Головний офіс: ${SITE.address.full}. Телефон: ${SITE.phoneDisplay} (безкоштовно з усіх операторів України), Viber/Telegram: ${SITE.phones.map((p) => p.display).join(', ')}. E-mail: ${SITE.email}. Канал з вакансіями: ${SITE.telegram}`,
    '- Підбір вакансії для кандидата безкоштовний; платні лише пакети оформлення документів і супроводу:',
    ...packages.map((p) => `  - «${p.title}» — ${p.price}${guarantee(p) ? ` (${guarantee(p).toLowerCase()})` : ''}`),
    `- Повний перелік послуг і цін: ${u('/poslugi')}`,
    `- Ліцензія та декларація: ${u('/about#perelik')}, ${u('/declaration')}`,
    '- Особистий менеджер від першої консультації до першого робочого дня; оформитися можна дистанційно, оплата пакета — онлайн.',
    '',
    '## Головні сторінки',
    `- [Усі вакансії](${u('/vacancies/all')}): ${vac(vacancies.length)} з фільтрами за країною та сферою`,
    `- [Підбір вакансії за 1 хвилину](${u('/pidbir')})`,
    `- [Послуги та ціни](${u('/poslugi')})`,
    `- [Про агентство](${u('/about')})`,
    `- [Відгуки клієнтів](${u('/vidguki')})`,
    `- [Контакти](${u('/contacts')})`,
    `- [Новини та статті](${u('/news')})`,
    `- [Роботодавцям (англійською)](${u('/cooperation')})`,
    `- [Російська версія сайту](${u('/ru')})`,
    '',
    '## Робота за країнами',
    ...byCountry.map((x) => `- [Робота ${x.c.inName}](${u(x.c.path)}): ${vac(x.list.length)}`),
    '',
    '## Актуальні вакансії',
    ...byCountry.flatMap((x) => [
      '',
      `### ${x.c.name}`,
      ...x.list.map((v) => {
        const pay = salaryMain(v.salary)
        const bits = [v.city || COUNTRY[v.country]?.name, pay && `зарплата ${pay}${v.salary.net ? ' на руки' : ''}`, v.housingFree ? 'житло безкоштовно' : v.housing && 'житло надається'].filter(Boolean)
        return `- [${v.title}](${u(v.path)}) — ${bits.join('; ')}`
      }),
    ]),
    '',
    '## Корисні статті',
    ...articles.map((a) => `- [${a.title}](${u(a.path)})`),
    '',
  ]
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
