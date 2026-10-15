import Link from 'next/link'
import type { Article } from '@/lib/content'
import { ARTICLES, isObsolete } from '@/lib/content'
import { Blocks } from './Blocks'
import { Breadcrumbs } from '@/components/vacancy/CatalogPage'
import { JsonLd } from '@/components/seo/JsonLd'
import { LeadForm } from '@/components/lead/LeadForm'
import { Photo } from '@/components/ui/Photo'
import { EDITOR, SITE } from '@/lib/site'
import { faqLd } from '@/lib/seo'
import { formatDate } from '@/lib/format'

export function articleSummary(a: Article) {
  if (a.seoDescription) return a.seoDescription
  const p = a.blocks.find((b) => b.type === 'p') as { text: string } | undefined
  return (p?.text || a.title).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').slice(0, 180)
}

const byDate = (x: Article, y: Article) => (y.datePublished ?? y.date ?? '').localeCompare(x.datePublished ?? x.date ?? '')
const coverOf = (a: Article) => a.cover || (a.ogImage && a.ogImage.startsWith('/') ? a.ogImage : '')
const dateOf = (a: Article) => a.datePublished || a.date || ''
const dateText = (a: Article) => (dateOf(a) ? formatDate(dateOf(a), a.lang === 'uk' ? 'uk-UA' : 'ru-RU') : '')

/** Picture of a list row; without a cover — the year (or «ES») in mono on the corporate gradient */
function Thumb({ a, sizes, className = '' }: { a: Article; sizes: string; className?: string }) {
  const c = coverOf(a)
  if (c) return <Photo base={c} alt="" width={480} height={320} sizes={sizes} className={`bg-surface object-cover ${className}`} />
  return (
    <span aria-hidden className={`brand-band grid place-items-center font-mono text-[13px] font-semibold uppercase tracking-[0.08em] text-white ${className}`}>
      {dateOf(a).slice(0, 4) || 'ES'}
    </span>
  )
}

/** Mono date line; archived posts are marked */
function Meta({ a, className = '' }: { a: Article; className?: string }) {
  const d = dateText(a)
  if (!d && !a.outdated) return null
  return (
    <span className={`num flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted ${className}`}>
      {d && <time dateTime={dateOf(a).slice(0, 10)}>{d}</time>}
      {a.outdated && <span className="border border-line-strong px-1.5 py-px text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2">{a.lang === 'uk' ? 'архів' : 'архив'}</span>}
    </span>
  )
}

/** The first item of a list: a big picture, the date, the title in display type, the lead */
function LeadItem({ a, wide }: { a: Article; wide?: boolean }) {
  return (
    <Link href={a.path} className={`group block ${wide ? 'grid gap-6 border-b border-line pb-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-10' : ''}`}>
      <Thumb a={a} sizes={wide ? '(max-width: 1024px) 100vw, 680px' : '(max-width: 1024px) 100vw, 640px'} className="aspect-[16/9] w-full" />
      <span className="block">
        <Meta a={a} className={wide ? '' : 'mt-4'} />
        <span className={`mt-2 block font-display font-semibold leading-[1.15] tracking-[-0.015em] text-ink group-hover:text-brand-700 ${wide ? 'text-[22px] sm:text-[30px]' : 'text-[21px] sm:text-[23px]'}`}>{a.title}</span>
        {wide && <span className="mt-3 line-clamp-3 block text-[16px] leading-relaxed text-ink-2">{articleSummary(a)}</span>}
      </span>
    </Link>
  )
}

/** A row of the register: thumbnail, mono date, title (and on wide screens a line of the lead) */
function Row({ a, summary }: { a: Article; summary?: boolean }) {
  return (
    <li className="border-b border-line">
      <Link href={a.path} className="group grid grid-cols-[96px_minmax(0,1fr)] items-start gap-4 py-4 sm:grid-cols-[128px_minmax(0,1fr)]">
        <Thumb a={a} sizes="128px" className="aspect-[4/3] w-full" />
        <span className="min-w-0">
          <Meta a={a} />
          <span className="mt-1 block text-[16px] font-semibold leading-snug text-ink group-hover:text-brand-700 sm:text-[17px]">{a.title}</span>
          {summary && <span className="mt-1 hidden text-[15px] leading-snug text-muted sm:line-clamp-2">{articleSummary(a)}</span>}
        </span>
      </Link>
    </li>
  )
}

export function ArticlePage({ a, posts = [] }: { a: Article; posts?: Article[] }) {
  const uk = a.lang === 'uk'
  const listPath = uk ? '/news' : '/ru/news'
  // freshest guides first (they carry datePublished), then the older Tilda posts
  const more = ARTICLES.filter((x) => x.lang === a.lang && x.path !== a.path && !isObsolete(x)).sort(byDate).slice(0, 3)
  const first = a.blocks[0] as { type: string; text?: string; src?: string } | undefined
  const blocks = (first?.type === 'h2' && first.text === a.title) || (first?.type === 'img' && first.src === a.cover) ? a.blocks.slice(1) : a.blocks
  const d = dateText(a)
  const ed = EDITOR[a.lang]
  const updated = a.dateModified ? formatDate(a.dateModified, uk ? 'uk-UA' : 'ru-RU') : ''
  const label = a.listing ? (uk ? 'Рубрика' : 'Рубрика') : a.outdated ? (uk ? 'Архів' : 'Архив') : uk ? 'Новини та статті' : 'Новости и статьи'
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
          ...(a.datePublished ? { datePublished: a.datePublished, dateModified: a.dateModified || a.datePublished } : {}),
          author: a.listing
            ? { '@type': 'Organization', name: SITE.name, url: SITE.url }
            : { '@type': 'Person', name: ed.name, jobTitle: ed.jobTitle, worksFor: { '@type': 'Organization', name: SITE.name, url: SITE.url } },
          publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url, logo: { '@type': 'ImageObject', url: `${SITE.url}/brand/icon-512.png` } },
        }}
      />
      {a.faq?.length ? <JsonLd data={faqLd(a.faq)} /> : null}
      <article>
        <header className="border-b border-line bg-white">
          <div className="container-x pb-8 pt-2 sm:pb-10">
            <div className="text-ink-2">
              <Breadcrumbs
                items={[
                  { name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' },
                  { name: uk ? 'Новини' : 'Новости', path: listPath },
                  { name: a.title, path: a.path },
                ]}
              />
            </div>
            <div className="max-w-[860px]">
              <p className="eyebrow mt-4">
                <span className="size-2 bg-leaf" aria-hidden />
                {label}
                {d && (
                  <>
                    <span aria-hidden className="opacity-40">/</span>
                    <time dateTime={dateOf(a).slice(0, 10)} className="normal-case tracking-normal text-ink-2">
                      {d}
                    </time>
                  </>
                )}
              </p>
              <h1 className="mt-3 text-[27px] min-[380px]:text-[30px] sm:text-[42px]">{a.title}</h1>
              {!a.listing && (
                <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-2">
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-logo text-[12px] font-semibold text-white">
                    {ed.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')}
                  </span>
                  <span>
                    <span className="font-semibold text-ink">{ed.name}</span>, {ed.role}
                  </span>
                  {updated && (
                    <>
                      <span aria-hidden className="opacity-40">·</span>
                      <span>
                        {uk ? 'Оновлено' : 'Обновлено'} <time dateTime={a.dateModified!.slice(0, 10)}>{updated}</time>
                      </span>
                    </>
                  )}
                </p>
              )}
              {a.outdated && (
                <div role="note" className="mt-6 flex flex-col gap-3 border border-line-strong bg-surface p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5">
                  <span className="num self-start bg-ink px-2 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white">{uk ? 'Архівний матеріал' : 'Архивный материал'}</span>
                  <p className="text-[15.5px] leading-relaxed text-ink">
                    {a.outdatedNote || (uk ? 'Матеріал архівний: умови могли змінитися. Актуальну інформацію уточнюйте в менеджера.' : 'Материал архивный: условия могли измениться. Актуальную информацию уточняйте у менеджера.')}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="rule-grad" />
        </header>

        <div className="container-x grid gap-10 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
          <div className="min-w-0 max-w-[760px]">
            {a.cover && <Photo base={a.cover} alt={a.title} priority sizes="(max-width: 768px) 100vw, 760px" className="mb-8 aspect-[16/9] w-full bg-surface object-cover" />}
            <div className="[&>.prose-pw>*:first-child]:mt-0">
              <Blocks blocks={blocks} />
            </div>
            {posts.length > 0 && (
              <section className="mt-12" aria-label={uk ? 'Матеріали рубрики' : 'Материалы рубрики'}>
                <p className="eyebrow">
                  {uk ? 'Матеріали рубрики' : 'Материалы рубрики'} <span className="num opacity-60">{posts.length}</span>
                </p>
                <div className="mt-4 border-t-[3px] border-ink pt-6">
                  <LeadItem a={posts[0]} />
                </div>
                {posts.length > 1 && (
                  <ul className="mt-6 border-t border-line">
                    {posts.slice(1).map((p) => (
                      <Row key={p.path} a={p} />
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
          <aside>
            <div className="border border-line bg-white lg:sticky lg:top-[96px] lg:max-h-[calc(100dvh-120px)] lg:overflow-y-auto lg:overscroll-contain [scrollbar-width:thin]">
              <div className="rule-grad" />
              <div className="p-6">
                <p className="eyebrow">{uk ? 'Консультація' : 'Консультация'}</p>
                <p className="mt-3 font-display text-[20px] font-semibold leading-snug tracking-[-0.01em] text-ink">{uk ? 'Потрібна допомога з документами чи роботою?' : 'Нужна помощь с документами или работой?'}</p>
                <p className="mt-2 text-[15px] text-ink-2">{uk ? 'Безкоштовна консультація менеджера.' : 'Бесплатная консультация менеджера.'}</p>
                <div className="mt-5">
                  <LeadForm form={`article:${a.path}`} lang={a.lang} compact askMessenger={false} />
                </div>
                <a href={`tel:${SITE.phone}`} className="mt-4 flex min-h-11 flex-wrap items-baseline gap-x-2 border-t border-line pt-3 text-ink hover:text-brand-700">
                  <span className="num text-[17px] font-semibold">{SITE.phoneDisplay}</span>
                  <span className="text-[15px] text-muted">{uk ? 'безкоштовно' : 'бесплатно'}</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </article>

      {more.length > 0 && (
        <section className="border-t border-line bg-white py-14 sm:py-16" aria-labelledby="more-h">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{uk ? 'Ще з розділу' : 'Ещё из раздела'}</p>
                <h2 id="more-h" className="mt-3 text-[26px] sm:text-[32px]">{a.relatedTitle ?? (uk ? 'Читайте також' : 'Читайте также')}</h2>
              </div>
              <Link href={listPath} className="btn-ghost">
                {uk ? 'Усі статті' : 'Все статьи'} <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <LeadItem a={more[0]} />
              {more.length > 1 && (
                <ul className="border-t-[3px] border-ink">
                  {more.slice(1).map((m) => (
                    <Row key={m.path} a={m} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export function ArticleList({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const all = ARTICLES.filter((a) => a.lang === lang && !a.listing)
  const fresh = all.filter((a) => !isObsolete(a)).sort(byDate)
  const archive = all.filter(isObsolete).sort(byDate)
  // the newest 24 with a picture (the first one big), the rest as a compact register (every article stays one click away)
  const [lead, ...cards] = fresh.slice(0, 24)
  const rest = fresh.slice(24)
  return (
    <div className="container-x py-10 sm:py-12">
      {lead && <LeadItem a={lead} wide />}
      {cards.length > 0 && (
        <ul className="mt-2 grid lg:grid-cols-2 lg:gap-x-10">
          {cards.map((a) => (
            <Row key={a.path} a={a} summary />
          ))}
        </ul>
      )}
      {rest.length > 0 && (
        <section className="mt-14" aria-labelledby="rest-h">
          <p className="eyebrow">{uk ? 'Раніше' : 'Ранее'}</p>
          <h2 id="rest-h" className="mt-3 text-[24px] sm:text-[30px]">{uk ? 'Інші статті' : 'Другие статьи'}</h2>
          <ul className="mt-6 grid border-t-[3px] border-ink lg:grid-cols-2 lg:gap-x-10">
            {rest.map((a) => (
              <li key={a.path} className="border-b border-line">
                <Link href={a.path} className="group grid min-h-14 gap-x-4 gap-y-0.5 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-baseline">
                  <span className="num text-[12.5px] text-muted">{dateText(a) || '—'}</span>
                  <span className="text-[16px] font-medium leading-snug text-ink group-hover:text-brand-700">{a.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {archive.length > 0 && (
        <details className="group mt-12 border-y border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 py-4 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span className="num bg-ink px-2 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white">{uk ? 'Архів' : 'Архив'}</span>
            <span className="flex-1">
              {uk ? 'Архівні матеріали' : 'Архивные материалы'} <span className="num text-[14px] font-medium text-muted">({archive.length})</span>
            </span>
            <span aria-hidden className="grid size-8 shrink-0 place-items-center border border-line transition-colors group-open:border-brand-600 group-open:bg-brand-600 group-open:text-white">
              <svg viewBox="0 0 24 24" className="size-4 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </summary>
          <p className="pb-2 text-[15px] text-muted">{uk ? 'Умови в цих матеріалах могли змінитися — актуальне уточнюйте в менеджера.' : 'Условия в этих материалах могли измениться — актуальное уточняйте у менеджера.'}</p>
          <ul className="grid pb-4 lg:grid-cols-2 lg:gap-x-10">
            {archive.map((a) => (
              <li key={a.path} className="border-t border-line">
                <Link href={a.path} className="group grid min-h-12 gap-x-4 py-2.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-baseline">
                  <span className="num text-[12.5px] text-muted">{dateText(a) || '—'}</span>
                  <span className="text-[15px] leading-snug text-ink-2 group-hover:text-brand-700">{a.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
