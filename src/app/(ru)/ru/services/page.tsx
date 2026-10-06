import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ServicesPage } from '@/components/content/ServicesPage'

export const metadata: Metadata = pageMeta({
  title: 'Наши услуги - Europe Service',
  absoluteTitle: true,
  description: 'Пакеты услуг Europe Service: Базовый 1099 грн, Стандарт 1599 грн, Премиум 2499 грн. Польская рабочая виза, страховка, оформление документов для Германии, Нидерландов, Греции.',
  path: '/ru/services',
  lang: 'ru',
})

export default function Page() {
  return <ServicesPage lang="ru" />
}
