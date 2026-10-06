import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { SiteShell } from '@/components/layout/SiteShell'
import { SITE } from '@/lib/site'
import { siteVerification } from '@/lib/site-verification'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'Europe Service — робота в Європі для українців', template: '%s | Europe Service' },
  description:
    'Офіційне кадрове агентство Europe Service: робота в Польщі, Чехії, Німеччині, Нідерландах та інших країнах ЄС. Вакансії з житлом, офіційний договір, повний супровід.',
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

export default function UkLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="uk">{children}</SiteShell>
}
