import Link from 'next/link'
import { SERVICES } from '@/lib/content'
import { PRODUCT, uahPrice } from '@/lib/shop'
import { methods } from '@/lib/pay'
import { AddToCart } from '@/components/shop/AddToCart'
import { LeadButton } from '@/components/lead/LeadModal'
import { IconCheck } from '@/components/ui/icons'
import { PackagePicker } from './PackagePicker'
import { COMPARE, TIERS, type TierId } from './tiers'

type Lang = 'uk' | 'ru'
const fmt = (kop: number) => new Intl.NumberFormat('uk-UA').format(Math.round(kop / 100)).replace(/[   ]/g, ' ') + ' грн'

function tierPrices(lang: Lang) {
  const pk = SERVICES[lang].packages.slice(0, 3)
  return (['basic', 'standard', 'premium'] as TierId[]).map((id, i) => ({ id, price: PRODUCT[id]?.price ?? uahPrice(pk[i]?.price) ?? 0, old: uahPrice(pk[i]?.oldPrice) ?? undefined }))
}

/** Packages: quick pick, cards («усе з …, плюс»), the difference table. One-time payment, no subscription. */
export function PackagesBlock({ lang }: { lang: Lang }) {
  const uk = lang === 'uk'
  const tiers = TIERS[lang]
  const prices = tierPrices(lang)
  const parts = methods().find((m) => m.id === 'monoparts' && m.enabled)
  const trust = [uk ? 'Ліцензія № 223' : 'Лицензия № 223', uk ? 'Разова оплата, без абонплати' : 'Разовая оплата, без абонплаты', uk ? 'Вакансія безкоштовна' : 'Вакансия бесплатная', ...(parts ? [uk ? 'можна частинами' : 'можно частями'] : [])].join(' · ')
  const rows = tiers.map((t, i) => ({ id: t.id, name: t.name, short: t.pick, price: prices[i].price, old: prices[i].old, badge: t.badge }))
  const cmp = COMPARE[lang]
  return (
    <>
      <section className="container-x grid gap-6 pb-10 pt-4 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start lg:gap-10" aria-labelledby="svc-h">
        <div>
          <h1 id="svc-h" className="text-[26px] leading-tight sm:text-[40px]">
            {uk ? 'Пакети послуг з працевлаштування' : 'Пакеты услуг по трудоустройству'}
          </h1>
          <p className="mt-2 max-w-xl text-[15.5px] leading-relaxed text-ink-2 sm:text-[17px]">
            {uk
              ? 'Вакансію підбираємо безкоштовно. Пакет — це оформлення й супровід до роботи; різниця між пакетами — скільки часу ми безкоштовно замінюємо вакансію, якщо робота не підійде, і що даємо в дорогу.'
              : 'Вакансию подбираем бесплатно. Пакет — это оформление и сопровождение до работы; разница между пакетами — сколько времени мы бесплатно заменяем вакансию, если работа не подойдёт, и что даём в дорогу.'}
          </p>
          <ul className="mt-4 hidden gap-2 text-[14px] text-ink-2 lg:grid">
            {(uk
              ? ['Не підійшла робота — підберемо іншу без доплати', 'Оплата один раз, за договором оферти', 'Не знаєте, що обрати? Підкажемо безкоштовно: 0 800 357 278']
              : ['Не подошла работа — подберём другую без доплаты', 'Оплата один раз, по договору оферты', 'Не знаете, что выбрать? Подскажем бесплатно: 0 800 357 278']
            ).map((x) => (
              <li key={x} className="flex items-start gap-2">
                <IconCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <PackagePicker rows={rows} lang={lang} trust={trust} />
      </section>

      {/* the cards */}
      <section className="container-x pb-12" aria-label={uk ? 'Пакети' : 'Пакеты'}>
        <ul className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
          {tiers.map((t, i) => {
            const p = prices[i]
            const featured = t.id === 'standard'
            return (
              <li key={t.id} id={`pkg-${t.id}`} className={`relative flex scroll-mt-24 flex-col rounded-2xl border bg-white p-5 ${featured ? 'border-brand-600 shadow-[0_20px_50px_-28px_rgb(30_134_74/0.6)] ring-1 ring-brand-600' : 'border-line'}`}>
                {t.badge && <span className={`absolute -top-3 left-5 rounded-full px-3 py-1 text-[12px] font-semibold ${featured ? 'bg-brand-600 text-white' : 'bg-ink text-white'}`}>{t.badge}</span>}
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[22px]">{t.name}</h2>
                  <p className="text-right">
                    {p.old && <span className="num mr-2 text-[14px] text-muted line-through">{fmt(p.old)}</span>}
                    <span className="num text-[24px] font-bold">{fmt(p.price)}</span>
                  </p>
                </div>
                <p className="text-[14px] font-medium text-brand-700">{t.tagline}</p>
                <p className="mt-2 text-[14px] leading-snug text-ink-2">
                  <b className="font-semibold text-ink">{uk ? 'Кому: ' : 'Кому: '}</b>
                  {t.forWhom}
                </p>
                <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-[16px] font-bold text-brand-800">{t.main}</p>
                {t.base && <p className="mt-3 text-[13px] font-semibold text-muted">{t.base}</p>}
                <ul className={`${t.base ? 'mt-1.5' : 'mt-3'} space-y-1.5 text-[14.5px]`}>
                  {t.plus.map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4">
                  <AddToCart id={t.id} title={t.name} price={p.price} lang={lang} className={`${featured ? 'btn-accent' : 'btn-primary'} w-full`}>
                    {uk ? 'Обрати' : 'Выбрать'} «{t.name}» — {fmt(p.price)}
                  </AddToCart>
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50/70 px-3.5 py-2.5 text-[14px] leading-snug text-ink">
          <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-brand-700" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5" />
          </svg>
          <span>
            <b className="font-semibold">{uk ? 'Хочете інший пакет?' : 'Хотите другой пакет?'}</b>{' '}
            {uk ? 'Оплачуєте новий пакет — гроші за попередній повертаємо.' : 'Оплачиваете новый пакет — деньги за предыдущий возвращаем.'}
          </span>
        </p>
        <p className="mt-3 text-[13px] text-muted">
          {uk ? 'Натискаючи «Обрати», ви переходите до кошика; оплата — за умовами ' : 'Нажимая «Выбрать», вы переходите в корзину; оплата — на условиях '}
          <Link href={uk ? '/oferta' : '/ru/oferta'} className="font-semibold text-brand-700 underline underline-offset-2">
            {uk ? 'публічної оферти' : 'публичной оферты'}
          </Link>
          .
        </p>
      </section>

      {/* what's different */}
      <section className="border-y border-line bg-white" aria-labelledby="cmp-h">
        <div className="container-x py-12">
          <h2 id="cmp-h" className="text-[24px] sm:text-[32px]">
            {uk ? 'Чим відрізняються пакети' : 'Чем отличаются пакеты'}
          </h2>
          <div className="mt-5 rounded-2xl border border-line">
            <div className="grid grid-cols-3 overflow-hidden rounded-t-2xl border-b border-line bg-white">
              {tiers.map((t, i) => (
                <div key={t.id} className={`px-2 py-2.5 text-center ${t.id === 'standard' ? 'bg-brand-50' : ''}`}>
                  <p className="text-[14px] font-bold sm:text-[16px]">{t.name}</p>
                  <p className="num text-[12.5px] text-ink-2 sm:text-[14px]">{fmt(prices[i].price)}</p>
                </div>
              ))}
            </div>
            {cmp.diff.map(([label, vals]) => (
              <div key={label} className="border-b border-line last:border-b-0">
                <p className="px-3 pt-2.5 text-[13.5px] font-semibold text-ink sm:text-[14.5px]">{label}</p>
                <div className="grid grid-cols-3 pb-2.5 pt-1">
                  {vals.map((v, i) => (
                    <div key={i} className={`grid place-items-center px-1 text-center text-[13.5px] sm:text-[14.5px] ${i === 1 ? 'font-semibold' : ''}`}>
                      {v === true ? <IconCheck className="size-5 text-brand-600" aria-label="так" /> : v === false ? <span className="text-muted" aria-label="ні">—</span> : v}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <details className="group overflow-hidden rounded-b-2xl border-t border-line bg-surface/50">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3 text-[14px] font-semibold text-brand-700 [&::-webkit-details-marker]:hidden">
                {uk ? 'Є в усіх пакетах' : 'Есть во всех пакетах'} <span className="transition group-open:rotate-180">▾</span>
              </summary>
              <ul className="space-y-1.5 px-3 pb-3 text-[14px]">
                {cmp.common.map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <IconCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
                    {x}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </section>
    </>
  )
}

/** Add-ons (to any package) and services sold on their own */
export function ExtrasBlock({ lang }: { lang: Lang }) {
  const uk = lang === 'uk'
  const pk = SERVICES[lang].packages
  const byTitle = (re: RegExp) => pk.find((p) => re.test(p.title))
  const sim = PRODUCT['sim-pl']
  const ins10 = PRODUCT['insurance-10']
  const insOwn = byTitle(/Наш страхов/)
  const abroad = pk.filter((p) => /Переоформ/.test(p.title))
  // phones: the name on top, price + button on one line under it; one line from sm
  const row = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-b border-line px-4 py-3 last:border-b-0 sm:flex [&>div:first-child]:col-span-2 sm:[&>div:first-child]:flex-1'
  return (
    <section className="container-x py-12" aria-labelledby="extras-h">
      <h2 id="extras-h" className="text-[24px] sm:text-[32px]">
        {uk ? 'Додатково до будь-якого пакета' : 'Дополнительно к любому пакету'}
      </h2>
      <p className="mt-1.5 text-[15px] text-ink-2">{uk ? 'Можна додати в кошик разом із пакетом або окремо.' : 'Можно добавить в корзину вместе с пакетом или отдельно.'}</p>
      <ul className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
        {sim && (
          <li className={row}>
            <div className="min-w-0 flex-1">
              <p className="text-[15.5px] font-semibold">{uk ? sim.title : sim.titleRu}</p>
              <p className="text-[13px] text-ink-2">{uk ? 'Перші 5 днів безкоштовно: 10 ГБ інтернету · вже є у Стандарті й Преміумі' : 'Первые 5 дней бесплатно: 10 ГБ интернета · уже есть в Стандарте и Премиуме'}</p>
            </div>
            <p className="num shrink-0 text-[15px] font-bold">{fmt(sim.price)}</p>
            <AddToCart id={sim.id} title={sim.title} price={sim.price} multiple lang={lang} className="btn-ghost !min-h-10 shrink-0 !px-3 !text-[14px]">
              + {uk ? 'Додати' : 'Добавить'}
            </AddToCart>
          </li>
        )}
        {ins10 && (
          <li className={row}>
            <div className="min-w-0 flex-1">
              <p className="text-[15.5px] font-semibold">{uk ? ins10.title : ins10.titleRu}</p>
              <p className="text-[13px] text-ink-2">{uk ? 'Для перетину кордону · вже є у Стандарті й Преміумі' : 'Для пересечения границы · уже есть в Стандарте и Премиуме'}</p>
            </div>
            <p className="num shrink-0 text-[15px] font-bold">{fmt(ins10.price)}</p>
            <AddToCart id={ins10.id} title={ins10.title} price={ins10.price} multiple lang={lang} className="btn-ghost !min-h-10 shrink-0 !px-3 !text-[14px]">
              + {uk ? 'Додати' : 'Добавить'}
            </AddToCart>
          </li>
        )}
        {insOwn && (
          <li className={row}>
            <div className="min-w-0 flex-1">
              <p className="text-[15.5px] font-semibold">{uk ? 'Страховий поліс на ваш термін' : 'Страховой полис на ваш срок'}</p>
              <p className="text-[13px] text-ink-2">{uk ? 'Медичні витрати до 30 000 €, ціна залежить від терміну' : 'Медицинские расходы до 30 000 €, цена зависит от срока'}</p>
            </div>
            <p className="num shrink-0 text-[15px] font-bold">{insOwn.price?.replace('₴ ', '')}{/грн/.test(insOwn.price ?? '') ? '' : ' грн'}</p>
            <LeadButton form="invoice:insurance" title={uk ? 'Розрахувати страховку' : 'Рассчитать страховку'} subtitle={insOwn.title} className="btn-ghost !min-h-10 shrink-0 !px-3 !text-[14px]">
              {uk ? 'Розрахувати' : 'Рассчитать'}
            </LeadButton>
          </li>
        )}
      </ul>

      <h2 className="mt-10 text-[22px] sm:text-[28px]">{uk ? 'Окремі послуги' : 'Отдельные услуги'}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Link href={uk ? '/robocha-viza-v-polshchu' : '/ru/rabochaya-viza-v-polshu'} className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-ink">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-700">{uk ? 'Візовий супровід' : 'Визовое сопровождение'}</p>
          <p className="mt-1 text-[19px] font-bold leading-snug">{uk ? 'Робоча віза в Польщу на рік без прив’язки' : 'Рабочая виза в Польшу на год без привязки'}</p>
          <p className="mt-1.5 text-[14px] text-ink-2">{uk ? 'Анкета, страховий поліс, запис у візовий центр і координація до візи.' : 'Анкета, страховой полис, запись в визовый центр и координация до визы.'}</p>
          <p className="mt-auto flex items-center justify-between pt-3">
            <span className="num text-[20px] font-bold">15 000 грн</span>
            <span className="font-semibold text-brand-700 group-hover:underline">{uk ? 'Детальніше →' : 'Подробнее →'}</span>
          </p>
        </Link>
        {abroad.length > 0 && (
          <div className="rounded-2xl border border-line bg-white">
            <p className="px-4 pt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-700">{uk ? 'Переоформлення документів' : 'Переоформление документов'}</p>
            <ul>
              {abroad.map((p) => (
                <li key={p.title} className={row}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold">{p.title.replace(/^Переоформлення документів для роботи |^Переоформление документов для работы /, '').replace(/^в /, '').replace(/^./, (c) => c.toUpperCase())}</p>
                    <p className="text-[12.5px] text-ink-2">{uk ? 'підбір вакансії, маршрут, квитки, супровід' : 'подбор вакансии, маршрут, билеты, сопровождение'}</p>
                  </div>
                  <p className="num shrink-0 text-[14.5px] font-bold">{p.price}</p>
                  <LeadButton form={`invoice:${p.title}`} title={uk ? 'Дізнатися ціну' : 'Узнать цену'} subtitle={p.title} className="btn-ghost !min-h-10 shrink-0 !px-3 !text-[13.5px]">
                    {uk ? 'Ціна' : 'Цена'}
                  </LeadButton>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
