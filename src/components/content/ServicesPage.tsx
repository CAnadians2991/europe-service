import Link from 'next/link'
import { SERVICES, type Package } from '@/lib/content'
import { Breadcrumbs } from '@/components/vacancy/CatalogPage'
import { RichText } from './Blocks'
import { CtaBand, Faq, HOME_FAQ, HOME_FAQ_RU } from '@/components/sections/Sections'
import { AddToCart } from '@/components/shop/AddToCart'
import { LeadButton } from '@/components/lead/LeadModal'
import { JsonLd } from '@/components/seo/JsonLd'
import { servicesLd } from '@/lib/services-ld'
import { PRODUCT, uahPrice } from '@/lib/shop'
import { IconCheck } from '@/components/ui/icons'
import { PackagePay } from '@/components/services/PackagePay'

// Owner 2026-10-15: «просто опиши пакети як на Personal Work», phones first, nothing said twice.
// Tilda's headings and SEO sentences of this page stay (H1, the offer line, «Послуги Europe Service», the other-countries heading).

type Lang = 'uk' | 'ru'
const fmt = (kop: number) => new Intl.NumberFormat('uk-UA').format(Math.round(kop / 100)).replace(/[   ]/g, ' ') + ' грн'
const IDS = ['basic', 'standard', 'premium'] as const

/** questions about the packages themselves (owner, 2026-10-07: switching = pay for the new one, the old one is refunded) */
const SERVICE_FAQ = {
  uk: [
    { q: 'Чи можна перейти на інший пакет?', a: 'Так. Ви оплачуєте новий пакет, а гроші за попередній ми повертаємо. Доплатити лише різницю не можна — тільки так.' },
    { q: 'Що означає безкоштовна заміна вакансії?', a: 'Якщо робота не підійшла, менеджер безкоштовно підбере вам іншу вакансію — протягом 1, 6 або 12 місяців залежно від пакета.' },
  ],
  ru: [
    { q: 'Можно ли перейти на другой пакет?', a: 'Да. Вы оплачиваете новый пакет, а деньги за предыдущий мы возвращаем. Доплатить только разницу нельзя — только так.' },
    { q: 'Что значит бесплатная замена вакансии?', a: 'Если работа не подошла, менеджер бесплатно подберёт вам другую вакансию — в течение 1, 6 или 12 месяцев в зависимости от пакета.' },
  ],
}

/** a package card: name, price, what it includes, pay — what the cheaper package lacks is set in bold */
function PackageCard({ p, id, base, featured, lang }: { p: Package; id: (typeof IDS)[number]; base: string[]; featured?: boolean; lang: Lang }) {
  const uk = lang === 'uk'
  const price = PRODUCT[id]?.price ?? uahPrice(p.price) ?? 0
  const old = uahPrice(p.oldPrice)
  return (
    <article className={`flex flex-col rounded-[22px] p-5 sm:p-6 ${featured ? 'brand-band text-white shadow-[var(--shadow-lift)]' : 'bg-white ring-1 ring-line'}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[23px] font-semibold tracking-[-0.01em]">{p.title}</h3>
        {featured && <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.06em] text-brand-800">{uk ? 'Рекомендуємо' : 'Рекомендуем'}</span>}
      </div>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2.5">
        <span className="num font-display text-[34px] font-semibold leading-none tracking-[-0.02em]">{fmt(price)}</span>
        {old && <s className={`num text-[16px] ${featured ? 'text-white/75' : 'text-muted'}`}>{fmt(old)}</s>}
      </p>
      <ul className="mt-5 grid flex-1 content-start gap-2.5">
        {p.features.map((f) => {
          const extra = !base.includes(f)
          return (
            <li key={f} className={`flex gap-2.5 text-[15px] leading-snug ${extra ? 'font-semibold' : featured ? 'text-white/90' : 'text-ink-2'}`}>
              <IconCheck className={`mt-0.5 size-4 shrink-0 ${featured ? 'text-white' : 'text-brand-600'}`} />
              {f.replace(/\.$/, '')}
            </li>
          )
        })}
      </ul>
      <PackagePay id={id} title={p.title} price={price} lang={lang} className={`mt-6 w-full !min-h-13 !text-[16px] ${featured ? 'btn-white' : 'btn-accent'}`}>
        {uk ? 'Оплатити' : 'Оплатить'} {fmt(price)}
      </PackagePay>
    </article>
  )
}

/** one price-list row: name (and a note where Tilda had one), price, action */
function PriceRow({ title, note, price, action }: { title: string; note?: string; price: string; action: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4">
      <div className="col-span-2 min-w-0">
        <p className="text-[16px] font-semibold leading-snug">{title}</p>
        {note && <p className="mt-1 text-[14px] leading-snug text-ink-2">{note}</p>}
      </div>
      <p className="num whitespace-nowrap text-[17px] font-semibold">{price}</p>
      <div className="justify-self-end">{action}</div>
    </li>
  )
}

export function ServicesPage({ lang }: { lang: Lang }) {
  const s = SERVICES[lang]
  const uk = lang === 'uk'
  const pk = s.packages
  const main = pk.slice(0, 3)
  // Tilda's line under the packages (one-to-one), its link to the language's offer
  const noteText = (s.notes?.[0] ?? '').replace('](/oferta)', uk ? '](/oferta)' : '](/ru/oferta)')
  const insOwn = pk.find((p) => /Наш страхов/.test(p.title))
  const abroad = pk.filter((p) => /Переоформ/.test(p.title))
  const action = 'btn-ghost !min-h-11 !px-4 !text-[14.5px]'

  return (
    <>
      <JsonLd data={servicesLd(lang)} />
      <div className="container-x pt-2 text-ink-2">
        <Breadcrumbs items={[{ name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' }, { name: uk ? 'Послуги' : 'Услуги', path: uk ? '/poslugi' : '/ru/services' }]} />
      </div>

      <section className="container-x pb-12 pt-3" aria-labelledby="svc-h">
        <h1 id="svc-h" className="text-balance text-[30px] leading-tight sm:text-[42px]">
          {uk ? 'Пакети послуг з працевлаштування' : 'Пакеты услуг по трудоустройству'}
        </h1>
        <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-5">
          {main.map((p, i) => (
            <PackageCard key={p.title} p={p} id={IDS[i]} base={i ? main[i - 1].features : p.features} featured={i === 1} lang={lang} />
          ))}
        </div>
        <p className="mt-4 text-[13.5px] text-muted">
          <RichText text={noteText} />
        </p>
      </section>

      <section className="border-y border-line bg-white" aria-labelledby="extras-h">
        <div className="container-x grid gap-10 py-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 id="extras-h" className="text-[24px] sm:text-[30px]">
              {uk ? 'Послуги Europe Service' : 'Услуги Europe Service'}
            </h2>
            <ul className="mt-3 divide-y divide-line border-b border-line">
              {(['sim-pl', 'insurance-10'] as const).map((id) => {
                const p = PRODUCT[id]
                if (!p) return null
                return (
                  <PriceRow
                    key={id}
                    title={uk ? p.title : p.titleRu}
                    price={fmt(p.price)}
                    action={
                      <AddToCart id={p.id} title={p.title} price={p.price} multiple lang={lang} className={action}>
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
                  price={`${insOwn.price?.replace('₴ ', '')}${/грн/.test(insOwn.price ?? '') ? '' : ' грн'}`}
                  action={
                    <LeadButton form="invoice:insurance" title={uk ? 'Розрахувати страховку' : 'Рассчитать страховку'} subtitle={insOwn.title} className={action}>
                      {uk ? 'Розрахувати' : 'Рассчитать'}
                    </LeadButton>
                  }
                />
              )}
              <PriceRow
                title={uk ? 'Робоча віза в Польщу на рік без прив’язки' : 'Рабочая виза в Польшу на год без привязки'}
                note={uk ? 'Допомога з реєстрацією та координація по подачі документів в консульство.' : 'Помощь с регистрацией и координация по подаче документов в консульство.'}
                price="15 000 грн"
                action={
                  <Link href={uk ? '/robocha-viza-v-polshchu' : '/ru/rabochaya-viza-v-polshu'} className={action}>
                    {uk ? 'Детальніше' : 'Подробнее'}
                  </Link>
                }
              />
            </ul>
          </div>

          {abroad.length > 0 && (
            <div>
              <h2 className="text-[24px] leading-snug sm:text-[30px]">{uk ? 'Послуги інші країни Європи: Німеччина, Нідерланди, Греція' : 'Услуги другие страны Европы: Германия, Нидерланды, Греция'}</h2>
              <ul className="mt-3 divide-y divide-line border-b border-line">
                {abroad.map((p) => (
                  <PriceRow
                    key={p.title}
                    title={p.title}
                    price={p.price ?? ''}
                    action={
                      <LeadButton form={`invoice:${p.title}`} title={uk ? 'Дізнатися ціну' : 'Узнать цену'} subtitle={p.title} className={action}>
                        {uk ? 'Рахунок' : 'Счёт'}
                      </LeadButton>
                    }
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <Faq items={[...(uk ? SERVICE_FAQ.uk : SERVICE_FAQ.ru), ...(uk ? HOME_FAQ : HOME_FAQ_RU)]} lang={lang} />
      <CtaBand lang={lang} form={uk ? 'services-bottom' : 'services-bottom-ru'} title={uk ? 'Не знаєте, який пакет обрати?' : 'Не знаете, какой пакет выбрать?'} text={uk ? 'Залиште номер — менеджер порадить пакет під вашу вакансію.' : 'Оставьте номер — менеджер подскажет пакет под вашу вакансию.'} />
    </>
  )
}
