import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { PARTNER, PARTNER_PATHS, partnerAlternates } from '@/lib/partners'
import { PartnersPage } from '@/components/partners/PartnersPage'

export const metadata: Metadata = pageMeta({
  title: PARTNER.uk.metaTitle,
  absoluteTitle: true,
  description: PARTNER.uk.metaDescription,
  path: PARTNER_PATHS.uk,
  alternates: partnerAlternates(),
})

export default function Page() {
  return <PartnersPage lang="uk" />
}
