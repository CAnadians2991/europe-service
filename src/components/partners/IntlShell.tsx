import Link from 'next/link'
import Script from 'next/script'
import { fontVars } from '@/app/fonts'
import { SITE } from '@/lib/site'
import { Analytics, consentBootstrap } from '@/components/Analytics'
import { PARTNER_LANGS, PARTNER_PATHS, type PartnerLang } from '@/lib/partners'

const KYIV = SITE.offices.find((o) => 'main' in o && o.main) ?? SITE.offices[0]

const T = {
  en: { site: 'For candidates (Ukrainian)', legal: 'Europe Service Ukraine LLC · EDRPOU 42515343 · Licence of the Ministry of Social Policy of Ukraine № 223 of 15.02.2019', office: 'Head office: Kyiv, 77 Sichovykh Striltsiv St., office 612' },
  pl: { site: 'Dla kandydatów (po ukraińsku)', legal: 'Europe Service Ukraine LLC · EDRPOU 42515343 · Licencja Ministerstwa Polityki Społecznej Ukrainy nr 223 z 15.02.2019', office: 'Biuro główne: Kijów, ul. Sicz. Strilciw 77, biuro 612' },
}

/** Light shell for the English and Polish B2B pages: logo, the four languages, email; requisites in the footer */
export function IntlShell({ lang, children }: { lang: 'en' | 'pl'; children: React.ReactNode }) {
  const t = T[lang]
  return (
    <html lang={lang} className={fontVars}>
      <body className="flex min-h-dvh flex-col bg-cream">
        <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
          <div className="container-x flex h-16 items-center gap-3">
            <Link href={PARTNER_PATHS[lang]} aria-label="Europe Service" className="mr-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.svg" alt="Europe Service" width={160} height={43} className="h-[34px] w-auto" />
            </Link>
            <nav aria-label="Language" className="flex items-center gap-1 text-[13px] font-semibold">
              {PARTNER_LANGS.map((l) =>
                l.lang === (lang as PartnerLang) ? (
                  <span key={l.lang} aria-current="true" className="grid h-9 min-w-9 place-items-center rounded-lg bg-ink px-2 text-white">
                    {l.label}
                  </span>
                ) : (
                  <Link key={l.lang} href={PARTNER_PATHS[l.lang]} hrefLang={l.lang} className="grid h-9 min-w-9 place-items-center rounded-lg px-2 text-muted hover:bg-brand-50 hover:text-ink">
                    {l.label}
                  </Link>
                ),
              )}
            </nav>
            <a href={`mailto:${SITE.email}`} className="btn-accent hidden !min-h-10 !px-4 !text-[14px] sm:inline-flex">
              {SITE.email}
            </a>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="bg-night py-10 text-white/80">
          <div className="container-x space-y-3 text-[14px] leading-relaxed">
            <p className="font-display text-[20px] font-semibold text-white">Europe Service</p>
            <p>{t.legal}</p>
            <p>{t.office}</p>
            <p className="flex flex-wrap gap-x-5 gap-y-1">
              <a href={`mailto:${SITE.email}`} className="text-white underline underline-offset-2">{SITE.email}</a>
              {KYIV && (
                <a href={`tel:${KYIV.phone}`} className="num text-white underline underline-offset-2">
                  {KYIV.phoneDisplay}
                </a>
              )}
              <Link href="/" hrefLang="uk" className="text-white/80 underline underline-offset-2">{t.site}</Link>
            </p>
          </div>
        </footer>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <Script id="consent-mode" strategy="beforeInteractive">{consentBootstrap}</Script>
        <Analytics />
      </body>
    </html>
  )
}
