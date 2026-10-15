import Link from 'next/link'
import { getActiveVacancies } from '@/lib/vacancies'
import { CATEGORIES, COUNTRIES, SITE } from '@/lib/site'
import { COUNTRY_NAMES, OFFICE_CITIES, PARTNER, PARTNER_LANGS, PARTNER_PATHS, PARTNER_PLUS, SECTOR_NAMES, type PartnerLang } from '@/lib/partners'
import { TEAM_PHOTOS } from '@/components/trust/TeamStory'
import { LicenseStamp } from '@/components/trust/LicenseStamp'
import { IconCertificate, IconClock, IconUsers } from '@/components/ui/icons'
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
  const x = PARTNER_PLUS[lang]
  const all = await getActiveVacancies(lang === 'ru' ? 'ru' : 'uk')
  // live charts: open vacancies by job type and by country (the owner: «додай графіки»)
  const sectors = CATEGORIES.filter((c) => c.code !== 'other')
    .map((c) => ({ label: lang === 'uk' ? c.name : lang === 'ru' ? c.nameRu : (SECTOR_NAMES[c.code]?.[lang] ?? c.name), n: all.filter((v) => v.category === c.code).length }))
    .filter((c) => c.n)
    .sort((a, b) => b.n - a.n)
    .slice(0, 7)
  const countries = COUNTRIES.map((c) => ({ ...c, n: all.filter((v) => v.country === c.code).length })).filter((c) => c.n)
  const cname = (c: (typeof countries)[number]) => (lang === 'uk' ? c.name : lang === 'ru' ? c.nameRu : (COUNTRY_NAMES[c.code]?.[lang] ?? c.name))
  const byCountry = [...countries].sort((a, b) => b.n - a.n).slice(0, 7)
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
            {t.tildaH1 || t.seoH1 ? (
              <>
                <h1 className="mt-2 font-sans text-[14px] font-semibold leading-snug tracking-normal text-brand-700">{t.tildaH1 || t.seoH1}</h1>
                <p className="mt-2 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] text-balance sm:text-[48px] lg:text-[54px]">{t.h1}</p>
              </>
            ) : (
              <>
                <p className="mt-2 text-[14px] font-semibold text-brand-700">{t.eyebrow}</p>
                <h1 className="mt-2 text-[32px] leading-[1.05] tracking-[-0.03em] sm:text-[48px] lg:text-[54px]">{t.h1}</h1>
              </>
            )}
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

      {/* ───────── why: many recruiters, legal, fast ───────── */}
      <section className="container-x pt-12 sm:pt-16" aria-labelledby="why-h">
        <h2 id="why-h" className="text-[26px] sm:text-[36px]">{x.whyTitle}</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {x.why.map((w) => (
            <li key={w.key} className="rounded-[18px] bg-white p-5 ring-1 ring-line">
              <span className="bg-logo grid size-11 place-items-center rounded-xl text-white" aria-hidden>
                {w.key === 'team' ? <IconUsers className="size-6" /> : w.key === 'legal' ? <IconCertificate className="size-6" /> : <IconClock className="size-6" />}
              </span>
              <h3 className="mt-4 text-[19px] font-semibold leading-snug">{w.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{w.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── live charts: open vacancies by job type and by country ───────── */}
      <section className="container-x py-12 sm:py-16" aria-labelledby="data-h">
        <h2 id="data-h" className="text-[26px] sm:text-[36px]">{x.dataTitle}</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {(
            [
              [x.bySector, sectors.map((c) => ({ key: c.label, label: c.label, n: c.n, flag: '' }))],
              [x.byCountry, byCountry.map((c) => ({ key: c.code, label: cname(c), n: c.n, flag: c.code }))],
            ] as const
          ).map(([title, rows]) => {
            const max = Math.max(...rows.map((r) => r.n), 1)
            return (
              <figure key={title} className="rounded-[18px] bg-white p-5 ring-1 ring-line sm:p-6">
                <figcaption className="text-[15px] font-semibold text-muted">{title}</figcaption>
                <ul className="mt-4 grid gap-2.5">
                  {rows.map((r) => (
                    <li key={r.key} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3rem] items-center gap-3 text-[14px] sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_3.5rem]">
                      <span className="flex min-w-0 items-center gap-2 leading-tight">
                        {r.flag && <Flag code={r.flag} className="h-3.5 w-[21px]" />}
                        <span className="min-w-0">{r.label}</span>
                      </span>
                      <span className="h-3 overflow-hidden rounded-full bg-surface" aria-hidden>
                        <span className="bg-logo block h-full rounded-full" style={{ width: `${Math.max(4, (r.n / max) * 100)}%` }} />
                      </span>
                      <span className="num text-right font-semibold">{r.n}</span>
                    </li>
                  ))}
                </ul>
              </figure>
            )
          })}
        </div>
        <p className="mt-3 text-[13px] text-muted">{x.dataNote}</p>
      </section>

      {/* ───────── team, offices, the legal basis ───────── */}
      <section className="border-y border-line bg-white" aria-labelledby="team-h">
        <div className="container-x grid gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
          <div>
            <h2 id="team-h" className="text-[26px] sm:text-[36px]">{x.teamTitle}</h2>
            <p className="mt-2 text-[17px] font-semibold text-brand-700">{x.teamText}</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
              <Photo base={TEAM_PHOTOS.office} alt={x.teamTitle} sizes="(max-width: 1024px) 50vw, 360px" className="aspect-[3/4] w-full rounded-[18px] object-cover object-[50%_35%]" />
              <Photo base={TEAM_PHOTOS.sign} alt={x.teamTitle} sizes="(max-width: 1024px) 50vw, 360px" className="aspect-[3/4] w-full rounded-[18px] object-cover object-[50%_30%]" />
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {OFFICE_CITIES[lang].map((c) => (
                <li key={c} className="rounded-full bg-brand-50 px-3 py-1.5 text-[14px] font-semibold text-brand-800">{c}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[18px] bg-cream p-5 ring-1 ring-line sm:p-6">
            <h3 className="text-[19px] font-semibold">{x.legalTitle}</h3>
            <div className="mt-4 flex items-start gap-4">
              <div className="size-24 shrink-0">
                <LicenseStamp lang={lang === 'ru' ? 'ru' : 'uk'} uid="partners" className="size-full" />
              </div>
              <ul className="grid gap-1.5 text-[14.5px] leading-snug text-ink-2">
                {x.legal.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
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
