import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ReviewsPage } from '@/components/content/ReviewsPage'

export const metadata: Metadata = pageMeta({
  title: 'Europe Service Відгуки на сайті',
  absoluteTitle: true,
  description: 'Відгуки клієнтів Europe Service про роботу за кордоном: умови, житло, зарплата, менеджери. Залиште свій відгук або заявку на вакансію.',
  path: '/vidguki',
})

export default function Page() {
  return <ReviewsPage lang="uk" />
}
