import Link from 'next/link'
import { SERVICES, type Package } from '@/lib/content'
import { PageHero } from './PageHero'
import { Blocks, RichText } from './Blocks'
import { IconCheck } from '@/components/ui/icons'
import { CtaBand, Faq, HOME_FAQ, HOME_FAQ_RU, SectionHead } from '@/components/sections/Sections'
import { PayButton } from './PayButton'
import { LeadButton } from '@/components/lead/LeadModal'
import { LicenseBadge } from '@/components/trust/LicenseBadge'
import { JsonLd } from '@/components/seo/JsonLd'
import { servicesLd } from '@/lib/services-ld'
import { SITE } from '@/lib/site'

type Lang = 'uk' | 'ru'

/** «1899 грн» stays as is; a bare «1899» gets the currency */
const withCurrency = (v: string) => (/грн|₴|€|\$|uah|eur/i.test(v) ? v : `${v} грн`)
/** saving in hryvnias when both prices are plain «NNNN грн» */
const saving = (p: Package) => {
  const n = (v?: string | null) => (v && /^\s*\d[\d\s]*\s*(грн)?\s*$/.test(v) ? Number(v.replace(/\D/g, '')) : NaN)
  const d = n(p.oldPrice) - n(p.price)
  return d > 0 ? d : 0
}

/** «* Натискаючи «Оплатити»… публічної оферти» — from the content (with its link), or the default line */
function OfertaNote({ text, lang, className = '' }: { text?: string; lang: Lang; className?: string }) {
  const uk = lang === 'uk'
  return (
    <p className={`text-[15px] leading-snug text-muted [&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-2 ${className}`}>
      {text ? (
        <RichText text={text} />
      ) : (
        <>
          {uk ? '* Натискаючи «Оплатити», ви погоджуєтесь з умовами ' : '* Нажимая «Оплатить», вы соглашаетесь с условиями '}
          <Link href="/oferta">{uk ? 'публічної оферти' : 'публичной оферты'}</Link>.
        </>
      )}
    </p>
  )
}

function PayActions({ p, featured, note, lang, compact }: { p: Package; featured?: boolean; note?: string; lang: Lang; /** price-list row: the price sits above, the oferta line under the group */ compact?: boolean }) {
  const uk = lang === 'uk'
  return (
    <div className="grid gap-2">
      {p.payUrl ? (
        <PayButton href={p.payUrl} title={p.title} className={`${featured ? 'btn-accent' : 'btn-primary'} w-full`}>
          {uk ? 'Оплатити' : 'Оплатить'}
          {p.price && !compact && <span className="num font-medium opacity-80">· {p.price}</span>}
        </PayButton>
      ) : null}
      <LeadButton form={`service:${p.title}`} title={uk ? 'Консультація щодо послуги' : 'Консультация по услуге'} subtitle={p.title} className="btn-ghost w-full">
        {uk ? 'Спершу консультація' : 'Сначала консультация'}
      </LeadButton>
      {p.payUrl && !compact && <OfertaNote text={note} lang={lang} className="mt-1" />}
    </div>
  )
}

/**
 * One column of the tariff sheet. On desktop the three columns share rows (subgrid): the name, the price, the list,
 * the buttons line up across the sheet. On phones each package is its own panel.
 */
function PackageColumn({ p, index, featured, note, lang }: { p: Package; index: number; featured?: boolean; note?: string; lang: Lang }) {
  const uk = lang === 'uk'
  const save = saving(p)
  return (
    <article
      aria-labelledby={`pkg-${index}`}
      className={`relative flex flex-col border border-line bg-white lg:row-span-4 lg:grid lg:grid-rows-subgrid lg:gap-0 ${index > 0 ? 'lg:border-l-0' : ''}`}
    >
      {featured && <div className="rule-grad absolute inset-x-[-1px] top-[-1px]" aria-hidden />}
      {/* row 1: name */}
      <header className="px-5 pt-6 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="num text-[13px] font-medium text-muted">{String(index + 1).padStart(2, '0')}</span>
          {featured && <span className="num bg-ink px-2 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white">{uk ? 'Найпопулярніший' : 'Самый популярный'}</span>}
        </div>
        <h3 id={`pkg-${index}`} className="mt-3 font-display text-[24px] font-semibold tracking-[-0.02em]">
          {p.title}
        </h3>
      </header>
      {/* row 2: price */}
      <div className="px-5 pt-4 sm:px-7">
        {p.price && (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-5">
            <span className="num text-[36px] font-semibold leading-none tracking-[-0.02em] text-ink">{p.price}</span>
            {p.oldPrice && (
              <s className="num text-[17px] text-muted decoration-[1.5px]">
                <span className="sr-only">{uk ? 'Стара ціна: ' : 'Старая цена: '}</span>
                {withCurrency(p.oldPrice)}
              </s>
            )}
            {save > 0 && <span className="num bg-brand-100 px-1.5 py-0.5 text-[13px] font-semibold text-brand-800">−{save} грн</span>}
          </p>
        )}
        {p.note && <p className="mt-3 text-[15px] text-muted">{p.note}</p>}
      </div>
      {/* row 3: what's included */}
      <ul className="flex-1 px-5 pb-6 pt-2 sm:px-7">
        {p.features.map((f) => (
          <li key={f} className="flex gap-3 border-b border-line py-2.5 text-[15.5px] leading-snug text-ink-2 last:border-b-0">
            <IconCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
            {f.replace(/\.$/, '')}
          </li>
        ))}
      </ul>
      {/* row 4: pay / ask */}
      <div className="border-t border-line px-5 py-5 sm:px-7">
        <PayActions p={p} featured={featured} note={note} lang={lang} />
      </div>
    </article>
  )
}

/** Extra services: a price list — name and note, what's included, the price and the buttons */
function ServiceRow({ p, lang }: { p: Package; lang: Lang }) {
  return (
    <li className="grid gap-4 border-b border-line py-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_280px] lg:gap-8">
      <div>
        <h3 className="text-[19px] leading-snug">{p.title}</h3>
        {p.note && <p className="mt-1.5 text-[15px] text-muted">{p.note}</p>}
      </div>
      <ul className="space-y-1.5">
        {p.features.map((f) => (
          <li key={f} className="relative pl-5 text-[15.5px] leading-snug text-ink-2">
            <span aria-hidden className="absolute left-0 top-[0.55em] size-1.5 bg-brand-500" />
            {f.replace(/\.$/, '')}
          </li>
        ))}
      </ul>
      <div className="grid content-start gap-3">
        {p.price && <p className="num text-[26px] font-semibold leading-none tracking-[-0.02em]">{p.price}</p>}
        <PayActions p={p} lang={lang} compact />
      </div>
    </li>
  )
}

export function ServicesPage({ lang }: { lang: Lang }) {
  const s = SERVICES[lang]
  const uk = lang === 'uk'
  const main = s.packages.slice(0, 3)
  const rest = s.packages.slice(3)
  const note = s.notes?.[0]
  // the extra services keep their content groups («Послуги Europe Service», «…інші країни Європи»)
  const groups = rest.reduce<{ name: string; items: Package[] }[]>((acc, p) => {
    const name = p.group || ''
    const g = acc.find((x) => x.name === name)
    if (g) g.items.push(p)
    else acc.push({ name, items: [p] })
    return acc
  }, [])
  return (
    <>
      <JsonLd data={servicesLd(lang)} />
      <PageHero
        title={uk ? 'Послуги та ціни' : 'Услуги и цены'}
        text={uk ? 'Вакансія для вас безкоштовна — ви оплачуєте лише послуги з оформлення та супроводу. Оберіть пакет або отримайте безкоштовну консультацію.' : 'Вакансия для вас бесплатна — вы оплачиваете только услуги по оформлению и сопровождению. Выберите пакет или получите бесплатную консультацию.'}
        crumbs={[{ name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' }, { name: uk ? 'Послуги' : 'Услуги', path: uk ? '/poslugi' : '/ru/services' }]}
      >
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[13px] text-ink-2">
          {main.some((p) => p.price) && (
            <div className="flex items-baseline gap-2">
              <dt className="uppercase tracking-[0.06em] text-muted">{uk ? 'Пакети' : 'Пакеты'}</dt>
              <dd className="text-[17px] font-semibold text-brand-700">{main.map((p) => p.price?.replace(/\s*грн/, '')).filter(Boolean).join(' · ')} грн</dd>
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <dt className="uppercase tracking-[0.06em] text-muted">{uk ? 'Вакансія' : 'Вакансия'}</dt>
            <dd className="font-semibold text-ink">{uk ? 'безкоштовно' : 'бесплатно'}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="uppercase tracking-[0.06em] text-muted">{uk ? 'Консультація' : 'Консультация'}</dt>
            <dd>
              <a href={`tel:${SITE.phone}`} className="font-semibold text-ink hover:text-brand-700">
                {SITE.phoneDisplay}
              </a>
            </dd>
          </div>
        </dl>
        <LicenseBadge lang={lang} className="mt-5 !text-[15px]" />
      </PageHero>

      {main.length > 0 && (
        <section className="container-x py-14 sm:py-16" aria-labelledby="packages-h">
          <SectionHead id="packages-h" index={1} eyebrow={uk ? 'Тарифи' : 'Тарифы'} title={main[0]?.group || (uk ? 'Пакети послуг з працевлаштування' : 'Пакеты услуг по трудоустройству')} />
          <div className="mt-10 grid gap-5 lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr_auto] lg:gap-0">
            {main.map((p, i) => (
              <PackageColumn key={p.title} p={p} index={i} featured={i === 1} note={p.groupNote || note} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="border-t border-line bg-white" aria-labelledby="extra-h">
          <div className="container-x py-14 sm:py-16">
            <SectionHead id="extra-h" index={2} eyebrow={uk ? 'Прайс' : 'Прайс'} title={uk ? 'Оформлення в інші країни та додаткові послуги' : 'Оформление в другие страны и дополнительные услуги'} />
            {groups.map((g) => (
              <div key={g.name} className="mt-10">
                {g.name && <p className="eyebrow">{g.name}</p>}
                <ul className="mt-3 border-t-[3px] border-ink">
                  {g.items.map((p) => (
                    <ServiceRow key={p.title} p={p} lang={lang} />
                  ))}
                </ul>
                {g.items.some((p) => p.payUrl) && <OfertaNote text={g.items.find((p) => p.groupNote)?.groupNote || note} lang={lang} className="mt-4" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {s.steps?.length > 0 && (
        <section className="container-x py-14 sm:py-16" aria-labelledby="steps-h">
          <SectionHead id="steps-h" eyebrow={uk ? 'Як це працює' : 'Как это работает'} title={s.stepsTitle || (uk ? 'Етапи співпраці' : 'Этапы сотрудничества')} />
          <ol className="mt-10 grid gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {s.steps.map((st, i) => (
              <li key={st.title} className="border-t-[3px] border-ink pt-5 sm:pr-8">
                <span className="num block text-[40px] font-medium leading-none text-brand-600">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-4 text-[19px]">{st.title.replace(/^(Крок|Шаг)\s*\d+\.\s*/, '')}</h3>
                <div className="mt-2 text-[15.5px]">
                  {st.blocks?.length ? <Blocks blocks={st.blocks} /> : st.text && <p className="whitespace-pre-line leading-relaxed text-ink-2">{st.text.replace(/✅/g, '• ')}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {s.extraSections?.length > 0 && (
        <section className="container-x pb-6" aria-label={uk ? 'Додатково' : 'Дополнительно'}>
          <dl className="border-t-[3px] border-ink">
            {s.extraSections.map((x) => (
              <div key={x.title} className="grid gap-1 border-b border-line py-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] sm:gap-6">
                <dt>
                  <h2 className="font-sans text-[17px] font-semibold tracking-normal">{x.title.charAt(0) + x.title.slice(1).toLowerCase()}</h2>
                </dt>
                <dd className="whitespace-pre-line text-[15.5px] leading-relaxed text-ink-2">{x.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <Faq items={uk ? HOME_FAQ : HOME_FAQ_RU} lang={lang} />
      <CtaBand lang={lang} form={uk ? 'services-bottom' : 'services-bottom-ru'} title={uk ? 'Не знаєте, який пакет обрати?' : 'Не знаете, какой пакет выбрать?'} text={uk ? 'Залиште номер — менеджер порадить оптимальний варіант під вашу вакансію та документи.' : 'Оставьте номер — менеджер подскажет оптимальный вариант под вашу вакансию и документы.'} />
    </>
  )
}
