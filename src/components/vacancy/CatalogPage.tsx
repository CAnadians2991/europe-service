import { HoverLink } from '@/components/ui/HoverLink'
import { Catalog, type Filters } from './Catalog'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbLd, faqLd } from '@/lib/seo'
import { plural } from '@/lib/format'
import type { VacancyCard } from '@/lib/types'
import { CtaBand, Faq } from '@/components/sections/Sections'
import { catalogLandings } from '@/lib/catalog-landings'

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <JsonLd data={breadcrumbLd(items)} />
      <nav aria-label={items[0]?.path.startsWith('/ru') ? 'Хлебные крошки' : 'Хлібні крихти'} className="font-mono text-[12.5px] tracking-[0.02em]">
        {/* one line on a phone: the current page (it repeats the H1 anyway) is cut with «…» */}
        <ol className="flex items-center gap-x-1.5 whitespace-nowrap">
          {items.map((it, i) => (
            <li key={it.path} className={`flex items-center gap-1.5 ${i < items.length - 1 ? 'shrink-0' : 'min-w-0'}`}>
              {i > 0 && <span aria-hidden className="opacity-40">/</span>}
              {i < items.length - 1 ? (
                <HoverLink href={it.path} className="inline-flex min-h-10 items-center underline-offset-[3px] hover:underline">{it.name}</HoverLink>
              ) : (
                <span aria-current="page" className="truncate text-muted">{it.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}

/** Page head of a catalog page: crumbs, the Tilda H1, a lead line of its own (the count is in the filters, the phone in the header); a big country code in the corporate gradient */
export function CatalogHero({ title, text, crumbs, code }: { title: string; text: string; crumbs: { name: string; path: string }[]; code?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-white">
      <span aria-hidden className="grad-text pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 select-none font-display text-[220px] font-bold leading-none tracking-[-0.06em] opacity-[0.16] lg:block">
        {(code || 'eu').toUpperCase()}
      </span>
      <div className="container-x relative pb-5 pt-1 sm:pb-8"> 
        <div className="text-ink-2"><Breadcrumbs items={crumbs} /></div>
        <h1 className="mt-1 max-w-4xl text-[24px] leading-tight min-[380px]:text-[26px] sm:text-[38px]">{title}</h1>
        {text && <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink-2 sm:text-[16px]">{text}</p>}
      </div>
      <div className="rule-grad" />
    </section>
  )
}

export async function CatalogPage({
  title,
  text,
  crumbs,
  cards,
  preset,
  seoText,
  form,
  lang = 'uk',
  links,
  faq,
  faqInText,
  code,
  extra,
}: {
  title: string
  text: string
  crumbs: { name: string; path: string }[]
  cards: VacancyCard[]
  preset?: Partial<Filters>
  seoText?: React.ReactNode
  form: string
  lang?: 'uk' | 'ru'
  /** related landings (country × segment) for internal linking */
  links?: { title: string; items: { href: string; label: string; count?: number }[] }[]
  faq?: { q: string; a: string }[]
  /** the Tilda text (seoText) already shows these questions as an accordion: only the FAQPage markup is added */
  faqInText?: boolean
  /** country code for the decorative letters in the head */
  code?: string
  /** extra blocks after the list (city sections on country pages) */
  extra?: React.ReactNode
}) {
  const uk = lang === 'uk'
  return (
    <>
      <CatalogHero title={title} text={text} crumbs={crumbs} code={code ?? preset?.country} />
      <div id="catalog" className="container-x scroll-mt-24 py-5 sm:py-8">
        <Catalog cards={cards} preset={preset} leadForm={form} lang={lang} {...await catalogLandings(lang)} />
      </div>
      {links?.some((g) => g.items.length) && (
        <nav className="container-x space-y-6 pb-10" aria-label={uk ? 'Популярні добірки' : 'Популярные подборки'}>
          {links.filter((g) => g.items.length).map((g) => (
            <div key={g.title} className="border-t border-line pt-5">
              <p className="eyebrow">{g.title}</p>
              <ul className="mt-3 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((l) => (
                  <li key={l.href} className="border-b border-line">
                    <HoverLink href={l.href} className="flex min-h-11 items-center justify-between gap-3 py-2 text-[15px] font-medium hover:text-brand-700">
                      <span>{l.label}</span>
                      {l.count != null ? <span className="num text-[13px] text-muted">{l.count}</span> : <span aria-hidden className="text-muted">→</span>}
                    </HoverLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      )}
      {extra}
      {seoText && (
        <section className="border-t border-line bg-white py-12">
          <div className="container-x grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <p className="eyebrow self-start lg:pt-2">{uk ? 'Корисно знати' : 'Полезно знать'}</p>
            <div className="prose-pw max-w-3xl [&>*:first-child]:mt-0 [&>h2:first-child]:border-t-0 [&>h2:first-child]:pt-0">{seoText}</div>
          </div>
        </section>
      )}
      {faq && faq.length > 0 && (
        <>
          <JsonLd data={faqLd(faq)} />
          {!faqInText && <Faq items={faq} lang={lang} />}
        </>
      )}
      <CtaBand
        form={`${form}-bottom`}
        lang={lang}
        title={uk ? 'Не знайшли підходящу вакансію?' : 'Не нашли подходящую вакансию?'}
        text={uk ? 'Залиште заявку — підберемо роботу індивідуально з урахуванням ваших документів, досвіду та побажань щодо країни.' : 'Оставьте заявку — подберём работу индивидуально с учётом ваших документов, опыта и пожеланий по стране.'}
      />
    </>
  )
}
