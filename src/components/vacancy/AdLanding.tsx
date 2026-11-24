import { HoverLink } from '@/components/ui/HoverLink'
import { Photo } from '@/components/ui/Photo'
import { Blocks, RichText } from '@/components/content/Blocks'
import { YouTube } from '@/components/content/YouTube'
import { JsonLd } from '@/components/seo/JsonLd'
import { CtaBand } from '@/components/sections/Sections'
import { faqLd } from '@/lib/seo'
import { salaryHour, salaryMonth, vacancyCity } from '@/lib/format'
import { catalogLandings } from '@/lib/catalog-landings'
import type { Block } from '@/lib/content'
import type { VacancyCard } from '@/lib/types'
import { Fragment } from 'react'
import { VideoCards } from '@/components/reviews/VideoCards'
import { countryShowcase, type Icon } from '@/lib/country-showcase'
import type { VideoCard } from '@/lib/video-reviews'
import { Catalog } from './Catalog'
import { Breadcrumbs, CatalogHero } from './CatalogPage'
import { QuizButton } from '@/components/lead/LeadModal'

/**
 * An ad landing of a country (/greece, /italy, their reviews / video pages): first what the work there is — the pluses,
 * what jobs, reviews, videos — and the vacancies at the bottom (owner 24.11.2026). The Tilda blocks are grouped by their
 * H2; «Title — text» lists become cards, quotes and videos grids. The /vacancies/… catalogs keep the list on top.
 */

type Group = { title?: string; blocks: Block[] }

const FAQ_RX = /^(часті питання|частые вопросы)/i
// «Греція: від 1090 євро; Інша країна ЄС: від 1000 євро» — the Tilda comparison rows
const VS_RX = /^([^:;]{2,20}):\s*(.+?);\s*(Інша країна ЄС|Другая страна ЕС):\s*(.+)$/

function groups(blocks: Block[]) {
  const out: Group[] = []
  let cur: Group = { blocks: [] }
  for (const b of blocks) {
    if (b.type === 'h2') {
      if (cur.title || cur.blocks.length) out.push(cur)
      cur = { title: b.text, blocks: [] }
    } else cur.blocks.push(b)
  }
  if (cur.title || cur.blocks.length) out.push(cur)
  return out
}

const isCardList = (b: Block): b is Extract<Block, { items: string[] }> => b.type === 'ul' && b.items.length > 1 && b.items.every((t) => t.includes(' — '))

function CardList({ items, uk }: { items: string[]; uk: boolean }) {
  return (
    <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t, i) => {
        const [head, ...rest] = t.split(' — ')
        const body = rest.join(' — ')
        const vs = body.match(VS_RX)
        return (
          <li key={i} className="rounded-[16px] border border-line bg-white p-4 sm:p-5">
            <p className="text-[16px] font-semibold leading-snug text-ink">{head}</p>
            {vs ? (
              <>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{vs[2].replace(/^./, (c) => c.toUpperCase())}</p>
                <p className="mt-1 text-[13px] leading-snug text-muted">
                  {uk ? 'В інших країнах ЄС' : 'В других странах ЕС'}: {vs[4]}
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">
                <RichText text={body} />
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** a group's blocks: runs of quotes / videos become grids, «Title — text» lists cards, the rest the usual prose */
function GroupBody({ blocks, uk }: { blocks: Block[]; uk: boolean }) {
  const out: React.ReactNode[] = []
  for (let i = 0; i < blocks.length; ) {
    const b = blocks[i]
    if (b.type === 'quote' || b.type === 'video') {
      const run: Block[] = []
      while (i < blocks.length && blocks[i].type === b.type) run.push(blocks[i++])
      out.push(
        b.type === 'quote' ? (
          <div key={`q${i}`} className="mt-5 grid gap-3 sm:grid-cols-2">
            {run.map((q, k) =>
              q.type === 'quote' ? (
                <figure key={k} className="rounded-[16px] border border-line bg-white p-4 sm:p-5">
                  <blockquote className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">«{q.text}»</blockquote>
                  {q.speaker && <figcaption className="mt-3 text-[13px] font-semibold text-ink">{q.speaker}</figcaption>}
                </figure>
              ) : null,
            )}
          </div>
        ) : (
          <div key={`v${i}`} className="mt-5 grid gap-3 sm:grid-cols-2 [&>div]:!my-0">
            {run.map((v, k) => (v.type === 'video' ? <YouTube key={k} id={v.youtube} title={v.title} lang={uk ? 'uk' : 'ru'} /> : null))}
          </div>
        ),
      )
      continue
    }
    if (isCardList(b)) out.push(<CardList key={`c${i}`} items={b.items} uk={uk} />)
    else
      out.push(
        <div key={`b${i}`} className="prose-pw max-w-3xl [&>*:first-child]:mt-4">
          <Blocks blocks={[b]} nested />
        </div>,
      )
    i++
  }
  return <>{out}</>
}

/** «what work»: one photo tile per kind of job (the first vacancy of each title), up to 4 */
function JobTiles({ cards, uk }: { cards: VacancyCard[]; uk: boolean }) {
  const seenTitle = new Set<string>()
  const seenPhoto = new Set<string>()
  const tiles: VacancyCard[] = []
  for (const v of cards) {
    if (!v.photo || seenTitle.has(v.title) || seenPhoto.has(v.photo)) continue
    seenTitle.add(v.title)
    seenPhoto.add(v.photo)
    tiles.push(v)
    if (tiles.length === 4) break
  }
  if (tiles.length < 2) return null
  return (
    <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((v) => {
        const pay = salaryMonth(v.salary, uk ? 'uk' : 'ru') || salaryHour(v.salary, uk ? 'uk' : 'ru')
        return (
          <li key={v.id} className="group relative overflow-hidden rounded-[16px] border border-line bg-white">
            <div className="aspect-[4/3] overflow-hidden bg-surface">
              <Photo base={v.photo} alt={v.title} sizes="(max-width: 1024px) 50vw, 300px" position={v.photoPos} className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            </div>
            <div className="p-3 sm:p-4">
              <p className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-ink sm:text-[15.5px]">
                <HoverLink href={v.path} className="after:absolute after:inset-0 after:content-['']">
                  {v.title}
                </HoverLink>
              </p>
              <p className="mt-0.5 truncate text-[12.5px] text-muted">{vacancyCity(v)}</p>
              {pay && <p className="num mt-1 text-[14px] font-semibold text-brand-700">{pay}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

type ShowcaseData = NonNullable<ReturnType<typeof countryShowcase>>

/* ---------- first screen and the pluses (owner 24.11.2026: «блоки 1 і 2 — міняй кардинально») ---------- */

const ICON_PATHS: Record<Icon, React.ReactNode> = {
  meal: <path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5m4-5v5M17 3c-1.7 1.3-2.5 3.5-2.5 6.5 0 1.4.9 2.5 2.5 2.5V21" />,
  sea: <path d="M2 16c1.7 0 1.7-1.5 3.3-1.5S7 16 8.7 16s1.6-1.5 3.3-1.5S13.6 16 15.3 16s1.7-1.5 3.4-1.5S20.3 16 22 16M2 20c1.7 0 1.7-1.5 3.3-1.5S7 20 8.7 20s1.6-1.5 3.3-1.5S13.6 20 15.3 20s1.7-1.5 3.4-1.5S20.3 20 22 20M12 3a5 5 0 0 1 5 5H7a5 5 0 0 1 5-5Z" />,
  shield: <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Zm-3 9 2 2 4-4" />,
  bus: <path d="M6 17V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v11M6 17h12M6 17v2m12-2v2M6 11h12M9 14h.01M15 14h.01" />,
  clock: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  users: <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 19v-1a4 4 0 0 0-3-3.9M15.5 3.1a3.5 3.5 0 0 1 0 6.8" />,
  city: <path d="M3 21h18M5 21V8l5-3v16M10 21V3l9 4v14M14 9h2m-2 4h2m-2 4h2M7 11h.01M7 15h.01" />,
  doc: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6m-6 4h4" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />,
}

function PlusIcon({ name }: { name: Icon }) {
  return (
    <span aria-hidden className="bg-logo grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-[0_8px_20px_-10px_rgb(26_127_110/0.8)]">
      <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICON_PATHS[name]}
      </svg>
    </span>
  )
}

/** First screen: on a phone the photo fills it with the text over it; on a desktop text left, the photo right */
function Hero({ hero, title, crumbs, n, uk, country, form }: { hero: ShowcaseData['hero']; title: string; crumbs: { name: string; path: string }[]; n: number; uk: boolean; country: string; form: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink lg:bg-cream/50">
      <div className="absolute inset-0 -z-10 lg:hidden">
        <Photo base={hero.photo} alt="" priority sizes="100vw" position={hero.pos} className="size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(6_16_12/0.45)_0%,rgb(6_16_12/0.05)_16%,rgb(6_16_12/0.15)_30%,rgb(6_16_12/0.72)_46%,rgb(6_16_12/0.9)_70%,rgb(6_16_12/0.94)_100%)]" />
      </div>
      <div className="container-x grid min-h-[min(88svh,720px)] content-between gap-8 pb-7 pt-2 lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12 lg:py-12">
        <div className="text-white/80 lg:col-span-2 lg:text-ink-2 [&_[aria-current]]:text-white/65 lg:[&_[aria-current]]:text-muted">
          <Breadcrumbs items={crumbs} />
        </div>
        <div className="lg:row-start-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur-md lg:bg-brand-50 lg:text-brand-800">
            <span className="size-2 rounded-full bg-[#66CC88]" />
            {uk ? 'Набір на сезон 2027' : 'Набор на сезон 2027'}
          </p>
          <h1 className="mt-3 text-balance text-[34px] leading-[1.05] tracking-[-0.02em] text-white [text-shadow:0_2px_16px_rgb(0_0_0/0.45)] min-[400px]:text-[38px] lg:text-[56px] lg:text-ink lg:[text-shadow:none]">{title}</h1>
          <p className="mt-3 max-w-xl text-[17px] font-medium leading-snug text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.5)] lg:text-[19px] lg:font-normal lg:text-ink-2 lg:[text-shadow:none]">{hero.sub}</p>
          <dl className="mt-5 grid grid-cols-2 gap-2 lg:mt-7 lg:grid-cols-3 lg:gap-3">
            {hero.stats.map(([v, l], i) => (
              <div key={l} className={`rounded-2xl border border-white/15 bg-black/45 px-3.5 py-2.5 backdrop-blur-md lg:border-line lg:bg-white lg:px-4 lg:py-3.5 ${i === 2 ? 'col-span-2 flex items-baseline gap-2 lg:col-span-1 lg:block' : ''}`}>
                <dt className="sr-only">{l}</dt>
                <dd className="num whitespace-nowrap text-[19px] font-bold leading-tight text-white lg:text-[21px] lg:text-ink xl:text-[23px]">{v}</dd>
                <dd className="mt-0.5 text-[13px] leading-tight text-white/90 lg:text-[13.5px] lg:text-muted">{l}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 grid gap-2.5 sm:flex lg:mt-7">
            <QuizButton id={`${form}-hero`} preset={{ country }} className="btn-accent w-full sm:w-auto">
              {uk ? 'Підібрати вакансію' : 'Подобрать вакансию'}
            </QuizButton>
            {n > 0 && (
              <a href="#catalog" className="btn w-full border-[1.5px] border-white/60 bg-black/35 text-white backdrop-blur-md hover:bg-black/50 sm:w-auto lg:border-ink/25 lg:bg-transparent lg:text-ink lg:hover:border-ink lg:hover:bg-white">
                {uk ? `Вакансії (${n})` : `Вакансии (${n})`}
              </a>
            )}
          </div>
        </div>
        <div className="hidden lg:row-start-2 lg:block">
          <Photo base={hero.photo} alt={title} priority sizes="560px" position={hero.pos} className="aspect-[4/5] max-h-[620px] w-full rounded-[28px] object-cover shadow-[0_30px_60px_-30px_rgb(15_36_27/0.55)]" />
        </div>
      </div>
    </section>
  )
}

/** Second block: what the work gives besides the pay and housing — real photos of the place + six pluses */
function Pluses({ title, pluses, alt }: { title: string; pluses: ShowcaseData['pluses']; alt: string }) {
  return (
    <section className="bg-white py-9 sm:py-14">
      <div className="container-x">
        <h2 className={H2}>{title}</h2>
        <ul className="-mx-4 mt-6 flex snap-x gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-2.5 lg:overflow-visible lg:px-0">
          {pluses.photos.map((p) => (
            <li key={p.src} className="relative w-[46%] shrink-0 snap-start overflow-hidden rounded-[16px] bg-surface sm:w-[30%] lg:w-auto">
              <Photo base={p.src} alt={`${alt}: ${p.caption}`} sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 210px" className="aspect-[4/5] w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgb(0_0_0/0.65))] px-2.5 pb-2 pt-6 text-[12.5px] font-semibold leading-tight text-white">{p.caption}</span>
            </li>
          ))}
        </ul>
        <ul className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:mt-9 lg:grid-cols-3">
          {pluses.items.map(([icon, h, p]) => (
            <li key={h} className="flex gap-3.5">
              <PlusIcon name={icon} />
              <div>
                <p className="text-[16.5px] font-semibold leading-snug text-ink">{h}</p>
                <p className="mt-0.5 text-[14.5px] leading-snug text-ink-2">{p}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** a grid of video cards; past `first` the rest open under «more» */
function VideoGrid({ items, lang, first = 8 }: { items: VideoCard[]; lang: 'uk' | 'ru'; first?: number }) {
  if (!items.length) return null
  const uk = lang === 'uk'
  const rest = items.slice(first)
  return (
    <div className="mt-5">
      <VideoCards items={items.slice(0, first)} lang={lang} />
      {rest.length > 0 && (
        <details className="group mt-4">
          <summary className="btn-ghost w-full cursor-pointer list-none sm:w-auto [&::-webkit-details-marker]:hidden">
            {uk ? `Ще відео (${rest.length})` : `Ещё видео (${rest.length})`}
          </summary>
          <div className="mt-4">
            <VideoCards items={rest} lang={lang} />
          </div>
        </details>
      )}
    </div>
  )
}

type TextReview = { name: string; text: string; date?: string; vacancy?: string; city?: string }

function ReviewCard({ r }: { r: TextReview }) {
  return (
    <figure className="rounded-[16px] border border-line bg-white p-4 sm:p-5">
      <blockquote className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">«{r.text}»</blockquote>
      <figcaption className="mt-3 text-[13px] leading-snug text-muted">
        <span className="font-semibold text-ink">{r.name}</span>
        {[r.vacancy, r.city, r.date].filter(Boolean).length > 0 && <> · {[r.vacancy, r.city, r.date].filter(Boolean).join(' · ')}</>}
      </figcaption>
    </figure>
  )
}

function ReviewGrid({ items, lang, first = 6 }: { items: TextReview[]; lang: 'uk' | 'ru'; first?: number }) {
  const uk = lang === 'uk'
  const rest = items.slice(first)
  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, first).map((r, i) => (
          <ReviewCard key={i} r={r} />
        ))}
      </div>
      {rest.length > 0 && (
        <details className="mt-4">
          <summary className="btn-ghost w-full cursor-pointer list-none sm:w-auto [&::-webkit-details-marker]:hidden">
            {uk ? `Ще відгуки (${rest.length})` : `Ещё отзывы (${rest.length})`}
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((r, i) => (
              <ReviewCard key={i} r={r} />
            ))}
          </div>
        </details>
      )}
    </>
  )
}

function PhotoGrid({ photos, alt }: { photos: string[]; alt: string }) {
  if (!photos.length) return null
  return (
    <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {photos.slice(0, 8).map((p, i) => (
        <li key={p} className="overflow-hidden rounded-[14px] bg-surface">
          <Photo base={p} alt={`${alt} ${i + 1}`} sizes="(max-width: 640px) 50vw, 300px" className="aspect-[4/3] w-full object-cover" />
        </li>
      ))}
    </ul>
  )
}

const H2 = 'text-[22px] leading-tight sm:text-[30px]'
const LEAD = 'mt-2 max-w-3xl text-[15.5px] leading-relaxed text-ink-2 sm:text-[16.5px]'

export async function AdLanding({
  lang,
  path,
  title,
  intro,
  crumbs,
  blocks,
  faq,
  cards,
  allCards,
  country,
  inName,
  form,
  vacancyReviews = [],
}: {
  lang: 'uk' | 'ru'
  path: string
  title: string
  intro: string
  crumbs: { name: string; path: string }[]
  blocks: Block[]
  faq?: { q: string; a: string }[]
  /** this country's vacancies (the list and the job tiles) */
  cards: VacancyCard[]
  /** every vacancy — the country filter's counts */
  allCards: VacancyCard[]
  country: string
  /** «в Греції» / «в Греции» */
  inName: string
  form: string
  /** reviews written on this country's vacancy pages */
  vacancyReviews?: TextReview[]
}) {
  const uk = lang === 'uk'
  const show: ShowcaseData | null = countryShowcase(country, lang)
  // the Tilda landings open with a two-line list («місця», «від … €») — shown as the facts under the H1
  const facts = blocks[0]?.type === 'ul' && blocks[0].items.length <= 3 ? blocks[0].items : []
  const all = groups(facts.length ? blocks.slice(1) : blocks)
  const faqGroups = all.filter((g) => g.title && FAQ_RX.test(g.title))
  // with the showcase the Tilda's own few quotes / videos are shown there, in full
  const onlyMedia = (g: Group) => g.blocks.length > 0 && g.blocks.every((b) => b.type === 'quote' || b.type === 'video' || b.type === 'button' || (b.type === 'p' && /^\(.*\)$/.test(b.text.trim())))
  const textGroups = all.filter((g) => !faqGroups.includes(g) && !(show && onlyMedia(g)))
  const isPlus = (g: Group) => Boolean(g.title && /^(переваги|преимущества)/i.test(g.title))
  const isAgency = (g: Group) => Boolean(g.title && /^(чому наші|почему наши)/i.test(g.title))
  const n = cards.length
  const sec = 'container-x border-t border-line py-8 sm:py-12'
  const reviews = [...(show?.reviews ?? []), ...vacancyReviews]

  const groupSection = (g: Group, i: number) => (
    <section key={`g${i}`} className={sec}>
      {g.title && <h2 className={H2}>{g.title}</h2>}
      <GroupBody blocks={g.blocks} uk={uk} />
    </section>
  )

  const S: Record<string, React.ReactNode> = {
    plus: show
      ? <Pluses key="plus" title={textGroups.find(isPlus)?.title ?? (uk ? `Переваги роботи ${inName}` : `Преимущества работы ${inName}`)} pluses={show.pluses} alt={uk ? `Робота ${inName} — фото` : `Работа ${inName} — фото`} />
      : textGroups.filter(isPlus).map(groupSection),
    life: show && show.life.length > 0 && (
      <section key="life" className={sec}>
        <h2 className={H2}>{uk ? `Робота й відпочинок ${inName}` : `Работа и отдых ${inName}`}</h2>
        <p className={LEAD}>{uk ? 'Море, туристичні курорти й робота в готелях — так виглядає сезон наших клієнтів.' : 'Море, туристические курорты и работа в отелях — так выглядит сезон наших клиентов.'}</p>
        {show.film && (
          <div className="mt-5 max-w-3xl overflow-hidden rounded-[20px] [&>div]:!my-0">
            <YouTube id={show.film.id} title={show.film.title} lang={lang} />
          </div>
        )}
        <VideoGrid items={show.life} lang={lang} />
      </section>
    ),
    jobs: (
      <section key="jobs" className={sec}>
        <h2 className={H2}>{uk ? `Яка робота ${inName}` : `Какая работа ${inName}`}</h2>
        <JobTiles cards={cards} uk={uk} />
        {show && show.workPhotos.length > 0 && (
          <>
            <h3 className="mt-8 text-[18px] sm:text-[21px]">{uk ? 'Фото з місця роботи' : 'Фото с места работы'}</h3>
            <PhotoGrid photos={show.workPhotos} alt={uk ? `Робота ${inName} — фото` : `Работа ${inName} — фото`} />
          </>
        )}
      </section>
    ),
    reviewVideos: show && show.reviewVideos.length > 0 && (
      <section key="rv" className={sec}>
        <h2 className={H2}>{uk ? 'Відеовідгуки наших клієнтів' : 'Видеоотзывы наших клиентов'}</h2>
        <VideoGrid items={show.reviewVideos} lang={lang} />
      </section>
    ),
    reviews: reviews.length > 0 && (
      <section key="rt" className={sec}>
        <h2 className={H2}>{uk ? `Відгуки про роботу ${inName}` : `Отзывы о работе ${inName}`}</h2>
        <ReviewGrid items={reviews} lang={lang} />
      </section>
    ),
    housing: show && (show.housingVideos.length > 0 || show.housingPhotos.length > 0) && (
      <section key="housing" className={sec}>
        <h2 className={H2}>{uk ? 'Житло для працівників' : 'Жильё для работников'}</h2>
        <p className={LEAD}>{uk ? 'Житло від роботодавця безкоштовне. Так живуть наші клієнти — відео й фото з місця.' : 'Жильё от работодателя бесплатное. Так живут наши клиенты — видео и фото с места.'}</p>
        <VideoGrid items={show.housingVideos} lang={lang} />
        <PhotoGrid photos={show.housingPhotos} alt={uk ? 'Житло для працівників — фото' : 'Жильё для работников — фото'} />
      </section>
    ),
    steps: show && (
      <section key="steps" className={sec}>
        <h2 className={H2}>{uk ? 'Ми все організуємо' : 'Мы всё организуем'}</h2>
        <p className={LEAD}>{uk ? 'Від першого дзвінка до виходу на роботу — і далі весь сезон.' : 'От первого звонка до выхода на работу — и дальше весь сезон.'}</p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {show.steps.map(([h, p], i) => (
            <li key={h} className="rounded-[16px] border border-line bg-white p-4 sm:p-5">
              <p className="num text-[13px] font-semibold text-brand-700">{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-1 text-[16.5px] font-semibold leading-snug text-ink">{h}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{p}</p>
            </li>
          ))}
        </ol>
        {show.howToVideos.length > 0 && (
          <>
            <h3 className="mt-8 text-[18px] sm:text-[21px]">{uk ? `Наші працівники ${inName}: документи, зв’язок, транспорт` : `Наши сотрудники ${inName}: документы, связь, транспорт`}</h3>
            <VideoGrid items={show.howToVideos} lang={lang} />
          </>
        )}
      </section>
    ),
    team: show?.team && (
      <section key="team" className={sec}>
        <h2 className={H2}>{uk ? 'Ми перевірили все самі' : 'Мы проверили всё сами'}</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <figure>
            <Photo base={show.team.photo} alt={show.team.caption} sizes="(max-width: 1024px) 100vw, 480px" className="aspect-[4/5] w-full rounded-[16px] object-cover" />
            <figcaption className="mt-2 text-[13.5px] text-muted">{show.team.caption}</figcaption>
          </figure>
          <div>
            <p className="max-w-2xl text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">{show.team.text}</p>
            <VideoGrid items={show.teamVideos} lang={lang} first={6} />
          </div>
        </div>
      </section>
    ),
    // owner 24.11.2026: «ще 1 кнопку броні десь посередині для заявки»
    book: show && (
      <section key="book" className="container-x py-6 sm:py-10">
        <div className="bg-logo grid gap-4 rounded-[24px] px-5 py-6 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:px-9 sm:py-8">
          <div>
            <p className="font-display text-[22px] font-semibold leading-tight sm:text-[28px]">{uk ? 'Забронюйте місце на сезон 2027' : 'Забронируйте место на сезон 2027'}</p>
            <p className="mt-1.5 text-[15px] text-white/90 sm:text-[16px]">{uk ? 'Найкращі готелі розбирають взимку й навесні.' : 'Лучшие отели разбирают зимой и весной.'}</p>
          </div>
          <QuizButton id={`${form}-book`} preset={{ country }} className="btn-white w-full sm:w-auto sm:px-8">
            {uk ? 'Забронювати місце' : 'Забронировать место'}
          </QuizButton>
        </div>
      </section>
    ),
    other: textGroups.filter((g) => !isPlus(g) && !isAgency(g)).map(groupSection),
    agency: textGroups.filter(isAgency).map(groupSection),
  }
  // the reviews page opens with the reviews, the video page with the videos; the main landing with the pluses
  const order = /vidguki|otzyvy/.test(path)
    ? ['reviews', 'reviewVideos', 'book', 'plus', 'life', 'jobs', 'housing', 'steps', 'team', 'other', 'agency']
    : /video/.test(path)
      ? ['reviewVideos', 'team', 'life', 'book', 'housing', 'plus', 'jobs', 'reviews', 'steps', 'other', 'agency']
      : ['plus', 'life', 'jobs', 'reviewVideos', 'reviews', 'book', 'housing', 'steps', 'team', 'other', 'agency']

  return (
    <>
      {show ? (
        <Hero hero={show.hero} title={title} crumbs={crumbs} n={n} uk={uk} country={country} form={form} />
      ) : (
        <>
          <CatalogHero title={title} text={intro} crumbs={crumbs} code={country} />
          <div className="container-x py-5 sm:py-7">
            {facts.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {facts.map((t) => (
                  <li key={t} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[14px] font-semibold text-ink">
                    {t}
                  </li>
                ))}
              </ul>
            )}
            {n > 0 && (
              <a href="#catalog" className="btn-accent mt-4 w-full sm:w-auto">
                {uk ? `Дивитись вакансії (${n})` : `Смотреть вакансии (${n})`}
              </a>
            )}
          </div>
        </>
      )}

      {order.map((k) => <Fragment key={k}>{S[k]}</Fragment>)}

      <section id="catalog" className="scroll-mt-24 border-t border-line bg-cream/40">
        <div className="container-x py-8 sm:py-12">
          <h2 className={`mb-4 ${H2}`}>{uk ? `Актуальні вакансії ${inName}` : `Актуальные вакансии ${inName}`}</h2>
          <Catalog cards={cards} countryTotals={countByCountry(allCards)} preset={{ country: country as never }} leadForm={form} lang={lang} {...await catalogLandings(lang)} />
        </div>
      </section>

      {faqGroups.map((g, i) => (
        <section key={i} className={sec}>
          <h2 className={H2}>{g.title}</h2>
          <div className="prose-pw max-w-3xl">
            <Blocks blocks={g.blocks} nested />
          </div>
        </section>
      ))}
      {faq && faq.length > 0 && <JsonLd data={faqLd(faq)} />}

      <CtaBand
        form={`${form}-bottom`}
        lang={lang}
        title={uk ? 'Не знайшли підходящу вакансію?' : 'Не нашли подходящую вакансию?'}
        text={uk ? 'Залиште заявку — підберемо роботу індивідуально з урахуванням ваших документів, досвіду та побажань щодо країни.' : 'Оставьте заявку — подберём работу индивидуально с учётом ваших документов, опыта и пожеланий по стране.'}
      />
    </>
  )
}

function countByCountry(cards: VacancyCard[]) {
  const out: Partial<Record<string, number>> = {}
  for (const c of cards) out[c.country] = (out[c.country] ?? 0) + 1
  return out
}
