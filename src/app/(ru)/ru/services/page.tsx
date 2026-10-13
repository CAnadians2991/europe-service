import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ServicesPage } from '@/components/content/ServicesPage'
import { packagesFrom } from '@/lib/content'

// description as on Tilda; the title as on /poslugi (owner, 2026-10-13)
export const metadata: Metadata = pageMeta({
  title: `Услуги и цены: пакеты от ${packagesFrom('ru')} — Europe Service`,
  absoluteTitle: true,
  description: "Перечень всех услуг компании Europe Service ✅ Полное сопровождение и подбор вакансий ☎️ Проведем подробную консультацию ⭐ Зарплата до 80 тыс. грн/мес ➦ Жми❗",
  path: '/ru/services',
  lang: 'ru',
})

export default function Page() {
  return <ServicesPage lang="ru" />
}
