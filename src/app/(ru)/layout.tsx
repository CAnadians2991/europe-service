import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { SiteShell } from '@/components/layout/SiteShell'
import { SITE } from '@/lib/site'
import { siteVerification } from '@/lib/site-verification'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'Europe Service — работа в Европе для украинцев', template: '%s | Europe Service' },
  description:
    'Официальное кадровое агентство Europe Service: работа в Польше, Чехии, Германии, Нидерландах. Вакансии с жильём, официальный договор, полное сопровождение.',
  applicationName: SITE.name,
  formatDetection: { telephone: false },
  manifest: '/manifest.webmanifest',
  verification: siteVerification,
}

export const viewport: Viewport = {
  themeColor: '#1e864a',
  width: 'device-width',
  initialScale: 1,
}

export default function RuLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="ru">{children}</SiteShell>
}
