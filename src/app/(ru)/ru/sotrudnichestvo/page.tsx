import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { PARTNER, PARTNER_PATHS, partnerAlternates } from '@/lib/partners'
import { PartnersPage } from '@/components/partners/PartnersPage'

export const metadata: Metadata = pageMeta({
  title: PARTNER.ru.metaTitle,
  absoluteTitle: true,
  description: PARTNER.ru.metaDescription,
  path: PARTNER_PATHS.ru,
  lang: 'ru',
  alternates: partnerAlternates(),
})

export default function Page() {
  return <PartnersPage lang="ru" />
}
