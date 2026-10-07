import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { PARTNER, PARTNER_PATHS, partnerAlternates } from '@/lib/partners'
import { PartnersPage } from '@/components/partners/PartnersPage'

const base = pageMeta({
  title: PARTNER.en.metaTitle,
  absoluteTitle: true,
  description: PARTNER.en.metaDescription,
  path: PARTNER_PATHS.en,
  alternates: partnerAlternates(),
})
export const metadata: Metadata = { ...base, openGraph: { ...base.openGraph, locale: 'en_GB' } }

/** For employers, labour agencies and recruiters abroad — the Tilda address /cooperation, in English */
export default function Page() {
  return <PartnersPage lang="en" />
}
