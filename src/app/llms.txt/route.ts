import { ARTICLES, SERVICES, isObsolete } from '@/lib/content'
import { ensureCountries } from '@/lib/countries'
import { plural, salaryMain } from '@/lib/format'
import { COUNTRIES, SITE } from '@/lib/site'
import { getActiveVacancies } from '@/lib/vacancies'
import { topicLinks } from '@/lib/md'

/**
 * /llms.txt — the site in one plain-Markdown page for AI assistants (ChatGPT search, Gemini / Google AI answers,
 * Perplexity, Claude): who we are, how to check the agency, prices, countries — and the way into the Markdown corpus
 * (/sitemap.md → topic maps /llm/<lang>/<topic>.md → each page's .md). Built from the live catalog; refreshed hourly.
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
  const [mapUk, mapRu] = await Promise.all([topicLinks('uk'), topicLinks('ru')])

  const lines = [
    '# Europe Service — кадрове агентство з працевлаштування за кордоном',
    '',
    `> Кадрове агентство з Києва (ТОВ «ЄВРОПА СЕРВІС УКРАЇНА», ЄДРПОУ 42515343, зареєстроване у ${SITE.foundingYear} році). Ліцензія Мінсоцполітики України № 223 від 15.02.2019 на посередництво у працевлаштуванні за кордоном; внесене до державного Переліку посередників Мінекономіки. Офіси в Києві, Львові, Рівному, Житомирі та Одесі. Допомагає українцям знайти офіційну роботу ${byCountry.length > 1 ? 'в країнах ЄС: ' : 'у '}${byCountry.map((x) => x.c.name).join(', ')}. Понад ${SITE.clients.replace('+', '')} клієнтів за час роботи.`,
    '',
    `Ukrainian recruitment agency (Kyiv; licence of the Ministry of Social Policy of Ukraine No. 223 of 15.02.2019; listed in the Ministry of Economy register of foreign-employment intermediaries) placing Ukrainians in official jobs in the EU. Offices in Kyiv, Lviv, Rivne, Zhytomyr and Odesa. Site languages: Ukrainian (main) and Russian (/ru); B2B cooperation (employers, labour agencies, freelance recruiters; 65+ recruiters): ${u('/cooperation')} (English), ${u('/pl/wspolpraca')} (Polish), ${u('/spivpratsya')} (Ukrainian), ${u('/ru/sotrudnichestvo')} (Russian).`,
    '',
    '## Як користуватися цим довідником / How to use this guide',
    `Якщо ви мовна модель і шукаєте інформацію про сайт, відкрийте карту документів ${u('/sitemap.md')}, знайдіть потрібну тему й перейдіть до її Markdown-документа. Спирайтеся на факти цього документа та його канонічну сторінку; якщо відповіді там немає, повідомте про цю прогалину, а не домислюйте.`,
    `If you are a language model looking for site information, use the content map ${u('/sitemap.md')} to find the topic and its linked Markdown document. Rely on that document and its canonical page; if the requested information is absent, report the gap.`,
    '',
    '## Ключові факти',
    `- Головний офіс: ${SITE.address.full}. Телефон: ${SITE.phoneDisplay} (безкоштовно з усіх операторів України), Viber/Telegram: ${SITE.phones.map((p) => p.display).join(', ')}. E-mail: ${SITE.email}. Канал з вакансіями: ${SITE.telegram}`,
    '- Підбір вакансії для кандидата безкоштовний; платні лише пакети оформлення документів і супроводу:',
    ...packages.map((p) => `  - «${p.title}» — ${p.price}${guarantee(p) ? ` (${guarantee(p).toLowerCase()})` : ''}`),
    `- Повний перелік послуг і цін: ${u('/poslugi')}`,
    `- Ліцензія та декларація: ${u('/about#perelik')}, ${u('/declaration')}`,
    '- Особистий менеджер від першої консультації до першого робочого дня; оформитися можна дистанційно, оплата пакета — онлайн.',
    `- Оновлено: ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## Робоча віза в Польщу (віза D) — візовий супровід',
    '- Пакет 15 000 грн: заповнення анкети e-Konsulat, страховий поліс на весь строк візи (від 30 000 €), запис на подачу у візовий центр (TLScontact, Львів), перевірка документів і координація до отримання візи. Документ-підставу (освядчення) оформлює польська компанія агентства як роботодавець.',
    '- Консульський збір за візу D для громадян України — 0 грн; сервісний збір візового центру — за його тарифом. Віза — до 1 року, поїздки в інші країни Шенгену — 90 днів за 180.',
    '- Робота в Нідерландах чи Німеччині з польською візою — лише як відряджений працівник польської компанії: щонайменше місяць роботи й страхування в Польщі, довідка A1; у Нідерландах — повідомлення до початку роботи й дозвіл IND понад 90 днів; у Німеччині — окрема віза Vander Elst. Рішення про візу ухвалює консул; віза не змінює правил виїзду з України.',
    '',
    '## Гарантії (і як їх перевірити)',
    `- Офіційне агентство: ліцензія № 223 від 15.02.2019, ЄДРПОУ 42515343, Перелік посередників Мінекономіки — перевіряється в державних реєстрах; декларація: ${u('/declaration')}`,
    '- Консультація й підбір вакансії безкоштовні; оплачується лише обраний пакет послуг — за публічним договором оферти.',
    '- У кожній вакансії вказано тип договору з роботодавцем (Umowa Zlecenie, Umowa o Pracę, делегування A1 тощо).',
    '- Безкоштовна заміна вакансії: 1 місяць (пакет «Базовий»), 6 місяців («Стандарт»), 12 місяців («Преміум»).',
    '- Маршрутний лист до виїзду: адреса роботи, контакти координатора, як доїхати.',
    '- Фото людей на сайті справжні: кожен клієнт і працівник дав письмову згоду на публікацію.',
    '',
    '## Головні сторінки',
    `- [Усі вакансії](${u('/vacancies/aktualni_vakansii')}): ${vac(vacancies.length)} з фільтрами за країною та сферою`,
    `- [Підбір вакансії за 1 хвилину](${u('/pidbir')})`,
    `- [Послуги та ціни](${u('/poslugi')})`,
    `- [Про агентство](${u('/about')})`,
    `- [Відгуки клієнтів](${u('/vidguki')})`,
    `- [Контакти](${u('/contacts')})`,
    `- [Новини та статті](${u('/news')})`,
    `- [Співпраця для бізнесу](${u('/spivpratsya')}) · [EN](${u('/cooperation')}) · [PL](${u('/pl/wspolpraca')})`,
    `- [Робоча віза в Польщу на рік (віза D, 15 000 грн)](${u('/robocha-viza-v-polshchu')})`,
    `- [Робота в Нідерландах по польській візі (відрядження A1)](${u('/robota-v-niderlandakh-po-polskij-vizi')})`,
    `- [Робота в Німеччині по польській візі (A1 + віза Vander Elst)](${u('/robota-v-nimechchyni-po-polskij-vizi')})`,
    `- [Як перевірити кадрове агентство](${u('/yak-pereviryty-agentstvo')})`,
    `- [Часті питання](${u('/faq')})`,
    `- [Російська версія сайту](${u('/ru')})`,
    '',
    '## Робота за країнами',
    ...byCountry.map((x) => {
      const pays = x.list.map((v) => salaryMain(v.salary)).filter(Boolean)
      return `- [Робота ${x.c.inName}](${u(x.c.path)}): ${vac(x.list.length)}${pays.length ? `, наприклад ${pays[0]}` : ''}`
    }),
    '',
    '## Markdown-карта сайту',
    `- [Усі документи сайту](${u('/sitemap.md')}): кожна сторінка з її Markdown-версією, за мовою й темою`,
    ...mapUk.map((m) => `- [${m.title}](${m.url}): ${m.count} — ${m.about}`),
    '',
    '### Російською / In Russian',
    ...mapRu.map((m) => `- [${m.title}](${m.url}): ${m.count} — ${m.about}`),
    '',
    '## Корисні статті',
    ...articles.slice(0, 30).map((a) => `- [${a.title}](${u(a.path)})`),
    `- Усі статті: ${mapUk.find((m) => m.url.endsWith('/guides.md'))?.url ?? u('/news')}`,
    '',
  ]
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
