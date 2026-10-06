import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ServicesPage } from '@/components/content/ServicesPage'

export const metadata: Metadata = pageMeta({
  title: 'Наші послуги - europeservice.com.ua',
  absoluteTitle: true,
  description: 'Пакети послуг Europe Service: Базовий 1099 грн, Стандарт 1599 грн, Преміум 2499 грн. Польська робоча віза, страховка, оформлення документів для Німеччини, Нідерландів, Греції.',
  path: '/poslugi',
})

// No FAQPage JSON-LD here: this FAQ is the home page's one (HOME_FAQ), and Google wants a repeated FAQ marked up once per
// site — the home page carries it (same as /ru/services ↔ /ru)
export default function Page() {
  return <ServicesPage lang="uk" />
}
