import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { PageHero } from '@/components/content/PageHero'
import { ArticleList } from '@/components/content/ArticlePage'

// title and description exactly as on Tilda (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "Новости на сайте europeservice.com.ua",
  absoluteTitle: true,
  description: "Новости на сайте europeservice.com.ua ✅ Полное сопровождение и подбор вакансий ☎️ Проведем подробную консультацию ⭐ Зарплата до 40 тыс. грн/мес ➦ Жми❗",
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
