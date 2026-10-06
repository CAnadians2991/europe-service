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
      <section className="brand-band text-white">
        <div className="container-x grid gap-8 pb-12 pt-3 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Cooperation', path: '/cooperation' }]} />
            <h1 className="mt-2 text-[30px] font-extrabold leading-tight sm:text-[44px]">{page.title}</h1>
            <p className="mt-4 max-w-xl text-[17px] text-white/85">
              {SITE.legalName.replace('ТОВ «ЄВРОПА СЕРВІС УКРАЇНА»', 'Europe Service Ukraine LLC')} · EDRPOU {SITE.edrpou} · licence of the Ministry of Social Policy of Ukraine № 223 of 15.02.2019.
            </p>
            <a href="#employer-form" className="btn-accent mt-6 !px-8 !py-4 !text-base">
              Request workers
            </a>
          </div>
          {page.heroImage && <Photo base={page.heroImage} alt="" priority sizes="(max-width: 1024px) 100vw, 520px" className="aspect-[4/3] w-full rounded-[28px] object-cover" />}
        </div>
      </section>

      {page.benefits && (
        <section className="container-x py-14">
          <h2 className="text-[28px] sm:text-[36px]">{page.benefits.title}</h2>
          <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-ink-2">{page.benefits.text}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {page.benefits.items.map((b) => (
              <li key={b.title} className="flex items-center gap-4 rounded-3xl bg-brand-50 p-5">
                {b.icon && <Photo base={b.icon} alt="" width={40} height={40} sizes="40px" className="size-10" />}
                <span className="text-[17px] font-bold">{b.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {page.performance && (
        <section className="bg-surface py-14">
          <div className="container-x">
            <h2 className="text-[28px] sm:text-[36px]">{page.performance.title}</h2>
            <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {page.performance.items.map((x) => (
                <div key={x.label} className="rounded-3xl bg-white p-6 ring-1 ring-line">
                  <dd className="font-display text-[34px] font-extrabold text-brand-700">{x.value}</dd>
                  <dt className="mt-1 text-[15px] text-ink-2">{x.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <section id="employer-form" className="container-x scroll-mt-28 py-14">
        <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-6 shadow-[var(--shadow-lift)] ring-1 ring-line sm:p-10">
          <h2 className="text-[26px] sm:text-[32px]">{page.contact?.title ?? 'Contact us'}</h2>
          <p className="mt-2 text-ink-2">
            Leave your phone number and we will call you back, or write to{' '}
            <a href={`mailto:${SITE.email}`} className="font-semibold text-brand-700 underline underline-offset-2">
              {SITE.email}
            </a>
            .
          </p>
          <div className="mt-6">
            <LeadForm form="employer" lang="uk" submitLabel="Send" />
          </div>
        </div>
      </section>
    </div>
  )
}
