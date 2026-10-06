import type { Metadata } from 'next'
import Link from 'next/link'
import { ARTICLES, LEGAL, PAGES, getArticle, getLegal, hubPosts, isObsolete, pageByPath, type ContentPage } from '@/lib/content'
import { LANDINGS, getLanding } from '@/lib/landing'
import { QUIZZES, getQuiz } from '@/lib/quizzes'
import { pageMeta } from '@/lib/seo'
import { getActiveVacancies } from '@/lib/vacancies'
import { ArticlePage, articleSummary } from './ArticlePage'
import { PageHero } from './PageHero'
import { Blocks } from './Blocks'
import { QuizLandingView } from '@/components/quiz/QuizLanding'
import { LandingCatalog } from '@/components/vacancy/VacanciesRoute'

type Lang = 'uk' | 'ru'

/** Pages with their own route file — the catch-all never renders them */
const OWN_ROUTES = new Set(['/', '/about', '/contacts', '/poslugi', '/vidguki', '/news', '/pidbir', '/cooperation', '/ru', '/ru/about', '/ru/contacts', '/ru/services', '/ru/otzyvy', '/ru/news', '/ru/podbor'])

const inLang = (p: string, lang: Lang) => (lang === 'ru' ? p.startsWith('/ru/') : !p.startsWith('/ru/') && p !== '/ru')

/** Every address the catch-all serves in a language: articles, Tilda ad landings outside /vacancies, legal pages, quizzes, other pages */
export function contentPaths(lang: Lang) {
  const out = new Set<string>()
  for (const a of ARTICLES) out.add(a.path)
  for (const l of LANDINGS) if (!l.path.startsWith('/vacancies') && !l.path.startsWith('/ru/vacancies')) out.add(l.path)
  for (const l of LEGAL) out.add(l.path)
  for (const q of QUIZZES) out.add(q.path)
  for (const p of Object.values(PAGES)) if (p?.path && !p.broken) out.add(p.path)
  return [...out].filter((p) => inLang(p, lang) && !OWN_ROUTES.has(p))
}

export function resolveContent(path: string) {
  if (OWN_ROUTES.has(path)) return null
  const a = getArticle(path)
  if (a) return { kind: 'article' as const, a }
  const l = getLanding(path)
  if (l) return { kind: 'landing' as const, l }
  const q = getQuiz(path)
  if (q) return { kind: 'quiz' as const, q }
  const doc = getLegal(path)
  if (doc) return { kind: 'legal' as const, doc }
  const page = pageByPath(path)
  // the Tilda «linktree» page was blank (next.config redirects it to /links)
  if (page && !page.broken) return { kind: 'page' as const, page }
  return null
}

export function contentMetadata(path: string): Metadata {
  const r = resolveContent(path)
  if (!r) return {}
  if (r.kind === 'article') {
    const a = r.a
    return pageMeta({
      title: a.seoTitle || a.title,
      description: articleSummary(a),
      path: a.path,
      lang: a.lang,
      image: a.cover || (a.ogImage?.startsWith('/') ? a.ogImage : undefined) || undefined,
      type: 'article',
      noindex: isObsolete(a),
      absoluteTitle: true,
      hreflang: Boolean(a.twin),
    })
  }
  if (r.kind === 'landing') return pageMeta({ title: r.l.title, description: r.l.description || r.l.h1, path, lang: r.l.lang, absoluteTitle: true, hreflang: Boolean(r.l.twin) })
  if (r.kind === 'quiz') return pageMeta({ title: r.q.title, description: r.q.description, path, noindex: r.q.noindex, absoluteTitle: true })
  if (r.kind === 'legal') return pageMeta({ title: r.doc.seoTitle || r.doc.title, description: r.doc.seoDescription || r.doc.title, path, noindex: true, absoluteTitle: true })
  const p = r.page
  return pageMeta({ title: p.seoTitle || p.title || 'Europe Service', description: p.seoDescription || p.title || p.seoTitle || 'Europe Service', path, lang: p.lang, absoluteTitle: true, noindex: /link/.test(path) })
}

export async function ContentView({ path, lang }: { path: string; lang: Lang }) {
  const r = resolveContent(path)
  if (!r) return null
  const home = { name: lang === 'uk' ? 'Головна' : 'Главная', path: lang === 'uk' ? '/' : '/ru' }
  if (r.kind === 'article') return <ArticlePage a={r.a} posts={hubPosts(r.a)} />
  if (r.kind === 'landing') return <LandingCatalog lang={r.l.lang} landing={r.l} path={path} active={await getActiveVacancies()} />
  if (r.kind === 'quiz') return <QuizLandingView q={r.q} lang={lang} />
  if (r.kind === 'legal') {
    return (
      <>
        <PageHero title={r.doc.title} crumbs={[home, { name: r.doc.title, path }]} />
        <div className="container-x max-w-[860px] py-10">
          <Blocks blocks={r.doc.blocks} />
        </div>
      </>
    )
  }
  return <GenericPage page={r.page} home={home} />
}

function GenericPage({ page, home }: { page: ContentPage; home: { name: string; path: string } }) {
  const items = ((Array.isArray(page.items) ? page.items : []) as { label?: string; text?: string; href?: string | null }[]).filter(
    (it): it is { label?: string; text?: string; href: string } => Boolean(it.href && (it.label || it.text)),
  )
  const title = page.title || page.seoTitle || 'Europe Service'
  return (
    <>
      <PageHero title={title} text={typeof page.subtitle === 'string' ? page.subtitle : undefined} crumbs={[home, { name: title, path: page.path }]} />
      <div className="container-x max-w-[860px] py-10">
        {items.length > 0 && (
          <ul className="mb-8 grid gap-3">
            {items.map((it) => (
              <li key={it.href + (it.label || it.text)}>
                {it.href.startsWith('/') ? (
                  <Link href={it.href} className="btn-primary w-full justify-center">
                    {it.label || it.text}
                  </Link>
                ) : (
                  <a href={it.href} target="_blank" rel="noopener" className="btn-primary w-full justify-center">
                    {it.label || it.text}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        <Blocks blocks={page.blocks ?? []} />
      </div>
    </>
  )
}
