import Script from 'next/script'
import { Header } from './Header'
import { Footer } from './Footer'
import { LeadModalProvider } from '@/components/lead/LeadModal'
import { Analytics, consentBootstrap } from '@/components/Analytics'
import { ConsentBanner } from '@/components/ConsentBanner'
import { ContactFab } from './ContactFab'
import { getActiveVacancies } from '@/lib/vacancies'
import { ensureCountries } from '@/lib/countries'
import { CountriesInit } from '@/components/CountriesInit'
import { fontVars } from '@/app/fonts'
import type { CountryCode } from '@/lib/types'

export async function countryCounts(lang?: 'uk' | 'ru') {
  const all = await getActiveVacancies(lang)
  const counts: Partial<Record<CountryCode, number>> = {}
  for (const v of all) counts[v.country] = (counts[v.country] ?? 0) + 1
  return { counts, total: all.length }
}

export async function SiteShell({ lang, children }: { lang: 'uk' | 'ru'; children: React.ReactNode }) {
  const extraCountries = await ensureCountries()
  const { counts, total } = await countryCounts(lang)
  return (
    <html lang={lang} className={fontVars} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-brand-700">
          {lang === 'uk' ? 'До основного вмісту' : 'К основному содержанию'}
        </a>
        <CountriesInit list={extraCountries} />
        <LeadModalProvider lang={lang} counts={counts}>
          <Header lang={lang} counts={counts} total={total} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer lang={lang} counts={counts} />
          <ContactFab lang={lang} />
          <ConsentBanner lang={lang} />
        </LeadModalProvider>
        {/* App Router: beforeInteractive is valid in the root layout (this shell is rendered by the root layouts) */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <Script id="consent-mode" strategy="beforeInteractive">{consentBootstrap}</Script>
        <Analytics />
      </body>
    </html>
  )
}
