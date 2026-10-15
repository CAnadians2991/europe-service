import Link from 'next/link'
import type { VisaPage } from '@/lib/visa'
import { faqLd } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { Breadcrumbs } from '@/components/vacancy/CatalogPage'
import { Faq, SectionHead } from '@/components/sections/Sections'
import { Blocks } from '@/components/content/Blocks'
import { LeadForm } from '@/components/lead/LeadForm'
import { ChatButtons } from '@/components/lead/ChatButtons'
import { LicenseStamp } from '@/components/trust/LicenseStamp'
import { IconArrow, IconCheck } from '@/components/ui/icons'

/** Service JSON-LD: what is sold, by whom, for how much — the facts AI answers quote */
function serviceLd(p: VisaPage) {
  const amount = p.price.amount.replace(/\D/g, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: p.h1,
    description: p.seoDescription,
    serviceType: p.lang === 'uk' ? 'Оформлення польської національної робочої візи (D)' : 'Оформление польской национальной рабочей визы (D)',
    areaServed: { '@type': 'Country', name: p.lang === 'uk' ? 'Україна' : 'Украина' },
    provider: { '@type': 'EmploymentAgency', name: SITE.name, url: SITE.url, telephone: SITE.phone },
    url: SITE.url + p.path,
    inLanguage: p.lang,
    offers: amount ? { '@type': 'Offer', price: amount, priceCurrency: 'UAH', url: SITE.url + p.path } : undefined,
  }
}

/** Landing of the visa package: package card, the scheme, steps with timing, documents, honest limits, FAQ, form */
export function VisaLanding({ p }: { p: VisaPage }) {
  const uk = p.lang === 'uk'
  const home = { name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' }
  return (
    <>
      <JsonLd data={serviceLd(p)} />
      <JsonLd data={faqLd(p.faq)} />

      {/* ───────── HERO: the promise + the package card ───────── */}
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="container-x grid gap-10 pb-12 pt-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14 lg:pb-16">
          <div>
            <div className="text-ink-2">
              <Breadcrumbs items={[home, { name: p.h1, path: p.path }]} />
            </div>
            <p className="eyebrow mt-6">
              <span className="size-2 bg-leaf" aria-hidden />
              {p.eyebrow}
            </p>
            <h1 className="mt-4 text-[30px] min-[380px]:text-[34px] sm:text-[48px] lg:text-[54px]">{p.h1}</h1>
            <p className="mt-5 max-w-[620px] text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">{p.lead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#visa-form" className="btn-accent !px-7">
                {uk ? 'Залишити заявку' : 'Оставить заявку'} <IconArrow className="size-4" />
              </a>
              <a href={`tel:${SITE.phone}`} className="btn-ghost num !px-6">
                {SITE.phoneDisplay}
              </a>
            </div>
            <ChatButtons place="visa-hero" lang={p.lang} inline className="mt-4" />
          </div>

          <aside className="relative self-start border border-line bg-white shadow-[var(--shadow-lift)] lg:mt-14" aria-label={p.price.title}>
            <div className="rule-grad" />
            <div className="px-6 pb-5 pt-5 sm:px-7">
              <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">{p.price.title}</p>
              <p className="mt-2 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] sm:text-[52px]">{p.price.amount}</p>
              <p className="mt-2 text-[14px] leading-snug text-ink-2">{p.price.note}</p>
            </div>
            <ul className="border-t border-line">
              {p.price.items.map((it) => (
                <li key={it} className="flex gap-3 border-b border-line px-6 py-3 text-[15.5px] leading-snug sm:px-7">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center bg-brand-600 text-white">
                    <IconCheck className="size-3.5" />
                  </span>
                  {it}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-4 px-6 py-4 sm:px-7">
              <a href="#visa-form" className="btn-accent flex-1 justify-center">
                {uk ? 'Оформити візу' : 'Оформить визу'}
              </a>
              <LicenseStamp lang={p.lang} uid="visa" className="size-20 shrink-0 rotate-[-10deg] text-brand-700/85 mix-blend-multiply" />
            </div>
          </aside>
        </div>

        <div className="border-t border-line">
          <dl className="container-x grid grid-cols-2 lg:grid-cols-4">
            {p.facts.map(([v, l], i) => (
              <div key={v + l} className={`py-5 pr-4 ${i % 2 ? 'border-l border-line pl-4 lg:pl-6' : ''} ${i > 1 ? 'border-t border-line lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l lg:pl-6' : ''}`}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-[24px] font-semibold leading-none tracking-[-0.02em] sm:text-[30px]">{v}</dd>
                <dd className="mt-2 text-[14px] leading-snug text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ───────── 01 THE SCHEME ───────── */}
      <section className="container-x py-16 sm:py-20" aria-labelledby="scheme-h">
        <SectionHead id="scheme-h" index={1} eyebrow={uk ? 'Як це працює' : 'Как это работает'} title={p.scheme.title} />
        <ol className="mt-10 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch lg:gap-0">
          {p.scheme.nodes.map((n, i) => (
            <li key={n.code} className="contents">
              <div className={`relative border bg-white p-5 sm:p-6 ${i === p.scheme.nodes.length - 1 ? 'border-transparent bg-[linear-gradient(135deg,var(--color-brand-600),#3f86c4)] text-white' : 'border-line'}`}>
                <span className={`num inline-block px-2 py-0.5 text-[12px] font-semibold uppercase tracking-[0.08em] ${i === p.scheme.nodes.length - 1 ? 'bg-white/15 text-white' : 'bg-ink text-white'}`}>{n.code}</span>
                <h3 className={`mt-4 text-[20px] ${i === p.scheme.nodes.length - 1 ? 'text-white' : ''}`}>{n.title}</h3>
                <p className={`mt-2 text-[15.5px] leading-relaxed ${i === p.scheme.nodes.length - 1 ? 'text-white/85' : 'text-ink-2'}`}>{n.text}</p>
              </div>
              {i < p.scheme.nodes.length - 1 && (
                <div aria-hidden={!p.scheme.edges[i]} className="flex items-center justify-center gap-2 py-1 lg:flex-col lg:px-3 lg:py-0">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700 lg:[writing-mode:vertical-rl] lg:rotate-180">{p.scheme.edges[i]}</span>
                  <IconArrow className="size-4 rotate-90 text-brand-700 lg:rotate-0" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── 02 STEPS WITH TIMING ───────── */}
      <section className="border-y border-line bg-white" aria-labelledby="steps-h">
        <div className="container-x py-16 sm:py-20">
          <SectionHead id="steps-h" index={2} eyebrow={uk ? 'Етапи' : 'Этапы'} title={uk ? 'Від заявки до візи в паспорті' : 'От заявки до визы в паспорте'} />
          <ol className="mt-10 grid gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
            {p.steps.map((s, i, all) => (
              <li key={s.title}>
                <span className="block bg-line">
                  <span className="stage-bar" style={{ opacity: 0.4 + (0.6 * (i + 1)) / all.length }} />
                </span>
                <p className="mt-4 flex items-baseline justify-between gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                  <span className="num text-ink">
                    {String(i + 1).padStart(2, '0')}
                    <span className="text-muted">/{String(all.length).padStart(2, '0')}</span>
                  </span>
                  {s.time && <span className="text-right normal-case tracking-normal">{s.time}</span>}
                </p>
                <h3 className="mt-3 text-[19px]">{s.title}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── 03 WHO DOES WHAT ───────── */}
      <section className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16" aria-labelledby="split-h">
        <h2 id="split-h" className="sr-only">{uk ? 'Хто що робить' : 'Кто что делает'}</h2>
        <div>
          <p className="eyebrow">{uk ? 'Робимо ми' : 'Делаем мы'}</p>
          <ul className="mt-4 border-t-[3px] border-ink">
            {p.weDo.map((x) => (
              <li key={x} className="flex gap-3 border-b border-line py-3.5 text-[16px] leading-snug">
                <IconCheck className="mt-0.5 size-5 shrink-0 text-brand-600" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">{uk ? 'Від вас' : 'От вас'}</p>
          <ul className="mt-4 border-t-[3px] border-ink">
            {p.youDo.map((x) => (
              <li key={x} className="flex gap-3 border-b border-line py-3.5 text-[16px] leading-snug">
                <span className="num mt-0.5 w-5 shrink-0 text-[13px] text-muted">—</span>
                {x}
              </li>
            ))}
          </ul>
          {p.separately.length > 0 && (
            <div className="mt-8 border-l-[3px] border-brand-500 bg-brand-50/60 px-4 py-3">
              <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em] text-brand-700">{uk ? 'Оплачується окремо' : 'Оплачивается отдельно'}</p>
              <ul className="mt-2 space-y-1 text-[15px] text-ink">
                {p.separately.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ───────── 04 DOCUMENTS + FOR WHOM ───────── */}
      <section className="border-y border-line bg-white" aria-labelledby="docs-h">
        <div className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <SectionHead id="docs-h" index={3} eyebrow={uk ? 'Документи' : 'Документы'} title={uk ? 'Що підготувати' : 'Что подготовить'} />
            <ol className="mt-8 border-t-[3px] border-ink">
              {p.docs.map((d, i) => (
                <li key={d} className="grid grid-cols-[36px_minmax(0,1fr)] gap-2 border-b border-line py-3.5 text-[16px] leading-snug">
                  <span className="num text-[13px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                  {d}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="eyebrow">{uk ? 'Кому підходить' : 'Кому подходит'}</p>
            <ul className="mt-4 space-y-3">
              {p.forWhom.map((x) => (
                <li key={x} className="flex gap-3 text-[16px] leading-snug">
                  <span className="mt-2 size-1.5 shrink-0 bg-leaf" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-10 border border-line bg-surface p-5 sm:p-6">
              <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink">{p.honest.title}</p>
              <ul className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-ink-2">
                {p.honest.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── SEO TEXT ───────── */}
      <section className="container-x grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16" aria-label={uk ? 'Докладно' : 'Подробно'}>
        <article className="max-w-[780px]">
          <Blocks blocks={p.blocks} />
          <p className="num mt-8 text-[12.5px] text-muted">
            {uk ? 'Оновлено' : 'Обновлено'}: {p.updated}
          </p>
        </article>
        {p.links.length > 0 && (
          <aside className="lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100dvh-120px)] lg:overflow-y-auto lg:overscroll-contain [scrollbar-width:thin]">
            <p className="eyebrow">{uk ? 'Дивіться також' : 'Смотрите также'}</p>
            <ul className="mt-4 border-t-[3px] border-ink">
              {p.links.map((x) => (
                <li key={x.href} className="border-b border-line">
                  <Link href={x.href} className="flex min-h-12 items-center justify-between gap-3 py-3 text-[15.5px] font-medium hover:text-brand-700">
                    {x.label} <span aria-hidden className="text-brand-700">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>

      <Faq items={p.faq} lang={p.lang} />

      {/* ───────── FORM ───────── */}
      <section id="visa-form" className="container-x scroll-mt-28 pb-16 sm:pb-20" aria-labelledby="visa-form-h">
        <div className="brand-band grid gap-8 overflow-hidden p-7 text-white sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:p-12">
          <div>
            <p className="eyebrow !text-white/80">{p.price.title}</p>
            <h2 id="visa-form-h" className="mt-3 text-[26px] leading-tight text-white sm:text-[34px]">
              {uk ? 'Залиште номер — розрахуємо строки під ваш випадок' : 'Оставьте номер — рассчитаем сроки под ваш случай'}
            </h2>
            <p className="mt-3 max-w-md text-[16px] text-white/80">
              {uk
                ? 'Менеджер перевірить паспорт і ситуацію, пояснить, чи підходить вам віза, і назве найближчу дату подачі.'
                : 'Менеджер проверит паспорт и ситуацию, объяснит, подходит ли вам виза, и назовёт ближайшую дату подачи.'}
            </p>
            <p className="mt-6 font-display text-[40px] font-semibold leading-none tracking-[-0.03em]">{p.price.amount}</p>
          </div>
          <div className="bg-white p-5 text-ink sm:p-7">
            <LeadForm form={p.form} lang={p.lang} />
          </div>
        </div>
      </section>
    </>
  )
}
