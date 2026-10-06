import type { Metadata } from 'next'
import { NotFound } from '@/components/content/NotFound'

export const metadata: Metadata = { title: 'Страница не найдена', robots: { index: false } }

export default function Page() {
  return <NotFound lang="ru" />
}
