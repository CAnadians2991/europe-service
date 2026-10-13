import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ServicesPage } from '@/components/content/ServicesPage'
import { packagesFrom } from '@/lib/content'

// description as on Tilda; the title says what the page answers (owner, 2026-10-13 — Tilda's «Наші послуги - europeservice.com.ua»
// told a searcher nothing); the price comes from the packages, so it stays true
export const metadata: Metadata = pageMeta({
  title: `Послуги та ціни: пакети від ${packagesFrom('uk')} — Europe Service`,
  absoluteTitle: true,
  description: "Наші послуги ✅ Без посередників ⚡ Нові вакансії 2026",
  path: '/poslugi',
})

// No FAQPage JSON-LD here: this FAQ is the home page's one (HOME_FAQ), and Google wants a repeated FAQ marked up once per
// site — the home page carries it (same as /ru/services ↔ /ru)
export default function Page() {
  return <ServicesPage lang="uk" />
}
