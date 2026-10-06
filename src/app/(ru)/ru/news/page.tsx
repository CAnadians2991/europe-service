import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { PageHero } from '@/components/content/PageHero'
import { ArticleList } from '@/components/content/ArticlePage'

export const metadata: Metadata = pageMeta({
  title: 'Новости на сайте europeservice.com.ua',
  absoluteTitle: true,
  description: 'Новости и полезные статьи Europe Service: виза, документы, легальная работа в Польше, Чехии, Германии и других странах ЕС для украинцев.',
  path: '/ru/news',
  lang: 'ru',
})

export default function Page() {
  return (
    <>
      <PageHero title="Новости и полезные статьи" text="Виза, документы, легальная работа за границей — инструкции и новости от Europe Service." crumbs={[{ name: 'Главная', path: '/ru' }, { name: 'Новости', path: '/ru/news' }]} />
      <ArticleList lang="ru" />
    </>
  )
}
