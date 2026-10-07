import Link from 'next/link'
import { getActiveVacancies } from '@/lib/vacancies'
import { COUNTRIES, SITE } from '@/lib/site'
import { COUNTRY_NAMES, PARTNER, PARTNER_LANGS, PARTNER_PATHS, type PartnerLang } from '@/lib/partners'
import { breadcrumbLd, faqLd, organizationLd } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { Photo } from '@/components/ui/Photo'
import { PartnerForm } from './PartnerForm'
import { Flag } from '@/components/ui/Flag'

/** Our team with the Ukrainian Business Award plaques (owner's office shoot) */
export const PARTNER_PHOTO = '/media/team/team-awards'

/**
 * «Співпраця» in four languages: who we work with, figures, how we fill a vacancy, countries, the request form, FAQ.
 * UA/RU render inside the site shell; EN/PL inside the light international shell.
 */
export async function PartnersPage({ lang, photo = PARTNER_PHOTO }: { lang: PartnerLang; photo?: string }) {
  const t = PARTNER[lang]
  const all = await getActiveVacancies()
  const countries = COUNTRIES.map((c) => ({ ...c, n: all.filter((v) => v.country === c.code).length })).filter((c) => c.n)
  const cname = (c: (typeof countries)[number]) => (lang === 'uk' ? c.name : lang === 'ru' ? c.nameRu : (COUNTRY_NAMES[c.code]?.[lang] ?? c.name))
  const home = lang === 'ru' ? '/ru' : '/'
  const crumbs = [
    { name: t.home, path: lang === 'en' || lang === 'pl' ? '/' : home },
    { name: t.crumb, path: PARTNER_PATHS[lang] },
  ]

  return (
    <div lang={lang === 'uk' ? 'uk' : lang}>
      <JsonLd data={organizationLd(lang === 'ru' ? 'ru' : 'uk')} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(t.faq)} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: t.h1,
          serviceType: lang === 'uk' ? 'Підбір персоналу' : lang === 'ru' ? 'Подбор персонала' : lang === 'pl' ? 'Rekrutacja pracowników' : 'Staff recruitment',
          provider: { '@id': `${SITE.url}/#org` },
          areaServed: countries.map((c) => COUNTRY_NAMES[c.code]?.en ?? c.name),
          inLanguage: lang,
          url: SITE.url + PARTNER_PATHS[lang],
        }}
      />

      {/* ───────── head: what we offer + figures + photo ───────── */}
      <section className="border-b border-line bg-white">
        <div className="container-x grid gap-8 pb-10 pt-3 sm:pb-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14">
          <div>
            <nav aria-label="Breadcrumbs" className="font-mono text-[12.5px] text-ink-2">
              <ol className="flex items-center gap-1.5">
                <li>
                  <Link href={crumbs[0].path} className="inline-flex min-h-10 items-center hover:underline">{crumbs[0].name}</Link>
                </li>
                <li aria-hidden className="opacity-40">/</li>
                <li aria-current="page" className="text-muted">{t.crumb}</li>
              </ol>
            </nav>
            <p className="mt-2 text-[14px] font-semibold text-brand-700">{t.eyebrow}</p>
            <h1 className="mt-2 text-[32px] leading-[1.05] tracking-[-0.03em] sm:text-[48px] lg:text-[54px]">{t.h1}</h1>
            <p className="mt-4 max-w-[600px] text-[16.5px] leading-relaxed text-ink-2 sm:text-[18px]">{t.sub}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#partner-form" className="btn-accent !min-h-[52px] !px-7 !text-[16px]">
                {t.cta} <span aria-hidden>→</span>
              </a>
              <a href={`mailto:${SITE.email}`} className="btn-ghost !min-h-[52px] !px-5">
                {SITE.email}
              </a>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-muted">
              <span>{t.langs}</span>
              {PARTNER_LANGS.filter((l) => l.lang !== lang).map((l) => (
                <Link key={l.lang} href={PARTNER_PATHS[l.lang]} hrefLang={l.lang} className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px]">
                  {l.name}
                </Link>
              ))}
            </p>
          </div>
          <div className="relative">
            <Photo base={photo} alt={t.h1} priority sizes="(max-width: 1024px) 100vw, 560px" className="aspect-[4/3] w-full rounded-[22px] object-cover" />
          </div>
        </div>
        <dl className="container-x grid grid-cols-2 border-t border-line lg:grid-cols-4">
          {t.stats(all.length, countries.length).map(([v, l], i) => (
            <div key={l} className={`py-5 pr-4 ${i % 2 ? 'border-l border-line pl-4 lg:pl-6' : ''} ${i > 1 ? 'border-t border-line lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l lg:pl-6' : ''}`}>
              <dt className="sr-only">{l}</dt>
              <dd className="num font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[34px]">{v}</dd>
              <dd className="mt-2 text-[14px] leading-snug text-muted">{l}</dd>
            </div>
          ))}
        </dl>
        <div className="rule-grad" />
      </section>

      {/* ───────── who we work with ───────── */}
      <section className="container-x py-12 sm:py-20" aria-labelledby="who-h">
        <h2 id="who-h" className="text-[26px] sm:text-[38px]">{t.whoTitle}</h2>
        <ul className="mt-7 grid gap-4 lg:grid-cols-3">
          {t.who.map((w) => (
            <li key={w.kind} className="flex flex-col rounded-[18px] border border-line bg-white p-5 sm:p-6">
              <h3 className="text-[19px] font-semibold leading-snug sm:text-[21px]">{w.title}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-2">{w.text(all.length)}</p>
              <a href={`#pf-${w.kind}`} className="mt-5 inline-flex min-h-11 items-center gap-2 self-start font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[4px] hover:decoration-brand-700">
                {w.cta} <span aria-hidden>→</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── how we fill a vacancy ───────── */}
      <section className="border-y border-line bg-white" aria-labelledby="how-h">
        <div className="container-x py-12 sm:py-20">
          <h2 id="how-h" className="text-[26px] sm:text-[38px]">{t.howTitle}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
            {t.how.map(([title, text], i) => (
              <li key={title}>
                <span className="block h-[3px] bg-line">
                  <span className="block h-full bg-brand-600" style={{ width: `${((i + 1) / t.how.length) * 100}%` }} />
                </span>
                <p className="num mt-3 text-[12.5px] font-semibold text-muted">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-1 text-[18px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── countries ───────── */}
      <section className="container-x py-12 sm:py-16" aria-labelledby="where-h">
        <h2 id="where-h" className="text-[22px] sm:text-[28px]">{t.countriesTitle}</h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {countries.map((c) => (
            <li key={c.code} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[14.5px] font-medium">
              <Flag code={c.code} className="h-3.5 w-[21px]" />
              {cname(c)}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[13.5px] text-muted">{t.trust}</p>
      </section>

      {/* ───────── form + FAQ ───────── */}
      <section id="partner-form" className="relative scroll-mt-24 border-t border-line bg-surface" aria-labelledby="form-h">
        {/* targets of the audience cards: the form picks the partner type from the hash */}
        {(['employer', 'agency', 'freelancer'] as const).map((k) => (
          <span key={k} id={`pf-${k}`} className="absolute top-0 scroll-mt-24" aria-hidden />
        ))}
        <div className="container-x grid gap-10 py-12 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div className="rounded-[22px] border border-line bg-white p-5 sm:p-8">
            <h2 id="form-h" className="text-[24px] sm:text-[32px]">{t.formTitle}</h2>
            <p className="mt-2 text-[15px] text-ink-2">
              {t.formSub}{' '}
              <a href={`mailto:${SITE.email}`} className="font-semibold text-brand-700 underline underline-offset-2">
                {SITE.email}
              </a>
            </p>
            <div className="mt-6">
              <PartnerForm lang={lang} />
            </div>
          </div>
          <div>
            <h2 className="text-[22px] sm:text-[28px]">{t.faqTitle}</h2>
            <div className="mt-5 divide-y divide-line border-y border-line">
              {t.faq.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[16.5px] font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden className="text-[20px] leading-none text-muted transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
