import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { PARTNER, PARTNER_PATHS, partnerAlternates } from '@/lib/partners'
import { PartnersPage } from '@/components/partners/PartnersPage'

const base = pageMeta({
  title: PARTNER.pl.metaTitle,
  absoluteTitle: true,
  description: PARTNER.pl.metaDescription,
  path: PARTNER_PATHS.pl,
  alternates: partnerAlternates(),
})
export const metadata: Metadata = { ...base, openGraph: { ...base.openGraph, locale: 'pl_PL' } }

export default function Page() {
  return <PartnersPage lang="pl" />
}
