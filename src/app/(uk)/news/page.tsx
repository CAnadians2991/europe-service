import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { PageHero } from '@/components/content/PageHero'
import { ArticleList } from '@/components/content/ArticlePage'

// title and description exactly as on Tilda (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "Новини на сайті Europe Service",
  absoluteTitle: true,
  description: "Новини на сайті Europe Service ✅ Без посередників ⚡ Нові вакансії Польща 2026 ✈️ Допоможемо з візою і виїздом ",
  path: '/news',
})

export default function Page() {
  return (
    <>
      <PageHero title="Новини та корисні статті" text="Віза, документи, легальна робота за кордоном — інструкції та новини від Europe Service." crumbs={[{ name: 'Головна', path: '/' }, { name: 'Новини', path: '/news' }]} />
      <ArticleList lang="uk" />
    </>
  )
}
