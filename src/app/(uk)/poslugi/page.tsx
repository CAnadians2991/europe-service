import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ServicesPage } from '@/components/content/ServicesPage'

// title and description exactly as on Tilda (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "Наші послуги - europeservice.com.ua",
  absoluteTitle: true,
  description: "Наші послуги ✅ Без посередників ⚡ Нові вакансії 2026",
  path: '/poslugi',
})

// No FAQPage JSON-LD here: this FAQ is the home page's one (HOME_FAQ), and Google wants a repeated FAQ marked up once per
// site — the home page carries it (same as /ru/services ↔ /ru)
export default function Page() {
  return <ServicesPage lang="uk" />
}
