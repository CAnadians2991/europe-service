import Link from 'next/link'
import { SERVICES, type Package } from '@/lib/content'
import { Breadcrumbs } from '@/components/vacancy/CatalogPage'
import { RichText } from './Blocks'
import { CtaBand, Faq, HOME_FAQ, HOME_FAQ_RU } from '@/components/sections/Sections'
import { AddToCart } from '@/components/shop/AddToCart'
import { LeadButton } from '@/components/lead/LeadModal'
import { JsonLd } from '@/components/seo/JsonLd'
import { servicesLd } from '@/lib/services-ld'
import { PRODUCT, VARIANT_GROUPS, uahPrice, variantId } from '@/lib/shop'
import { IconCertificate, IconCheck, IconDoc, IconPhone, IconShield } from '@/components/ui/icons'
import { Flag } from '@/components/ui/Flag'
import { PackagePay } from '@/components/services/PackagePay'
import { VariantPay, type VariantOption } from '@/components/services/VariantPay'

// Owner 2026-10-15: «просто опиши пакети як на Personal Work», phones first, nothing said twice.
// Tilda's headings and SEO sentences of this page stay (H1, the offer line, «Послуги Europe Service», the other-countries heading).

type Lang = 'uk' | 'ru'
const fmt = (kop: number) => new Intl.NumberFormat('uk-UA').format(Math.round(kop / 100)).replace(/[   ]/g, ' ') + ' грн'
const IDS = ['basic', 'standard', 'premium'] as const
/** pay.europeservice.com.ua prices these services as € × 52 → the euro amount, rounded to 5 */
const toEur = (kop: number) => Math.round(kop / 100 / 52 / 5) * 5

/** the amounts a service is sold for (as on pay.europeservice.com.ua) → the picker's options and the price line */
function variants(groupId: string, lang: Lang) {
  const g = VARIANT_GROUPS.find((x) => x.id === groupId)
  if (!g) return null
  const uk = lang === 'uk'
  // the other-country documents: hryvnias, with the rough euros next to them (owner 2026-10-28) — Tilda's € prices × 52
  const eur = groupId.startsWith('docs-')
  const options: VariantOption[] = g.options.map((o) => {
    const p = PRODUCT[variantId(g, o)]
    const term = uk ? o.label : o.labelRu
    const price = eur ? `${fmt(p.price)} (≈ €${toEur(p.price)})` : fmt(p.price)
    return { id: p.id, price: p.price, title: uk ? p.title : p.titleRu, label: term ? `${term} — ${price}` : price }
  })
  const ps = options.map((o) => o.price)
  const min = Math.min(...ps)
  const max = Math.max(...ps)
  const range = min === max ? fmt(min) : `${fmt(min).replace(' грн', '')}–${fmt(max)}`
  const rangeEur = eur ? (min === max ? `≈ €${toEur(min)}` : `≈ €${toEur(min)}–${toEur(max)}`) : ''
  return { g, options, range, rangeEur }
}
const PICK = 'field select-code !w-auto min-w-0 !rounded-[12px] !py-2.5 !pl-3 !pr-8 !text-[14.5px] font-semibold'

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

/** a small service card: icon, name, price, action — read at a glance (owner: «60% тексту не читають») */
function ServiceCard({ icon, title, price, tag, action, more, wide }: { icon: React.ReactNode; title: string; price: string; tag?: string; action: React.ReactNode; more?: React.ReactNode; wide?: boolean }) {
  return (
    <li className="flex flex-col rounded-[18px] bg-cream p-4 ring-1 ring-line">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700 ring-1 ring-line" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold leading-snug">{title}</h3>
          {tag && <p className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[12px] font-semibold text-brand-800">{tag}</p>}
        </div>
      </div>
      {more}
      <div className={`mt-auto pt-4 ${wide ? 'grid gap-3' : 'flex items-center justify-between gap-3'}`}>
        <p className="num whitespace-nowrap text-[20px] font-semibold tracking-[-0.01em]">{price}</p>
        {action}
      </div>
    </li>
  )
}

const COUNTRY = [
  { re: /Німеччин|Германи/, code: 'de', uk: 'Німеччина', ru: 'Германия' },
  { re: /Нідерланд|Нидерланд/, code: 'nl', uk: 'Нідерланди', ru: 'Нидерланды' },
  { re: /Греці|Греци/, code: 'gr', uk: 'Греція', ru: 'Греция' },
]

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
  const ins = variants('insurance', lang)

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
        <div className="container-x py-12">
          <h2 id="extras-h" className="text-[24px] sm:text-[30px]">
            {uk ? 'Послуги Europe Service' : 'Услуги Europe Service'}
          </h2>

          {/* the work visa: the big one, set apart */}
          <div className="bg-logo group mt-5 flex flex-col gap-4 rounded-[22px] p-5 text-white shadow-[var(--shadow-lift)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <span className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15" aria-hidden>
                <IconDoc className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[21px] font-semibold leading-tight sm:text-[24px]">{uk ? 'Робоча віза в Польщу на рік без прив’язки' : 'Рабочая виза в Польшу на год без привязки'}</span>
                <span className="mt-1 block text-[14px] leading-snug text-white/85">{uk ? 'Допомога з реєстрацією та координація по подачі документів в консульство.' : 'Помощь с регистрацией и координация по подаче документов в консульство.'}</span>
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-3 sm:justify-end">
              <span className="num mr-auto whitespace-nowrap font-display text-[28px] font-semibold sm:mr-1">15 000 грн</span>
              {/* owner 2026-10-16: the visa is paid right here, like the packages */}
              {PRODUCT['visa-pl'] && (
                <PackagePay id="visa-pl" title={uk ? PRODUCT['visa-pl'].title : PRODUCT['visa-pl'].titleRu} price={PRODUCT['visa-pl'].price} lang={lang} className="btn-white !min-h-11 !px-5 !text-[15px]">
                  {uk ? 'Оплатити' : 'Оплатить'}
                </PackagePay>
              )}
              <Link href={uk ? '/robocha-viza-v-polshchu' : '/ru/rabochaya-viza-v-polshu'} className="inline-flex min-h-11 items-center rounded-[14px] px-4 text-[15px] font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">
                {uk ? 'Детальніше' : 'Подробнее'}
              </Link>
            </span>
          </div>

          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {(['sim-pl', 'insurance-10'] as const).map((id) => {
              const p = PRODUCT[id]
              if (!p) return null
              return (
                <ServiceCard
                  key={id}
                  icon={id === 'sim-pl' ? <IconPhone className="size-5" /> : <IconShield className="size-5" />}
                  title={uk ? p.title : p.titleRu}
                  tag={uk ? 'є в Стандарті й Преміумі' : 'есть в Стандарте и Премиуме'}
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
              <ServiceCard
                icon={<IconCertificate className="size-5" />}
                title={uk ? 'Страховка на ваш термін' : 'Страховка на ваш срок'}
                price={ins?.range ?? `${insOwn.price?.replace('₴ ', '').replace('-', '–')}${/грн/.test(insOwn.price ?? '') ? '' : ' грн'}`}
                wide={Boolean(ins)}
                more={
                  // Tilda's wording of this service (SEO text) — one tap away, not in the way
                  <details className="group mt-2 text-[13.5px] text-ink-2">
                    <summary className="cursor-pointer list-none font-semibold text-brand-700 [&::-webkit-details-marker]:hidden">{uk ? 'Умови' : 'Условия'} <span aria-hidden className="inline-block transition group-open:rotate-90">›</span></summary>
                    <p className="mt-1.5 leading-snug">{(insOwn.features ?? []).slice(0, 2).join(' ')}</p>
                  </details>
                }
                action={
                  ins ? (
                    <VariantPay options={ins.options} multiple lang={lang} label={uk ? 'Термін страховки' : 'Срок страховки'} selectClassName={`${PICK} flex-1`} className={`${action} shrink-0`}>
                      {uk ? 'Додати' : 'Добавить'}
                    </VariantPay>
                  ) : (
                    <LeadButton form="invoice:insurance" title={uk ? 'Розрахувати страховку' : 'Рассчитать страховку'} subtitle={insOwn.title} className={action}>
                      {uk ? 'Розрахувати' : 'Рассчитать'}
                    </LeadButton>
                  )
                }
              />
            )}
          </ul>

          {abroad.length > 0 && (
            <>
              <h2 className="mt-12 text-[22px] leading-snug sm:text-[26px]">{uk ? 'Послуги інші країни Європи: Німеччина, Нідерланди, Греція' : 'Услуги другие страны Европы: Германия, Нидерланды, Греция'}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {abroad.map((p) => {
                  const c = COUNTRY.find((x) => x.re.test(p.title))
                  const v = c ? variants(`docs-${c.code}`, lang) : null
                  return (
                    <li key={p.title} className="flex flex-col gap-3 rounded-[18px] bg-cream p-4 ring-1 ring-line [&>div:last-child]:mt-auto">
                      <div className="flex items-center gap-3">
                        {c && <Flag code={c.code} className="h-6 w-9 shrink-0 rounded-[3px]" title={uk ? c.uk : c.ru} />}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[16px] font-semibold leading-tight">{c ? (uk ? c.uk : c.ru) : p.title}</h3>
                          <p className="num mt-0.5 text-[15px] font-semibold text-ink-2">{v?.range ?? p.price}{v?.rangeEur && <span className="ml-1.5 font-medium text-muted">{v.rangeEur}</span>}</p>
                        </div>
                      </div>
                      {/* what the service includes, one-to-one with Tilda's cards (owner 2026-10-28: «розпис послуг … як було на тільді») */}
                      {p.features.length > 0 && (
                        <ul className="grid gap-1.5">
                          {p.features.map((f) => (
                            <li key={f} className="flex gap-2 text-[14px] leading-snug text-ink-2">
                              <IconCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
                              {f.charAt(0).toUpperCase() + f.slice(1).replace(/\.$/, '')}
                            </li>
                          ))}
                        </ul>
                      )}
                      {p.note && <p className="text-[12.5px] leading-snug text-muted">{p.note}</p>}
                      {v ? (
                        <VariantPay options={v.options} lang={lang} label={uk ? 'Сума' : 'Сумма'} selectClassName={`${PICK} flex-1`} className="btn-accent !min-h-11 shrink-0 !px-5 !text-[15px]">
                          {uk ? 'Оплатити' : 'Оплатить'}
                        </VariantPay>
                      ) : (
                        <LeadButton form={`invoice:${p.title}`} title={uk ? 'Дізнатися ціну' : 'Узнать цену'} subtitle={p.title} className={action}>
                          {uk ? 'Рахунок' : 'Счёт'}
                        </LeadButton>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </section>

      <Faq items={[...(uk ? SERVICE_FAQ.uk : SERVICE_FAQ.ru), ...(uk ? HOME_FAQ : HOME_FAQ_RU)]} lang={lang} />
      <CtaBand lang={lang} form={uk ? 'services-bottom' : 'services-bottom-ru'} title={uk ? 'Не знаєте, який пакет обрати?' : 'Не знаете, какой пакет выбрать?'} text={uk ? 'Залиште номер — менеджер порадить пакет під вашу вакансію.' : 'Оставьте номер — менеджер подскажет пакет под вашу вакансию.'} />
    </>
  )
}
