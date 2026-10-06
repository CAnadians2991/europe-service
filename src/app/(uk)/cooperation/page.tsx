import type { Metadata } from 'next'
import { PAGES } from '@/lib/content'
import { pageMeta } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { Photo } from '@/components/ui/Photo'
import { LeadForm } from '@/components/lead/LeadForm'
import { Breadcrumbs } from '@/components/vacancy/CatalogPage'

type Coop = {
  title: string
  seoTitle?: string
  heroImage?: string
  benefits?: { title: string; text: string; items: { title: string; icon?: string }[] }
  performance?: { title: string; items: { value: string; label: string }[] }
  contact?: { title: string; subtitle?: string; email?: string }
}
const page = (PAGES.cooperation ?? { title: 'Cooperation' }) as unknown as Coop

export const metadata: Metadata = pageMeta({
  title: page.seoTitle || 'Cooperation Europe Service',
  absoluteTitle: true,
  description: 'Europe Service — recruitment agency in Ukraine (licence № 223, since 2019). We find and deliver workers for employers in Poland, Germany, Czechia, the Netherlands and other EU countries.',
  path: '/cooperation',
  hreflang: false,
})

/** For foreign employers — in English, as on the Tilda site */
export default function Page() {
  return (
    <div lang="en">
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="container-x grid gap-8 pb-10 pt-2 sm:pb-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-14">
          <div>
            <div className="text-ink-2">
              <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Cooperation', path: '/cooperation' }]} />
            </div>
            <p className="eyebrow mt-4">
              <span className="size-2 bg-leaf" aria-hidden />
              For employers in the EU
            </p>
            <h1 className="mt-3 max-w-3xl text-[27px] min-[380px]:text-[30px] sm:text-[44px]">{page.title}</h1>
            <dl className="mt-6 border-t border-line font-mono text-[13px] text-ink-2">
              {[
                ['Company', SITE.legalName.replace('ТОВ «ЄВРОПА СЕРВІС УКРАЇНА»', 'Europe Service Ukraine LLC')],
                ['EDRPOU', SITE.edrpou],
                ['Licence', 'Ministry of Social Policy of Ukraine № 223 of 15.02.2019'],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 border-b border-line py-2.5 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
                  <dt className="uppercase tracking-[0.06em] text-muted">{k}</dt>
                  <dd className="text-[14.5px] font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#employer-form" className="btn-accent !px-8">
                Request workers <span aria-hidden>→</span>
              </a>
              <a href={`mailto:${SITE.email}`} className="btn-ghost num !px-6">
                {SITE.email}
              </a>
            </div>
          </div>
          {page.heroImage && <Photo base={page.heroImage} alt="" priority sizes="(max-width: 1024px) 100vw, 520px" className="aspect-[4/3] w-full bg-surface object-cover" />}
        </div>
        <div className="rule-grad" />
      </section>

      {page.performance && (
        <section className="border-b border-line bg-white" aria-labelledby="perf-h">
          <div className="container-x pt-10">
            <p id="perf-h" className="eyebrow">{page.performance.title}</p>
          </div>
          <dl className="container-x mt-2 grid grid-cols-2 lg:grid-cols-4">
            {page.performance.items.map((x, i) => (
              <div key={x.label} className={`flex flex-col-reverse justify-end py-6 pr-4 ${i % 2 ? 'border-l border-line pl-4 lg:pl-6' : ''} ${i > 1 ? 'border-t border-line lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l lg:pl-6' : ''}`}>
                <dt className="mt-2 text-[15px] leading-snug text-muted">{x.label}</dt>
                <dd className="font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[34px]">{x.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {page.benefits && (
        <section className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" aria-labelledby="benefits-h">
          <div>
            <p className="eyebrow">
              <span className="opacity-60">01 —</span>Why us
            </p>
            <h2 id="benefits-h" className="mt-3 text-[26px] sm:text-[38px]">{page.benefits.title}</h2>
          </div>
          <div>
            <p className="text-[17px] leading-relaxed text-ink-2">{page.benefits.text}</p>
            <ul className="mt-8 border-t-[3px] border-ink">
              {page.benefits.items.map((b, i) => (
                <li key={b.title} className="flex min-h-16 items-center gap-4 border-b border-line py-4">
                  <span className="num w-7 shrink-0 text-[13px] font-medium text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 text-[18px] font-semibold">{b.title}</span>
                  {b.icon && <Photo base={b.icon} alt="" width={32} height={32} sizes="32px" className="size-7 opacity-70 grayscale" />}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="employer-form" className="container-x scroll-mt-28 pb-16 sm:pb-20">
        <div className="grid border border-line bg-white lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="border-b border-line p-6 sm:p-10 lg:border-b-0 lg:border-r">
            <p className="eyebrow">{page.contact?.subtitle ?? 'Direct message'}</p>
            <h2 className="mt-3 text-[26px] sm:text-[34px]">{page.contact?.title ?? 'Contact us'}</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
              Leave your phone number and we will call you back, or write to{' '}
              <a href={`mailto:${SITE.email}`} className="font-semibold text-brand-700 underline underline-offset-2">
                {SITE.email}
              </a>
              .
            </p>
          </div>
          <div className="p-6 sm:p-10">
            <LeadForm form="employer" lang="uk" submitLabel="Send" />
          </div>
        </div>
      </section>
    </div>
  )
}
