import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContentView, contentMetadata, contentPaths, resolveContent } from '@/components/content/ContentRoute'

// Russian articles and pages keep their Tilda URLs; anything unknown gets the Russian 404 ((ru)/not-found.tsx)
export const dynamicParams = true
export const revalidate = 86400

type Props = { params: Promise<{ rest: string[] }> }
const pathOf = (rest: string[]) => '/ru/' + rest.map(decodeURIComponent).join('/')

export function generateStaticParams() {
  return contentPaths('ru').map((p) => ({ rest: p.slice(4).split('/') }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return contentMetadata(pathOf((await params).rest))
}

export default async function Page({ params }: Props) {
  const path = pathOf((await params).rest)
  if (!resolveContent(path)) notFound()
  return <ContentView path={path} lang="ru" />
}
