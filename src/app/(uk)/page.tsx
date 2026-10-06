import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { HomePage } from '@/components/home/HomePage'

// title and description of the Tilda home page (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "Агентство з працевлаштування в Польщі — сайт з пошуку легальної роботи",
  absoluteTitle: true,
  description: "Офіційний сайт працевлаштування в Польщі ✅ Найкраще агентство з працевлаштування ✅ Без посередників ⚡ Для сімейних пар безкоштовне проживання",
  path: '/',
})

export default function Home() {
  return <HomePage lang="uk" />
}
