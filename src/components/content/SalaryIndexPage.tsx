import Link from 'next/link'
import { PageHero } from '@/components/content/PageHero'
import { CtaBand, Faq } from '@/components/sections/Sections'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbLd, faqLd } from '@/lib/seo'
import { CATEGORY, COUNTRY, SITE } from '@/lib/site'
import { CURRENCY_SIGN, num } from '@/lib/format'
import { localize } from '@/lib/vacancy-i18n'
import { HOURS_PER_MONTH, MIN_GROUP, salaryIndexCached, type Group, type SalaryIndex } from '@/lib/salary-index'
import type { Currency } from '@/lib/types'

type Lang = 'uk' | 'ru'
export const SALARY_PATH = { uk: '/zarplaty', ru: '/ru/zarplaty' } as const

const MONTHS = {
  uk: { nom: ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'], loc: ['січні', 'лютому', 'березні', 'квітні', 'травні', 'червні', 'липні', 'серпні', 'вересні', 'жовтні', 'листопаді', 'грудні'] },
  ru: { nom: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'], loc: ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'] },
}
const monthName = (m: string, lang: Lang, form: 'nom' | 'loc' = 'nom') => {
  const [y, mo] = m.split('-').map(Number)
  return `${MONTHS[lang][form][mo - 1]} ${y}`
}
const money = (x: number | null, c: Currency, per = '') => (x == null ? '—' : `${num(Math.round(x * 100) / 100)} ${CURRENCY_SIGN[c]}${per}`)
const pct = (x: number) => `${Math.round(x * 100)} %`

export function salaryIndexText(ix: SalaryIndex, lang: Lang) {
  const uk = lang === 'uk'
  const pl = ix.countries.find((c) => c.code === 'pl')
  const when = monthName(ix.month, lang, 'loc')
  const title = uk ? `Зарплати українців у Польщі та ЄС у ${when}: індекс вакансій` : `Зарплаты украинцев в Польше и ЕС в ${when}: индекс вакансий`
  const description = uk
    ? `Скільки платять роботодавці в ${when}: ${pl?.hourMedian != null ? `медіана в Польщі ${money(pl.hourMedian, pl.currency, '/год')} нетто, ` : ''}ставки за країнами, сферами й договорами за ${ix.total} актуальними вакансіями Europe Service. Оновлюється щомісяця.`
    : `Сколько платят работодатели в ${when}: ${pl?.hourMedian != null ? `медиана в Польше ${money(pl.hourMedian, pl.currency, '/ч')} нетто, ` : ''}ставки по странам, сферам и договорам по ${ix.total} актуальным вакансиям Europe Service. Обновляется ежемесячно.`
  return { title, description }
}

function faq(ix: SalaryIndex, lang: Lang) {
  const uk = lang === 'uk'
  const pl = ix.countries.find((c) => c.code === 'pl')
  const when = monthName(ix.month, lang, 'loc')
  const wh = ix.plCategories.find((c) => c.category === 'warehouse')
  const zl = ix.plContracts.find((c) => c.contract === 'zlecenie')
  const op = ix.plContracts.find((c) => c.contract === 'o-prace')
  const out: { q: string; a: string }[] = []
  if (pl)
    out.push({
      q: uk ? `Скільки заробляють українці в Польщі в ${when}?` : `Сколько зарабатывают украинцы в Польше в ${when}?`,
      a: uk
        ? `За ${pl.n} актуальними вакансіями Europe Service медіанна ставка — ${money(pl.hourMedian, pl.currency, '/год')} нетто (половина вакансій — від ${money(pl.hourP25, pl.currency)} до ${money(pl.hourP75, pl.currency)}). За ${HOURS_PER_MONTH} годин на місяць це близько ${money(pl.monthMedian, pl.currency)} на руки. Більше годин — більше заробіток: на багатьох вакансіях графік 10–12 годин.`
        : `По ${pl.n} актуальным вакансиям Europe Service медианная ставка — ${money(pl.hourMedian, pl.currency, '/ч')} нетто (половина вакансий — от ${money(pl.hourP25, pl.currency)} до ${money(pl.hourP75, pl.currency)}). За ${HOURS_PER_MONTH} часов в месяц это около ${money(pl.monthMedian, pl.currency)} на руки. Больше часов — больше заработок: на многих вакансиях график 10–12 часов.`,
    })
  if (wh)
    out.push({
      q: uk ? 'Яка зарплата на складі в Польщі?' : 'Какая зарплата на складе в Польше?',
      a: uk
        ? `Медіана по ${wh.n} вакансіях на складах — ${money(wh.hourMedian, wh.currency, '/год')} нетто, близько ${money(wh.monthMedian, wh.currency)} на місяць за ${HOURS_PER_MONTH} годин.`
        : `Медиана по ${wh.n} вакансиям на складах — ${money(wh.hourMedian, wh.currency, '/ч')} нетто, около ${money(wh.monthMedian, wh.currency)} в месяц за ${HOURS_PER_MONTH} часов.`,
    })
  if (zl && op)
    out.push({
      q: uk ? 'Umowa Zlecenie чи Umowa o Pracę: де ставка вища?' : 'Umowa Zlecenie или Umowa o Pracę: где ставка выше?',
      a: uk
        ? `Зараз у вакансіях за Umowa Zlecenie медіана ${money(zl.hourMedian, zl.currency, '/год')} (${zl.n} вакансій), за Umowa o Pracę — ${money(op.hourMedian, op.currency, '/год')} (${op.n}). Umowa o Pracę дає оплачувану відпустку й лікарняні; менеджер пояснить різницю для конкретної вакансії.`
        : `Сейчас в вакансиях по Umowa Zlecenie медиана ${money(zl.hourMedian, zl.currency, '/ч')} (${zl.n} вакансий), по Umowa o Pracę — ${money(op.hourMedian, op.currency, '/ч')} (${op.n}). Umowa o Pracę даёт оплачиваемый отпуск и больничные; менеджер объяснит разницу для конкретной вакансии.`,
    })
  out.push({
    q: uk ? 'Звідки ці цифри й як часто вони оновлюються?' : 'Откуда эти цифры и как часто они обновляются?',
    a: uk
      ? `Це ставки з вакансій, які роботодавці зараз розмістили в Europe Service (${ix.total} вакансій), як їх указано в оголошенні. Сторінка перераховується кілька разів на день, а цифри місяця зберігаються, щоб показати зміну. Це дані агентства, а не всього ринку праці.`
      : `Это ставки из вакансий, которые работодатели сейчас разместили в Europe Service (${ix.total} вакансий), как они указаны в объявлении. Страница пересчитывается несколько раз в день, а цифры месяца сохраняются, чтобы показать изменение. Это данные агентства, а не всего рынка труда.`,
  })
  return out
}

function Delta({ now, before, c }: { now: number | null; before: number | null | undefined; c: Currency }) {
  if (now == null || before == null) return <span className="text-muted">—</span>
  const d = Math.round((now - before) * 100) / 100
  if (!d) return <span className="text-muted">0</span>
  return <span className={d > 0 ? 'text-brand-700' : 'text-ink-2'}>{`${d > 0 ? '+' : '−'}${num(Math.abs(d))} ${CURRENCY_SIGN[c]}`}</span>
}

const th = 'border-b border-line-strong px-3 py-2.5 text-left font-mono text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted'
const td = 'border-b border-line px-3 py-3 align-top'
const tdn = `${td} num whitespace-nowrap`

function GroupRow({ name, g, per, extra }: { name: React.ReactNode; g: Group; per: string; extra?: React.ReactNode }) {
  return (
    <tr>
      <th scope="row" className={`${td} text-left font-semibold text-ink`}>
        {name}
      </th>
      <td className={tdn}>{g.n}</td>
      <td className={`${tdn} font-semibold text-ink`}>{money(g.hourMedian, g.currency, per)}</td>
      <td className={`${tdn} text-ink-2`}>{g.hourP25 != null ? `${num(g.hourP25)}–${money(g.hourP75, g.currency)}` : '—'}</td>
      <td className={tdn}>{money(g.monthMedian, g.currency)}</td>
      {extra}
    </tr>
  )
}

export async function SalaryIndexPage({ lang }: { lang: Lang }) {
  const uk = lang === 'uk'
  const ix = await salaryIndexCached()
  const { description } = salaryIndexText(ix, lang)
  const per = uk ? '/год' : '/ч'
  const pl = ix.countries.find((c) => c.code === 'pl')
  const crumbs = [
    { name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' },
    { name: uk ? 'Індекс зарплат' : 'Индекс зарплат', path: SALARY_PATH[lang] },
  ]
  const items = faq(ix, lang)
  const prev = ix.previous
  const cName = (code: string) => (uk ? COUNTRY[code]?.name : COUNTRY[code]?.nameRu) ?? code
  const cHref = (code: string) => (uk ? COUNTRY[code]?.path : '/ru' + COUNTRY[code]?.path)
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(items)} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: uk ? `Індекс зарплат Europe Service — ${monthName(ix.month, 'uk')}` : `Индекс зарплат Europe Service — ${monthName(ix.month, 'ru')}`,
          description,
          url: SITE.url + SALARY_PATH[lang],
          inLanguage: uk ? 'uk' : 'ru',
          isAccessibleForFree: true,
          temporalCoverage: ix.month,
          dateModified: ix.at,
          creator: { '@id': `${SITE.url}/#org` },
          spatialCoverage: ix.countries.map((c) => ({ '@type': 'Country', name: COUNTRY[c.code]?.name ?? c.code })),
          variableMeasured: [uk ? 'Ставка за годину нетто, медіана' : 'Ставка в час нетто, медиана', uk ? 'Оплата на місяць, медіана' : 'Оплата в месяц, медиана', uk ? 'Частка вакансій з безкоштовним житлом' : 'Доля вакансий с бесплатным жильём'],
          measurementTechnique: uk ? `Ставки з ${ix.total} актуальних вакансій роботодавців; місяць без вказаної суми = ставка × ${HOURS_PER_MONTH} год` : `Ставки из ${ix.total} актуальных вакансий работодателей; месяц без указанной суммы = ставка × ${HOURS_PER_MONTH} ч`,
        }}
      />
      <PageHero
        title={uk ? `Індекс зарплат: ${monthName(ix.month, 'uk')}` : `Индекс зарплат: ${monthName(ix.month, 'ru')}`}
        text={
          uk
            ? `Скільки платять роботодавці українцям за кордоном — за ${ix.total} актуальними вакансіями Europe Service. Ставки нетто, як їх указано у вакансіях; оновлюється щомісяця.`
            : `Сколько платят работодатели украинцам за границей — по ${ix.total} актуальным вакансиям Europe Service. Ставки нетто, как они указаны в вакансиях; обновляется ежемесячно.`
        }
        crumbs={crumbs}
      >
        {pl && (
          <dl className="mt-7 grid max-w-4xl gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
            {[
              [uk ? 'Польща, медіана за годину' : 'Польша, медиана в час', money(pl.hourMedian, pl.currency, per)],
              [uk ? `Польща, ≈ на місяць (${HOURS_PER_MONTH} год)` : `Польша, ≈ в месяц (${HOURS_PER_MONTH} ч)`, money(pl.monthMedian, pl.currency)],
              [uk ? 'Польща, житло безкоштовне' : 'Польша, жильё бесплатное', pct(pl.housingFree)],
            ].map(([k, v]) => (
              <div key={k} className="bg-white px-4 py-4">
                <dt className="text-[13px] text-ink-2">{k}</dt>
                <dd className="num mt-1 text-[24px] font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </PageHero>

      <section className="container-x py-12" aria-labelledby="by-country">
        <p className="eyebrow">{uk ? 'За країнами' : 'По странам'}</p>
        <h2 id="by-country" className="mt-2 text-[26px] sm:text-[32px]">
          {uk ? 'Ставки за країнами' : 'Ставки по странам'}
        </h2>
        <p className="mt-3 max-w-3xl text-ink-2">
          {uk
            ? `Країни, де зараз щонайменше ${MIN_GROUP} вакансій. «Половина вакансій» — від 25-го до 75-го процентиля ставок. ≈ € — для порівняння країн, за приблизним курсом.`
            : `Страны, где сейчас не меньше ${MIN_GROUP} вакансий. «Половина вакансий» — от 25-го до 75-го процентиля ставок. ≈ € — для сравнения стран, по приблизительному курсу.`}
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[15px]">
            <thead>
              <tr>
                <th className={th}>{uk ? 'Країна' : 'Страна'}</th>
                <th className={th}>{uk ? 'Вакансій' : 'Вакансий'}</th>
                <th className={th}>{uk ? 'Медіана за годину' : 'Медиана в час'}</th>
                <th className={th}>{uk ? 'Половина вакансій' : 'Половина вакансий'}</th>
                <th className={th}>{uk ? 'На місяць' : 'В месяц'}</th>
                <th className={th}>≈ €</th>
                <th className={th}>{uk ? 'Житло безкоштовне' : 'Жильё бесплатное'}</th>
                <th className={th}>{uk ? 'Зміна за місяць' : 'За месяц'}</th>
              </tr>
            </thead>
            <tbody>
              {ix.countries.map((c) => (
                <GroupRow
                  key={c.code}
                  name={<Link href={cHref(c.code)} className="underline decoration-line-strong underline-offset-4 hover:text-brand-700">{cName(c.code)}</Link>}
                  g={c}
                  per={per}
                  extra={
                    <>
                      <td className={`${tdn} text-ink-2`}>{c.monthEur != null ? `≈ ${num(c.monthEur)} €` : '—'}</td>
                      <td className={tdn}>{pct(c.housingFree)}</td>
                      <td className={tdn}>
                        <Delta now={c.hourMedian ?? c.monthMedian} before={c.hourMedian != null ? prev?.countries[c.code]?.hourMedian : prev?.countries[c.code]?.monthMedian} c={c.currency} />
                      </td>
                    </>
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13.5px] text-muted">
          {prev
            ? uk
              ? `Зміна — порівняно з ${monthName(prev.month, 'uk', 'loc')} (медіана за годину, а де ставки лише місячні — за місяць).`
              : `Изменение — по сравнению с ${monthName(prev.month, 'ru', 'loc')} (медиана в час, а где ставки только месячные — в месяц).`
            : uk
              ? `Перший випуск індексу. Зміну за місяць покажемо з наступного оновлення.`
              : `Первый выпуск индекса. Изменение за месяц покажем со следующего обновления.`}
        </p>
      </section>

      {ix.plCategories.length > 0 && pl && (
        <section className="border-t border-line bg-white py-12" aria-labelledby="pl-spheres">
          <div className="container-x">
            <p className="eyebrow">{uk ? 'Польща' : 'Польша'}</p>
            <h2 id="pl-spheres" className="mt-2 text-[26px] sm:text-[32px]">
              {uk ? 'Ставки в Польщі за сферою роботи' : 'Ставки в Польше по сфере работы'}
            </h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-[15px]">
                <thead>
                  <tr>
                    <th className={th}>{uk ? 'Сфера' : 'Сфера'}</th>
                    <th className={th}>{uk ? 'Вакансій' : 'Вакансий'}</th>
                    <th className={th}>{uk ? 'Медіана за годину' : 'Медиана в час'}</th>
                    <th className={th}>{uk ? 'Половина вакансій' : 'Половина вакансий'}</th>
                    <th className={th}>{uk ? 'На місяць' : 'В месяц'}</th>
                  </tr>
                </thead>
                <tbody>
                  {ix.plCategories.map((g) => (
                    <GroupRow key={g.category} name={uk ? CATEGORY[g.category].name : CATEGORY[g.category].nameRu} g={g} per={per} />
                  ))}
                </tbody>
              </table>
            </div>
            {ix.plContracts.length > 1 && (
              <>
                <h3 className="mt-10 text-[20px]">{uk ? 'За типом договору' : 'По типу договора'}</h3>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-[15px]">
                    <thead>
                      <tr>
                        <th className={th}>{uk ? 'Договір' : 'Договор'}</th>
                        <th className={th}>{uk ? 'Вакансій' : 'Вакансий'}</th>
                        <th className={th}>{uk ? 'Медіана за годину' : 'Медиана в час'}</th>
                        <th className={th}>{uk ? 'Половина вакансій' : 'Половина вакансий'}</th>
                        <th className={th}>{uk ? 'На місяць' : 'В месяц'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ix.plContracts.map((g) => (
                        <GroupRow key={g.contract} name={g.contract === 'zlecenie' ? 'Umowa Zlecenie' : g.contract === 'o-prace' ? 'Umowa o Pracę' : uk ? 'Інший' : 'Другой'} g={g} per={per} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {ix.plTop.length > 0 && (
              <>
                <h3 className="mt-10 text-[20px]">{uk ? 'Найвищі ставки в Польщі зараз' : 'Самые высокие ставки в Польше сейчас'}</h3>
                <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
                  {ix.plTop.map((r) => {
                    const v = uk ? r.v : localize(r.v, 'ru')
                    return (
                      <li key={r.v.id} className="border-b border-line">
                        <Link href={v.path} className="flex min-h-12 items-center justify-between gap-4 py-2.5 hover:text-brand-700">
                          <span className="min-w-0">
                            <span className="font-medium">{v.title}</span>
                            {v.city && <span className="block text-[13.5px] text-ink-2">{v.city}</span>}
                          </span>
                          <span className="num shrink-0 font-semibold">{money(r.hour, r.currency, per)}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

      <section className="container-x py-12" aria-labelledby="method">
        <p className="eyebrow">{uk ? 'Методика' : 'Методика'}</p>
        <h2 id="method" className="mt-2 text-[26px] sm:text-[32px]">
          {uk ? 'Як ми рахуємо' : 'Как мы считаем'}
        </h2>
        <ul className="mt-5 grid max-w-3xl gap-3 text-[16px] leading-relaxed text-ink-2">
          {(uk
            ? [
                `Джерело — ${ix.total} актуальних вакансій, які роботодавці зараз розмістили в Europe Service. Старі вакансії з архіву не враховуються.`,
                'Ставка — як її вказано у вакансії; діапазон «від–до» рахуємо за серединою. Майже всі ставки — нетто, тобто на руки.',
                `Місяць: сума з вакансії, а якщо там лише ставка за годину — ставка × ${HOURS_PER_MONTH} годин (21 робочий день по 8 годин). При 10–12-годинних змінах заробіток більший.`,
                `Країна, сфера чи договір з'являються в таблиці від ${MIN_GROUP} (сфера й договір — від 3) вакансій. ≈ € — для порівняння, за приблизним курсом.`,
                'Цифри кожного місяця зберігаються, тож таблиця показує зміну за місяць. Це дані агентства, а не статистика всього ринку праці.',
              ]
            : [
                `Источник — ${ix.total} актуальных вакансий, которые работодатели сейчас разместили в Europe Service. Старые вакансии из архива не учитываются.`,
                'Ставка — как она указана в вакансии; диапазон «от–до» считаем по середине. Почти все ставки — нетто, то есть на руки.',
                `Месяц: сумма из вакансии, а если там только ставка в час — ставка × ${HOURS_PER_MONTH} часов (21 рабочий день по 8 часов). При сменах 10–12 часов заработок больше.`,
                `Страна, сфера или договор появляются в таблице от ${MIN_GROUP} (сфера и договор — от 3) вакансий. ≈ € — для сравнения, по приблизительному курсу.`,
                'Цифры каждого месяца сохраняются, поэтому таблица показывает изменение за месяц. Это данные агентства, а не статистика всего рынка труда.',
              ]
          ).map((x) => (
            <li key={x} className="border-l-2 border-brand-300 pl-4">
              {x}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[13.5px] text-muted">
          {uk ? 'Оновлено' : 'Обновлено'}: <time dateTime={ix.at}>{new Date(ix.at).toLocaleDateString(uk ? 'uk-UA' : 'ru-UA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' })}</time>.{' '}
          {uk ? 'Цитуючи, будь ласка, посилайтеся на цю сторінку.' : 'При цитировании, пожалуйста, ссылайтесь на эту страницу.'}
        </p>
      </section>

      <Faq items={items} lang={lang} />
      <CtaBand
        form={`salary-index-${lang}`}
        lang={lang}
        title={uk ? 'Підберемо вакансію з потрібною ставкою' : 'Подберём вакансию с нужной ставкой'}
        text={uk ? 'Залиште заявку — менеджер запропонує вакансії з тією зарплатою, графіком і житлом, які вам підходять.' : 'Оставьте заявку — менеджер предложит вакансии с той зарплатой, графиком и жильём, которые вам подходят.'}
      />
    </>
  )
}
