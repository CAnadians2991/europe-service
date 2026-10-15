import Link from 'next/link'
import type { LandingPage } from '@/lib/landing'
import { faqLd } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { CtaBand, Faq } from '@/components/sections/Sections'
import { PageHero } from './PageHero'
import { Blocks } from './Blocks'

/** A guide page (kind 'info': «how to check an agency», FAQ): text first, no vacancy list on top */
export function InfoLanding({ l, path }: { l: LandingPage; path: string }) {
  const uk = l.lang === 'uk'
  const crumbs = [
    { name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' },
    { name: l.h1 || l.title, path },
  ]
  const links = (l.links ?? []).filter((x) => x.href.startsWith('/'))
  return (
    <>
      <PageHero title={l.h1 || l.title} text={l.intro} crumbs={crumbs} />
      <div className="container-x grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
        <article className="prose-pw max-w-[780px]">
          <Blocks blocks={l.blocks} />
        </article>
        {links.length > 0 && (
          <aside className="lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100dvh-120px)] lg:overflow-y-auto lg:overscroll-contain [scrollbar-width:thin]">
            <p className="eyebrow">{uk ? 'Корисно' : 'Полезно'}</p>
            <ul className="mt-4 border-t-[3px] border-ink">
              {links.map((x) => (
                <li key={x.href} className="border-b border-line">
                  <Link href={x.href} className="flex min-h-12 items-center justify-between gap-3 py-3 text-[15.5px] font-medium hover:text-brand-700">
                    {x.label} <span aria-hidden className="text-brand-700">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
      {l.faq && l.faq.length > 0 && (
        <>
          <JsonLd data={faqLd(l.faq)} />
          <Faq items={l.faq} lang={l.lang} />
        </>
      )}
      <CtaBand
        lang={l.lang}
        form={`info-${path.split('/').pop()}`}
        title={uk ? 'Залишилися запитання?' : 'Остались вопросы?'}
        text={uk ? 'Менеджер безкоштовно проконсультує й підбере вакансію під ваші документи.' : 'Менеджер бесплатно проконсультирует и подберёт вакансию под ваши документы.'}
      />
    </>
  )
}
