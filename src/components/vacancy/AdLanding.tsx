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
import { countryShowcase } from '@/lib/country-showcase'
import type { VideoCard } from '@/lib/video-reviews'
import { Catalog } from './Catalog'
import { CatalogHero } from './CatalogPage'

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
    plus: textGroups.filter(isPlus).map(groupSection),
    life: show && show.life.length > 0 && (
      <section key="life" className={sec}>
        <h2 className={H2}>{uk ? `Робота й відпочинок ${inName}` : `Работа и отдых ${inName}`}</h2>
        <p className={LEAD}>{uk ? 'Море, туристичні курорти й робота в готелях — так виглядає сезон наших клієнтів.' : 'Море, туристические курорты и работа в отелях — так выглядит сезон наших клиентов.'}</p>
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
    other: textGroups.filter((g) => !isPlus(g) && !isAgency(g)).map(groupSection),
    agency: textGroups.filter(isAgency).map(groupSection),
  }
  // the reviews page opens with the reviews, the video page with the videos; the main landing with the pluses
  const order = /vidguki|otzyvy/.test(path)
    ? ['reviews', 'reviewVideos', 'plus', 'life', 'jobs', 'housing', 'steps', 'other', 'agency']
    : /video/.test(path)
      ? ['reviewVideos', 'life', 'housing', 'plus', 'jobs', 'reviews', 'steps', 'other', 'agency']
      : ['plus', 'life', 'jobs', 'reviewVideos', 'reviews', 'housing', 'steps', 'other', 'agency']

  return (
    <>
      <CatalogHero title={title} text={intro} crumbs={crumbs} code={country} />
      <div className={`container-x grid gap-6 py-5 sm:py-7 ${show?.film ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center' : ''}`}>
        <div>
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
        {show?.film && (
          <div className="overflow-hidden rounded-[16px] [&>div]:!my-0">
            <YouTube id={show.film.id} title={show.film.title} lang={lang} />
          </div>
        )}
      </div>

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
