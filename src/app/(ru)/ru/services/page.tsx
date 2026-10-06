import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ServicesPage } from '@/components/content/ServicesPage'

// title and description exactly as on Tilda (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "Наши услуги - Europe Service",
  absoluteTitle: true,
  description: "Перечень всех услуг компании Europe Service ✅ Полное сопровождение и подбор вакансий ☎️ Проведем подробную консультацию ⭐ Зарплата до 80 тыс. грн/мес ➦ Жми❗",
  path: '/ru/services',
  lang: 'ru',
})

export default function Page() {
  return <ServicesPage lang="ru" />
}
