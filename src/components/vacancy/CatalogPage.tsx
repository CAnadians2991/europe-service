import Link from 'next/link'
import { Catalog, type Filters } from './Catalog'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbLd, faqLd } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { plural } from '@/lib/format'
import type { VacancyCard } from '@/lib/types'
import { CtaBand, Faq } from '@/components/sections/Sections'
import { catalogLandings } from '@/lib/catalog-landings'

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <JsonLd data={breadcrumbLd(items)} />
      <nav aria-label={items[0]?.path.startsWith('/ru') ? 'Хлебные крошки' : 'Хлібні крихти'} className="text-[13px] sm:text-sm">
        {/* one line on a phone: the current page (it repeats the H1 anyway) is cut with «…» */}
        <ol className="flex items-center gap-x-1 whitespace-nowrap">
          {items.map((it, i) => (
            <li key={it.path} className={`flex items-center gap-1 ${i < items.length - 1 ? 'shrink-0' : 'min-w-0'}`}>
              {i > 0 && <span aria-hidden className="opacity-50">/</span>}
              {i < items.length - 1 ? (
                <Link href={it.path} className="inline-flex min-h-10 items-center underline-offset-2 hover:underline">{it.name}</Link>
              ) : (
                <span aria-current="page" className="truncate font-semibold">{it.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}

export function CatalogHero({ title, text, crumbs, count, lang = 'uk' }: { title: string; text: string; crumbs: { name: string; path: string }[]; count: number; lang?: 'uk' | 'ru' }) {
  return (
    <section className="brand-band text-white">
      <div className="container-x pb-10 pt-3 sm:pb-12">
        <div className="text-white"><Breadcrumbs items={crumbs} /></div>
        <h1 className="mt-1 text-[26px] font-extrabold leading-tight min-[360px]:text-[30px] sm:text-[42px]">{title}</h1>
        <p className="mt-3 max-w-2xl text-[16px] text-white/85">{text}</p>
        <p className="mt-4 inline-block rounded-2xl bg-white/15 px-3.5 py-1.5 text-sm font-semibold leading-relaxed ring-1 ring-white/25">
          {count} {plural(count, lang === 'uk' ? ['вакансія', 'вакансії', 'вакансій'] : ['вакансия', 'вакансии', 'вакансий'])} · {lang === 'uk' ? 'оновлено' : 'обновлено'}{' '}
          {new Date().toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'ru-RU', { day: 'numeric', month: 'long' })} · <span className="whitespace-nowrap">{SITE.phoneDisplay}</span>
        </p>
      </div>
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
}) {
  const uk = lang === 'uk'
  const count = cards.filter((c) => (!preset?.country || c.country === preset.country) && (!preset?.category || c.category === preset.category) && (!preset?.housingFree || c.housingFree)).length
  return (
    <>
      <CatalogHero title={title} text={text} crumbs={crumbs} count={count} lang={lang} />
      <div className="container-x py-8 sm:py-10">
        <Catalog cards={cards} preset={preset} leadForm={form} lang={lang} {...await catalogLandings(lang)} />
      </div>
      {links?.some((g) => g.items.length) && (
        <nav className="container-x space-y-5 pb-8" aria-label={uk ? 'Популярні добірки' : 'Популярные подборки'}>
          {links.filter((g) => g.items.length).map((g) => (
            <div key={g.title}>
              <p className="text-[15px] font-bold">{g.title}</p>
              <ul className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
                {g.items.map((l) => (
                  <li key={l.href} className="shrink-0">
                    <Link href={l.href} className="chip">
                      {l.label} {l.count != null && <span className="text-xs">{l.count}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      )}
      {seoText && <section className="container-x pb-4"><div className="prose-pw max-w-3xl">{seoText}</div></section>}
      {faq && faq.length > 0 && (
        <>
          <JsonLd data={faqLd(faq)} />
          <Faq items={faq} lang={lang} />
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
