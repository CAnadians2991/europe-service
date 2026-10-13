import Link from 'next/link'
import { SERVICES, type Package } from '@/lib/content'
import { Breadcrumbs } from '@/components/vacancy/CatalogPage'
import { RichText } from './Blocks'
import { CtaBand, Faq, HOME_FAQ, HOME_FAQ_RU } from '@/components/sections/Sections'
import { AddToCart } from '@/components/shop/AddToCart'
import { LeadButton } from '@/components/lead/LeadModal'
import { LicenseStamp } from '@/components/trust/LicenseStamp'
import { JsonLd } from '@/components/seo/JsonLd'
import { servicesLd } from '@/lib/services-ld'
import { PRODUCT, uahPrice } from '@/lib/shop'
import { methods } from '@/lib/pay'
import { ServicesConfigurator, type ConfAddon, type ConfTier } from '@/components/services/ServicesConfigurator'
import { COMPARE, TIERS, type TierId } from '@/components/services/tiers'

type Lang = 'uk' | 'ru'
const fmt = (kop: number) => new Intl.NumberFormat('uk-UA').format(Math.round(kop / 100)).replace(/[   ]/g, ' ') + ' грн'
const MONTHS: Record<TierId, number> = { basic: 1, standard: 6, premium: 12 }

/** questions about the packages themselves (owner, 2026-10-07: switching = pay for the new one, the old one is refunded) */
const SERVICE_FAQ = {
  uk: [
    { q: 'Чи можна перейти на інший пакет?', a: 'Так. Ви оплачуєте новий пакет, а гроші за попередній ми повертаємо. Доплатити лише різницю не можна — тільки так.' },
    { q: 'Що означає безкоштовна заміна вакансії?', a: 'Якщо робота не підійшла, менеджер безкоштовно підбере вам іншу вакансію — протягом 1, 6 або 12 місяців залежно від пакета.' },
    { q: 'Чи потрібно платити за підбір вакансії?', a: 'Ні, підбір вакансії безкоштовний. Пакет — це оформлення й супровід до роботи: квитки, дорога, заміна вакансії. Оплата одна, без підписок.' },
  ],
  ru: [
    { q: 'Можно ли перейти на другой пакет?', a: 'Да. Вы оплачиваете новый пакет, а деньги за предыдущий мы возвращаем. Доплатить только разницу нельзя — только так.' },
    { q: 'Что значит бесплатная замена вакансии?', a: 'Если работа не подошла, менеджер бесплатно подберёт вам другую вакансию — в течение 1, 6 или 12 месяцев в зависимости от пакета.' },
    { q: 'Нужно ли платить за подбор вакансии?', a: 'Нет, подбор вакансии бесплатный. Пакет — это оформление и сопровождение до работы: билеты, дорога, замена вакансии. Оплата одна, без подписок.' },
  ],
}

/** after payment, in the order it happens (the four things a package takes on) */
const AFTER = {
  uk: [
    ['Документи й бронь місця', 'Резюме, реєстрація в роботодавця, бронь місця й договір.'],
    ['Дорога', 'Квиток під вашу вакансію і маршрутний лист з адресою та контактами.'],
    ['Зв’язок і страховка', 'SIM-карта з балансом і страховка для перетину кордону (від «Стандарту»).'],
    ['На роботі', 'Менеджер на зв’язку. Не підійде робота — підберемо іншу безкоштовно: 1, 6 або 12 місяців.'],
  ],
  ru: [
    ['Документы и бронь места', 'Резюме, регистрация у работодателя, бронь места и договор.'],
    ['Дорога', 'Билет под вашу вакансию и маршрутный лист с адресом и контактами.'],
    ['Связь и страховка', 'SIM-карта с балансом и страховка для пересечения границы (от «Стандарта»).'],
    ['На работе', 'Менеджер на связи. Не подойдёт работа — подберём другую бесплатно: 1, 6 или 12 месяцев.'],
  ],
}

function confTiers(lang: Lang): ConfTier[] {
  const tiers = TIERS[lang]
  const pk = SERVICES[lang].packages.slice(0, 3)
  return tiers.map((t, i) => ({
    id: t.id,
    name: t.name,
    badge: t.badge,
    tagline: t.tagline,
    forWhom: t.forWhom,
    months: MONTHS[t.id],
    price: PRODUCT[t.id]?.price ?? uahPrice(pk[i]?.price) ?? 0,
    old: uahPrice(pk[i]?.oldPrice) ?? undefined,
    has: tiers.slice(0, i + 1).flatMap((x) => x.plus),
    more: tiers.slice(i + 1).flatMap((x) => x.plus.map((text) => ({ text, tier: x.name }))),
  }))
}

function confAddons(lang: Lang): ConfAddon[] {
  const uk = lang === 'uk'
  const items: [string, string][] = [
    ['sim-pl', uk ? 'Перші 5 днів безкоштовно: 10 ГБ інтернету' : 'Первые 5 дней бесплатно: 10 ГБ интернета'],
    ['insurance-10', uk ? 'Для перетину кордону' : 'Для пересечения границы'],
  ]
  return items
    .map(([id, note]) => ({ p: PRODUCT[id as keyof typeof PRODUCT], note }))
    .filter((x) => x.p)
    .map(({ p, note }) => ({ id: p.id, title: uk ? p.title : p.titleRu, note, price: p.price, includedIn: ['standard', 'premium'] as TierId[] }))
}

/** one price-list row of the extra services: name and note, price, action */
function PriceRow({ title, note, price, action }: { title: string; note?: string; price: string; action: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
      <div className="col-span-2 min-w-0 sm:col-span-1">
        <p className="text-[16px] font-semibold leading-snug">{title}</p>
        {note && <p className="mt-0.5 text-[14px] leading-snug text-ink-2">{note}</p>}
      </div>
      <p className="num whitespace-nowrap text-[17px] font-semibold">{price}</p>
      <div className="justify-self-end">{action}</div>
    </li>
  )
}

export function ServicesPage({ lang }: { lang: Lang }) {
  const s = SERVICES[lang]
  const uk = lang === 'uk'
  const tiers = confTiers(lang)
  const cmp = COMPARE[lang]
  const pay = methods()
  const online = pay.find((m) => m.id === 'monopay')?.enabled
  const parts = pay.find((m) => m.id === 'monoparts' && m.enabled)
  const payLine = online
    ? uk
      ? `Оплата онлайн: картка, Apple Pay, Google Pay (monobank)${parts ? ' або частинами' : ''}.`
      : `Оплата онлайн: карта, Apple Pay, Google Pay (monobank)${parts ? ' или частями' : ''}.`
    : uk
      ? 'У кошику вкажете контакти — менеджер надішле посилання на оплату карткою.'
      : 'В корзине укажете контакты — менеджер пришлёт ссылку на оплату картой.'
  // Tilda's line under the packages (one-to-one), its link to the language's offer
  const noteText = (s.notes?.[0] ?? '').replace('](/oferta)', uk ? '](/oferta)' : '](/ru/oferta)')
  const from = Math.min(...tiers.map((t) => t.price))
  const pk = s.packages
  const insOwn = pk.find((p) => /Наш страхов/.test(p.title))
  const abroad = pk.filter((p) => /Переоформ/.test(p.title))
  const addon = (id: 'sim-pl' | 'insurance-10') => PRODUCT[id]
  const cityOf = (p: Package) => p.title.replace(/^Переоформлення документів для роботи |^Переоформление документов для работы /, '').replace(/^в /, '').replace(/^./, (c) => c.toUpperCase())

  return (
    <>
      <JsonLd data={servicesLd(lang)} />
      <div className="container-x pt-2 text-ink-2">
        <Breadcrumbs items={[{ name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' }, { name: uk ? 'Послуги' : 'Услуги', path: uk ? '/poslugi' : '/ru/services' }]} />
      </div>

      {/* ── head: the gradient plane with the three numbers that matter ── */}
      <section className="container-x pt-3" aria-labelledby="svc-h">
        <div className="brand-band relative overflow-hidden px-6 pb-24 pt-8 text-white sm:px-10 sm:pb-28 sm:pt-12 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white/75">{uk ? 'Послуги та ціни' : 'Услуги и цены'}</p>
              <h1 id="svc-h" className="mt-3 max-w-xl text-balance text-[32px] leading-[1.05] text-white sm:text-[48px]">
                {uk ? 'Пакети послуг з працевлаштування' : 'Пакеты услуг по трудоустройству'}
              </h1>
              <p className="mt-4 max-w-lg text-[16.5px] leading-relaxed text-white/90 sm:text-[18px]">
                {uk
                  ? 'Вакансію підбираємо безкоштовно. Платите один раз — за оформлення й супровід до роботи.'
                  : 'Вакансию подбираем бесплатно. Платите один раз — за оформление и сопровождение до работы.'}
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/25">
              {(
                [
                  ['', '0', 'грн', uk ? 'підбір вакансії' : 'подбор вакансии'],
                  [uk ? 'від' : 'от', String(Math.round(from / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), 'грн', uk ? 'оплата один раз' : 'оплата один раз'],
                  ['до', '12', uk ? 'міс.' : 'мес.', uk ? 'безкоштовної заміни вакансії' : 'бесплатной замены вакансии'],
                ] as const
              ).map(([pre, n, unit, t]) => (
                <div key={t} className="flex flex-col justify-end bg-[#1d7f49]/60 px-3 py-4 backdrop-blur-[2px] sm:px-5 sm:py-5">
                  <dt className="order-2 mt-2 text-[12.5px] leading-snug text-white/85 sm:text-[14px]">{t}</dt>
                  <dd className="order-1">
                    <span className="block h-4 text-[12.5px] font-semibold text-white/80 sm:text-[13px]">{pre}</span>
                    <span className="num font-display text-[24px] font-semibold leading-none tracking-[-0.03em] min-[400px]:text-[28px] sm:text-[44px]">{n}</span>
                    <span className="ml-1 text-[13px] font-semibold sm:text-[17px]">{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── the scale and the receipt, on a sheet that overlaps the plane ── */}
      <section className="container-x relative -mt-16 sm:-mt-20" aria-label={uk ? 'Оберіть пакет' : 'Выберите пакет'}>
        <div className="rounded-[22px] border border-line bg-cream p-4 shadow-[var(--shadow-lift)] sm:p-8 lg:p-10">
          <ServicesConfigurator
            lang={lang}
            tiers={tiers}
            addons={confAddons(lang)}
            payLine={payLine}
            note={<RichText text={noteText} />}
            stamp={<LicenseStamp lang={lang} uid="svc" className="size-full" />}
          />
        </div>
      </section>

      {/* ── the difference at a glance ── */}
      <section className="container-x py-14" aria-labelledby="cmp-h">
        <h2 id="cmp-h" className="text-[26px] sm:text-[34px]">
          {uk ? 'Чим відрізняються пакети' : 'Чем отличаются пакеты'}
        </h2>
        <div className="mt-6">
          <table className="w-full table-fixed border-collapse text-[13.5px] sm:text-[15px]">
            <thead>
              <tr>
                <th className="w-[31%] border-b-2 border-ink py-3 text-left text-[13px] font-semibold uppercase tracking-[0.06em] text-muted sm:w-[34%]" scope="col">
                  <span className="sr-only">{uk ? 'Що входить' : 'Что входит'}</span>
                </th>
                {tiers.map((t) => (
                  <th key={t.id} scope="col" className={`border-b-2 border-ink px-1.5 py-3 text-left sm:px-3 ${t.id === 'standard' ? 'bg-brand-50' : ''}`}>
                    <span className="block font-display text-[15px] font-semibold tracking-[-0.01em] sm:text-[19px]">{t.name}</span>
                    <span className="num block text-[12.5px] font-medium text-ink-2 sm:text-[14px]">{fmt(t.price)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* the replacement period as bars on the same 12-month scale */}
              <tr>
                <th scope="row" className="border-b border-line py-3.5 pr-2 text-left font-semibold sm:pr-4">
                  {cmp.diff[0][0]}
                </th>
                {tiers.map((t) => (
                  <td key={t.id} className={`border-b border-line px-1.5 py-3.5 sm:px-3 ${t.id === 'standard' ? 'bg-brand-50' : ''}`}>
                    <span className="num font-semibold">{cmp.diff[0][1][tiers.indexOf(t)] as string}</span>
                    <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-surface" aria-hidden>
                      <span className="svc-bar block h-full rounded-full" style={{ width: `${(t.months / 12) * 100}%` }} />
                    </span>
                  </td>
                ))}
              </tr>
              {cmp.diff.slice(1).map(([label, vals]) => (
                <tr key={label}>
                  <th scope="row" className="border-b border-line py-3.5 pr-2 text-left font-medium sm:pr-4">
                    {label}
                  </th>
                  {vals.map((v, i) => (
                    <td key={i} className={`border-b border-line px-1.5 py-3.5 sm:px-3 ${i === 1 ? 'bg-brand-50' : ''}`}>
                      {v === true ? (
                        <span className="text-brand-700">
                          <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={uk ? 'так' : 'да'}>
                            <path d="m4.5 10.5 3.5 3.5 7.5-8" />
                          </svg>
                        </span>
                      ) : v === false ? (
                        <span className="text-muted" aria-label={uk ? 'ні' : 'нет'}>
                          —
                        </span>
                      ) : (
                        <span className="font-medium">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-3.5 pr-4 text-left align-top font-medium text-ink-2">
                  {uk ? 'В усіх пакетах' : 'Во всех пакетах'}
                </th>
                <td colSpan={3} className="px-1.5 py-3.5 text-ink-2 sm:px-3">
                  {cmp.common.join(' · ')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── after payment: what happens, in order ── */}
      <section className="border-y border-line bg-white" aria-labelledby="after-h">
        <div className="container-x py-14">
          <h2 id="after-h" className="text-[26px] sm:text-[34px]">
            {uk ? 'Що відбувається після оплати' : 'Что происходит после оплаты'}
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {AFTER[lang].map(([h, t], i) => (
              <li key={h} className="relative">
                <span className="flex items-center gap-3" aria-hidden>
                  <span className="num grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[14px] font-semibold text-white">{i + 1}</span>
                  <span className={`h-[3px] flex-1 ${i < 3 ? 'rule-grad' : 'bg-transparent'}`} />
                </span>
                <h3 className="mt-4 text-[18px]">{h}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── extra services (Tilda's headings of these groups kept) ── */}
      <section className="container-x py-14" aria-labelledby="extras-h">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <h2 id="extras-h" className="text-[26px] sm:text-[34px]">
              {uk ? 'Послуги Europe Service' : 'Услуги Europe Service'}
            </h2>
            <p className="mt-2 text-[15.5px] text-ink-2">{uk ? 'До будь-якого пакета або окремо.' : 'К любому пакету или отдельно.'}</p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {(['sim-pl', 'insurance-10'] as const).map((id) => {
                const p = addon(id)
                if (!p) return null
                return (
                  <PriceRow
                    key={id}
                    title={uk ? p.title : p.titleRu}
                    note={id === 'sim-pl' ? (uk ? 'Перші 5 днів безкоштовно: 10 ГБ інтернету · уже є у «Стандарті» й «Преміумі»' : 'Первые 5 дней бесплатно: 10 ГБ интернета · уже есть в «Стандарте» и «Премиуме»') : uk ? 'Для перетину кордону · уже є у «Стандарті» й «Преміумі»' : 'Для пересечения границы · уже есть в «Стандарте» и «Премиуме»'}
                    price={fmt(p.price)}
                    action={
                      <AddToCart id={p.id} title={p.title} price={p.price} multiple lang={lang} className="btn-ghost !min-h-11 !px-4 !text-[14.5px]">
                        {uk ? 'Додати' : 'Добавить'}
                      </AddToCart>
                    }
                  />
                )
              })}
              {insOwn && (
                <PriceRow
                  title={uk ? 'Страховий поліс на ваш термін' : 'Страховой полис на ваш срок'}
                  note={(insOwn.features ?? []).slice(0, 2).join(' ')}
                  price={`${insOwn.price?.replace('₴ ', '')}${/грн/.test(insOwn.price ?? '') ? '' : ' грн'}`}
                  action={
                    <LeadButton form="invoice:insurance" title={uk ? 'Розрахувати страховку' : 'Рассчитать страховку'} subtitle={insOwn.title} className="btn-ghost !min-h-11 !px-4 !text-[14.5px]">
                      {uk ? 'Розрахувати' : 'Рассчитать'}
                    </LeadButton>
                  }
                />
              )}
            </ul>
          </div>

          <div className="grid content-start gap-8">
            <Link href={uk ? '/robocha-viza-v-polshchu' : '/ru/rabochaya-viza-v-polshu'} className="brand-band group block p-6 text-white sm:p-7">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white/75">{uk ? 'Візовий супровід' : 'Визовое сопровождение'}</p>
              <p className="mt-2 font-display text-[24px] font-semibold leading-tight tracking-[-0.02em]">{uk ? 'Робоча віза в Польщу на рік без прив’язки' : 'Рабочая виза в Польшу на год без привязки'}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-white/90">
                {uk ? 'Допомога з реєстрацією та координація по подачі документів в консульство. Анкета, страховий поліс, запис у візовий центр.' : 'Помощь с регистрацией и координация по подаче документов в консульство. Анкета, страховой полис, запись в визовый центр.'}
              </p>
              <p className="mt-5 flex items-center justify-between gap-4">
                <span className="num font-display text-[28px] font-semibold">15&nbsp;000&nbsp;грн</span>
                <span className="font-semibold underline decoration-white/50 underline-offset-4 group-hover:decoration-white">{uk ? 'Детальніше' : 'Подробнее'}</span>
              </p>
            </Link>
            {abroad.length > 0 && (
              <div>
                <h3 className="text-[19px] leading-snug">{uk ? 'Послуги інші країни Європи: Німеччина, Нідерланди, Греція' : 'Услуги другие страны Европы: Германия, Нидерланды, Греция'}</h3>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {abroad.map((p) => (
                    <PriceRow
                      key={p.title}
                      title={cityOf(p)}
                      note={uk ? 'Підбір вакансії, маршрут, квитки, супровід' : 'Подбор вакансии, маршрут, билеты, сопровождение'}
                      price={p.price ?? ''}
                      action={
                        <LeadButton form={`invoice:${p.title}`} title={uk ? 'Дізнатися ціну' : 'Узнать цену'} subtitle={p.title} className="btn-ghost !min-h-11 !px-4 !text-[14.5px]">
                          {uk ? 'Рахунок' : 'Счёт'}
                        </LeadButton>
                      }
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <Faq items={[...(uk ? SERVICE_FAQ.uk : SERVICE_FAQ.ru), ...(uk ? HOME_FAQ : HOME_FAQ_RU)]} lang={lang} />
      <CtaBand lang={lang} form={uk ? 'services-bottom' : 'services-bottom-ru'} title={uk ? 'Не знаєте, який пакет обрати?' : 'Не знаете, какой пакет выбрать?'} text={uk ? 'Залиште номер — менеджер порадить оптимальний варіант під вашу вакансію та документи.' : 'Оставьте номер — менеджер подскажет оптимальный вариант под вашу вакансию и документы.'} />
    </>
  )
}
