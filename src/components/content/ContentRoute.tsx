import type { Metadata } from 'next'
import Link from 'next/link'
import { ARTICLES, LEGAL, PAGES, getArticle, getLegal, hubPosts, isObsolete, pageByPath, type Article, type ContentPage } from '@/lib/content'
import { LANDINGS, getLanding } from '@/lib/landing'
import { QUIZZES, getQuiz } from '@/lib/quizzes'
import { pageMeta } from '@/lib/seo'
import { permanentRedirect } from 'next/navigation'
import { getActiveVacancies, getVacancyByPath } from '@/lib/vacancies'
import { hasRu } from '@/lib/vacancy-i18n'
import { VacancyView, vacancyPageMeta } from '@/components/vacancy/VacancyView'
import { ArticlePage, articleSummary } from './ArticlePage'
import { PageHero } from './PageHero'
import { Blocks } from './Blocks'
import { QuizLandingView } from '@/components/quiz/QuizLanding'
import { LandingCatalog } from '@/components/vacancy/VacanciesRoute'
import { InfoLanding } from './InfoLanding'
import { VisaLanding } from '@/components/visa/VisaLanding'
import { VISA_PAGES, getVisaPage } from '@/lib/visa'

type Lang = 'uk' | 'ru'

/** Pages with their own route file — the catch-all never renders them */
const OWN_ROUTES = new Set(['/', '/vacancies', '/about', '/contacts', '/poslugi', '/vidguki', '/news', '/pidbir', '/cooperation', '/ru', '/ru/about', '/ru/contacts', '/ru/services', '/ru/otzyvy', '/ru/news', '/ru/podbor'])

/** Russian news hubs (/ru/news/chekhia …) are new pages without a description of their own — a real one, not the title */
const HUB_RU: Record<string, string> = {
  chekhia: 'в Чехии',
  england: 'в Англии',
  germany: 'в Германии',
  greece: 'в Греции',
  netherlands: 'в Нидерландах',
  romania: 'в Румынии',
}
function hubDescription(a: Article): string | null {
  const m = a.listing && !a.seoDescription && a.path.match(/^\/ru\/news\/([\w-]+)$/)
  const where = m && HUB_RU[m[1]]
  return where ? `Новости для украинцев ${where}: работа и зарплаты, документы и правила въезда, жильё и жизнь в стране. Подборка статей Europe Service.` : null
}

const inLang = (p: string, lang: Lang) => (lang === 'ru' ? p.startsWith('/ru/') : !p.startsWith('/ru/') && p !== '/ru')

/** Every address the catch-all serves in a language: articles, Tilda ad landings outside /vacancies, legal pages, quizzes, other pages */
export async function contentPaths(lang: Lang) {
  const vacancies = await getActiveVacancies()
  const out = new Set<string>()
  for (const a of ARTICLES) out.add(a.path)
  for (const l of LANDINGS) if (!l.path.startsWith('/vacancies') && !l.path.startsWith('/ru/vacancies')) out.add(l.path)
  for (const l of LEGAL) out.add(l.path)
  for (const q of QUIZZES) out.add(q.path)
  for (const v of VISA_PAGES) out.add(v.path)
  for (const p of Object.values(PAGES)) if (p?.path && !p.broken) out.add(p.path)
  // open vacancy posts are prerendered (+ their Russian pages); the closed ones render on the first visit
  for (const v of vacancies) {
    if (v.path.startsWith('/vacancies') || v.path.startsWith('/vakansii')) continue
    out.add(v.path)
    if (hasRu(v)) out.add('/ru' + v.path)
  }
  return [...out].filter((p) => inLang(p, lang) && !OWN_ROUTES.has(p))
}

export async function resolveContent(path: string) {
  if (OWN_ROUTES.has(path)) return null
  const visa = getVisaPage(path)
  if (visa) return { kind: 'visa' as const, visa }
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
  // vacancy posts at their Tilda address: /tpost/<id>-<slug> (open and closed ones)
  const v = await getVacancyByPath(path)
  if (v) return { kind: 'vacancy' as const, v }
  // Russian page of a vacancy: /ru + its address; untranslated → back to the Ukrainian page
  if (path.startsWith('/ru/')) {
    const uk = await getVacancyByPath(path.slice(3))
    if (uk) return hasRu(uk) && uk.lang !== 'ru' ? { kind: 'vacancy-ru' as const, v: uk } : { kind: 'redirect' as const, to: uk.path }
  }
  return null
}

export async function contentMetadata(path: string): Promise<Metadata> {
  const r = await resolveContent(path)
  if (!r) return {}
  if (r.kind === 'redirect') return {}
  if (r.kind === 'visa') {
    const p = r.visa
    const [ukP, ruP] = p.lang === 'uk' ? [p.path, p.twin] : [p.twin, p.path]
    return pageMeta({ title: p.seoTitle, description: p.seoDescription, path: p.path, lang: p.lang, absoluteTitle: true, alternates: { uk: ukP, ru: ruP, 'x-default': ukP } })
  }
  if (r.kind === 'vacancy') return vacancyPageMeta(r.v)
  if (r.kind === 'vacancy-ru') return vacancyPageMeta(r.v, 'ru')
  if (r.kind === 'article') {
    const a = r.a
    return pageMeta({
      title: a.seoTitle || a.title,
      description: hubDescription(a) ?? articleSummary(a),
      path: a.path,
      lang: a.lang,
      image: a.cover || (a.ogImage?.startsWith('/') ? a.ogImage : undefined) || undefined,
      type: 'article',
      // archived articles keep their place in Google (they were indexed on Tilda; links may point at them)
      absoluteTitle: true,
      hreflang: Boolean(a.twin),
    })
  }
  if (r.kind === 'landing') return pageMeta({ title: r.l.title, description: r.l.description || r.l.h1, path, lang: r.l.lang, absoluteTitle: true, hreflang: Boolean(r.l.twin), canonical: r.l.canonical })
  const lang = path.startsWith('/ru/') ? 'ru' : 'uk'
  if (r.kind === 'quiz') return pageMeta({ title: r.q.title, description: r.q.description, path, lang, noindex: r.q.noindex, absoluteTitle: true })
  // Tilda indexed /privacy, /oferta, /user_deal, /declaration — so do we; their Russian copies are new (not indexed)
  if (r.kind === 'legal') return pageMeta({ title: r.doc.seoTitle || r.doc.title, description: r.doc.seoDescription || r.doc.title, path, lang, noindex: lang === 'ru', absoluteTitle: true })
  const p = r.page
  return pageMeta({ title: p.seoTitle || p.title || 'Europe Service', description: p.seoDescription || p.title || p.seoTitle || 'Europe Service', path, lang: p.lang, absoluteTitle: true, // /links was indexable on Tilda (parity); its Russian copy is ours
    noindex: path === '/ru/links' })
}

export async function ContentView({ path, lang }: { path: string; lang: Lang }) {
  const r = await resolveContent(path)
  if (!r) return null
  if (r.kind === 'redirect') permanentRedirect(r.to)
  if (r.kind === 'visa') return <VisaLanding p={r.visa} />
  if (r.kind === 'vacancy') return <VacancyView v={r.v} />
  if (r.kind === 'vacancy-ru') return <VacancyView v={r.v} as="ru" />
  const home = { name: lang === 'uk' ? 'Головна' : 'Главная', path: lang === 'uk' ? '/' : '/ru' }
  if (r.kind === 'article') return <ArticlePage a={r.a} posts={hubPosts(r.a)} />
  if (r.kind === 'landing' && r.l.kind === 'info' && r.l.country === 'all') return <InfoLanding l={r.l} path={path} />
  if (r.kind === 'landing') return <LandingCatalog lang={r.l.lang} landing={r.l} path={path} active={await getActiveVacancies(r.l.lang)} />
  if (r.kind === 'quiz') return <QuizLandingView q={r.q} lang={lang} />
  if (r.kind === 'legal') {
    return (
      <>
        <PageHero title={r.doc.title} crumbs={[home, { name: r.doc.title, path }]} />
        <div className="container-x py-10">
          <div className="max-w-[860px]">
            <Blocks blocks={r.doc.blocks} />
          </div>
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
      <div className="container-x py-10 sm:py-12">
        <div className="max-w-[820px]">
          {items.length > 0 && (
            <ul className="mb-10 border-t-[3px] border-ink">
              {items.map((it) => {
                const inner = (
                  <>
                    <span className="flex-1">{it.label || it.text}</span>
                    <span aria-hidden className="text-[18px] text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-700">
                      {it.href.startsWith('/') ? '→' : '↗'}
                    </span>
                  </>
                )
                const cls = 'group flex min-h-14 items-center gap-4 py-3 text-[17px] font-semibold text-ink hover:text-brand-700'
                return (
                  <li key={it.href + (it.label || it.text)} className="border-b border-line">
                    {it.href.startsWith('/') ? (
                      <Link href={it.href} className={cls}>
                        {inner}
                      </Link>
                    ) : (
                      <a href={it.href} target="_blank" rel="noopener" className={cls}>
                        {inner}
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <div className="[&>.prose-pw>*:first-child]:mt-0">
            <Blocks blocks={page.blocks ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}
