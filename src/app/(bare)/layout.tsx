import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { fontVars } from '../fonts'
import { SITE } from '@/lib/site'

/** Pages without the site's header, footer, chat button and cookie banner — like /razemwork, a form for partners' staff */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: '%s | Europe Service' },
  robots: { index: false, follow: false },
}
export const viewport: Viewport = { themeColor: '#1560f5', width: 'device-width', initialScale: 1 }

export default function BareRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={fontVars}>
      <body className="min-h-dvh bg-white">{children}</body>
    </html>
  )
}
