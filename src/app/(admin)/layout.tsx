import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { fontVars } from '../fonts'
import { ensureCountries } from '@/lib/countries'
import { CountriesInit } from '@/components/CountriesInit'

export const metadata: Metadata = {
  title: { default: 'Адмінка — Europe Service', template: '%s — Адмінка Europe Service' },
  robots: { index: false, follow: false },
}
export const viewport: Viewport = { themeColor: '#1e864a' }

export default async function AdminRoot({ children }: { children: React.ReactNode }) {
  const extraCountries = await ensureCountries()
  return (
    <html lang="uk" className={fontVars}>
      <body className="min-h-dvh bg-surface">
        <CountriesInit list={extraCountries} />
        {children}
      </body>
    </html>
  )
}
