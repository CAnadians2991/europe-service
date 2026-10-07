import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { IntlShell } from '@/components/partners/IntlShell'
import { SITE } from '@/lib/site'
import { siteVerification } from '@/lib/site-verification'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'Europe Service', template: '%s | Europe Service' },
  applicationName: SITE.name,
  formatDetection: { telephone: false },
  verification: siteVerification,
}
export const viewport: Viewport = { themeColor: '#1e864a', width: 'device-width', initialScale: 1 }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <IntlShell lang="en">{children}</IntlShell>
}
