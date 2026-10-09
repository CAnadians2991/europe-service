import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { tpostFallback } from '@/lib/legacy-urls'
import { ContentView, contentMetadata, contentPaths, resolveContent } from '@/components/content/ContentRoute'

// Russian articles and pages keep their Tilda URLs; anything unknown gets the Russian 404 ((ru)/not-found.tsx)
export const dynamicParams = true
export const revalidate = 86400

type Props = { params: Promise<{ rest: string[] }> }
const pathOf = (rest: string[]) => '/ru/' + rest.map(decodeURIComponent).join('/')

export async function generateStaticParams() {
  // posts render on first visit and are cached — see (uk)/[...rest]
  return (await contentPaths('ru')).filter((p) => !p.includes('/tpost/')).map((p) => ({ rest: p.slice(4).split('/') }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return contentMetadata(pathOf((await params).rest))
}

export default async function Page({ params }: Props) {
  const path = pathOf((await params).rest)
  if (!(await resolveContent(path))) {
    // a deleted Tilda post that outside links still point to
    if (/\/tpost\//i.test(path)) permanentRedirect(tpostFallback(path))
    notFound()
  }
  return <ContentView path={path} lang="ru" />
}
