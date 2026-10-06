import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { tpostFallback } from '@/lib/legacy-urls'
import { ContentView, contentMetadata, contentPaths, resolveContent } from '@/components/content/ContentRoute'

// articles, Tilda ad landings (/greece, /italy), legal pages, quizzes (/kviz-*, /form_*) and other Tilda pages keep their URLs
export const dynamicParams = true
export const revalidate = 86400

type Props = { params: Promise<{ rest: string[] }> }
const pathOf = (rest: string[]) => '/' + rest.map(decodeURIComponent).join('/')

export async function generateStaticParams() {
  return (await contentPaths('uk')).map((p) => ({ rest: p.slice(1).split('/') }))
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
  return <ContentView path={path} lang="uk" />
}
