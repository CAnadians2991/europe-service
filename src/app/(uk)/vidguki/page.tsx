import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ReviewsPage } from '@/components/content/ReviewsPage'
import { TildaLd } from '@/components/seo/JsonLd'

// title and description exactly as on Tilda (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "Europe Service Відгуки на сайті",
  absoluteTitle: true,
  description: "Europe Service Відгуки ✅ Без посередників ⚡ Нові вакансії Польща 2026",
  path: '/vidguki',
})

export default function Page() {
  return (
    <>
      <TildaLd path="/vidguki" />
      <ReviewsPage lang="uk" />
    </>
  )
}
