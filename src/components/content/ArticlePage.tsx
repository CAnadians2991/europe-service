import Link from 'next/link'
import type { Article } from '@/lib/content'
import { ARTICLES, isObsolete } from '@/lib/content'
import { Blocks } from './Blocks'
import { Breadcrumbs } from '@/components/vacancy/CatalogPage'
import { JsonLd } from '@/components/seo/JsonLd'
import { LeadForm } from '@/components/lead/LeadForm'
import { Photo } from '@/components/ui/Photo'
import { SITE } from '@/lib/site'
import { faqLd } from '@/lib/seo'

export function articleSummary(a: Article) {
  if (a.seoDescription) return a.seoDescription
  const p = a.blocks.find((b) => b.type === 'p') as { text: string } | undefined
  return (p?.text || a.title).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').slice(0, 180)
}

export function ArticlePage({ a, posts = [] }: { a: Article; posts?: Article[] }) {
  const uk = a.lang === 'uk'
  const listPath = uk ? '/news' : '/ru/news'
  // freshest guides first (they carry datePublished), then the older Tilda posts
  const byDate = (x: Article, y: Article) => (y.datePublished ?? y.date ?? '').localeCompare(x.datePublished ?? x.date ?? '')
  const more = ARTICLES.filter((x) => x.lang === a.lang && x.path !== a.path && !isObsolete(x)).sort(byDate).slice(0, 3)
  const first = a.blocks[0] as { type: string; text?: string; src?: string } | undefined
  const blocks = (first?.type === 'h2' && first.text === a.title) || (first?.type === 'img' && first.src === a.cover) ? a.blocks.slice(1) : a.blocks
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: a.seoTitle || a.title,
          description: articleSummary(a),
          inLanguage: uk ? 'uk-UA' : 'ru-UA',
          mainEntityOfPage: SITE.url + a.path,
          image: a.cover ? (/\.(svg|png|jpe?g|webp)$/.test(a.cover) ? SITE.url + a.cover : `${SITE.url}${a.cover}-1200.webp`) : `${SITE.url}/og-default.jpg`,
          ...(a.datePublished ? { datePublished: a.datePublished, dateModified: a.datePublished } : {}),
          author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
          publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url, logo: { '@type': 'ImageObject', url: `${SITE.url}/brand/icon-512.png` } },
        }}
      />
      {a.faq?.length ? <JsonLd data={faqLd(a.faq)} /> : null}
      <div className="border-b border-line bg-surface">
        <div className="container-x text-ink-2">
          <Breadcrumbs
            items={[
              { name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' },
              { name: uk ? 'Новини' : 'Новости', path: listPath },
              { name: a.title, path: a.path },
            ]}
          />
        </div>
      </div>
      <article className="container-x grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 max-w-[760px]">
          <h1 className="text-[28px] leading-[1.12] text-ink sm:text-[38px]">{a.title}</h1>
          {a.outdated && (
            <p role="note" className="mt-5 rounded-2xl bg-brand-50 px-5 py-4 text-[15px] font-medium text-ink ring-1 ring-brand-200">
              {a.outdatedNote || (uk ? 'Матеріал архівний: умови могли змінитися. Актуальну інформацію уточнюйте в менеджера.' : 'Материал архивный: условия могли измениться. Актуальную информацию уточняйте у менеджера.')}
            </p>
          )}
          {a.cover && (
            <Photo base={a.cover} alt={a.title} priority sizes="(max-width: 768px) 100vw, 760px" className="mt-6 aspect-[16/9] w-full rounded-[24px] object-cover" />
          )}
          <div className="mt-6">
            <Blocks blocks={blocks} />
          </div>
          {posts.length > 0 && (
            <ul className="mt-8 grid gap-3">
              {posts.map((p) => (
                <li key={p.path}>
                  <Link href={p.path} className="block rounded-2xl bg-white px-5 py-4 font-semibold leading-snug ring-1 ring-line transition hover:text-brand-700 hover:ring-brand-300">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="lg:pt-2">
          <div className="sticky top-[96px] rounded-[26px] bg-white p-6 shadow-[var(--shadow-lift)] ring-1 ring-line">
            <p className="font-display text-lg font-semibold">{uk ? 'Потрібна допомога з документами чи роботою?' : 'Нужна помощь с документами или работой?'}</p>
            <p className="mt-1 text-sm text-ink-2">{uk ? 'Безкоштовна консультація менеджера.' : 'Бесплатная консультация менеджера.'}</p>
            <div className="mt-4">
              <LeadForm form={`article:${a.path}`} lang={a.lang} compact askMessenger={false} />
            </div>
          </div>
        </aside>
      </article>
      {more.length > 0 && (
        <section className="bg-surface py-12">
          <div className="container-x">
            <h2 className="text-[24px]">{uk ? 'Читайте також' : 'Читайте также'}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {more.map((m) => (
                <Link key={m.path} href={m.path} className="rounded-[24px] bg-white p-5 font-semibold leading-snug ring-1 ring-line transition hover:text-brand-700 hover:ring-brand-300">
                  {m.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export function ArticleList({ lang }: { lang: 'uk' | 'ru' }) {
  const byDate = (x: Article, y: Article) => (y.datePublished ?? y.date ?? '').localeCompare(x.datePublished ?? x.date ?? '')
  const all = ARTICLES.filter((a) => a.lang === lang && !a.listing)
  const fresh = all.filter((a) => !isObsolete(a)).sort(byDate)
  const archive = all.filter(isObsolete).sort(byDate)
  // the newest 24 as cards with a picture, the rest as a compact list (every article stays one click away)
  const cards = fresh.slice(0, 24)
  const rest = fresh.slice(24)
  const cover = (a: Article) => a.cover || (a.ogImage && a.ogImage.startsWith('/') ? a.ogImage : '')
  return (
    <div className="container-x py-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((a) => (
          <Link key={a.path} href={a.path} className="group overflow-hidden rounded-[24px] bg-white ring-1 ring-line transition lg:hover:shadow-[var(--shadow-lift)] hover:ring-transparent">
            <div className="aspect-[16/9] overflow-hidden bg-brand-50">
              {cover(a) ? (
                <Photo base={cover(a)} alt="" sizes="(max-width: 640px) 100vw, 380px" className="size-full object-cover" />
              ) : (
                <div className="brand-band grid size-full place-items-center p-6 text-center text-lg font-bold text-white">{a.title}</div>
              )}
            </div>
            <div className="p-5">
              <h2 className="text-[17px] leading-snug group-hover:text-brand-700">{a.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{articleSummary(a)}</p>
            </div>
          </Link>
        ))}
      </div>
      {rest.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[22px]">{lang === 'uk' ? 'Інші статті' : 'Другие статьи'}</h2>
          <ul className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {rest.map((a) => (
              <li key={a.path}>
                <Link href={a.path} className="inline-flex min-h-11 items-center py-1 text-[15px] font-medium hover:text-brand-700">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {archive.length > 0 && (
        <details className="mt-10 rounded-2xl bg-surface p-5">
          <summary className="cursor-pointer font-semibold">{lang === 'uk' ? `Архів (${archive.length})` : `Архив (${archive.length})`}</summary>
          <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
            {archive.map((a) => (
              <li key={a.path}>
                <Link href={a.path} className="inline-flex min-h-11 items-center py-1 text-[14px] text-ink-2 hover:text-brand-700">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
