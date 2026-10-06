import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { HomePage } from '@/components/home/HomePage'

// title and description of the Tilda /ru page
export const metadata: Metadata = pageMeta({
  title: "Агентство по трудоустройству в Польше — сайт по поиску легальной работы",
  absoluteTitle: true,
  description: "Официальный сайт трудоустройства в Польше ✅ Лучшее агентство по трудоустройству польша ✅ Без посредников ⚡ Для семейных пар бесплатное проживание",
  path: '/ru',
  lang: 'ru',
})

export default function Home() {
  return <HomePage lang="ru" />
}
