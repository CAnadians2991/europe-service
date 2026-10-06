import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { PageHero } from '@/components/content/PageHero'
import { ArticleList } from '@/components/content/ArticlePage'

export const metadata: Metadata = pageMeta({
  title: 'Новини на сайті Europe Service',
  absoluteTitle: true,
  description: 'Новини та корисні статті Europe Service: віза, документи, легальна робота в Польщі, Чехії, Німеччині та інших країнах ЄС для українців.',
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
