import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ReviewsPage } from '@/components/content/ReviewsPage'

// title and description exactly as on Tilda (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "Europe Service отзывы компании",
  absoluteTitle: true,
  description: "Europe Service отзывы компании ✅ Полное сопровождение и подбор вакансий ☎️ Проведем подробную консультацию ⭐ Зарплата до 40 тыс. грн/мес ➦ Жми❗",
  path: '/ru/otzyvy',
  lang: 'ru',
})

export default function Page() {
  return <ReviewsPage lang="ru" />
}
