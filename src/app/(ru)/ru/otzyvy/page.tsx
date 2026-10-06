import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ReviewsPage } from '@/components/content/ReviewsPage'

export const metadata: Metadata = pageMeta({
  title: 'Europe Service отзывы компании',
  absoluteTitle: true,
  description: 'Отзывы клиентов Europe Service о работе за границей: условия, жильё, зарплата, менеджеры. Оставьте свой отзыв или заявку на вакансию.',
  path: '/ru/otzyvy',
  lang: 'ru',
})

export default function Page() {
  return <ReviewsPage lang="ru" />
}
