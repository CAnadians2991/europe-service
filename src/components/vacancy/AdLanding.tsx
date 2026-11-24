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

export async function AdLanding({
  lang,
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
}: {
  lang: 'uk' | 'ru'
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
}) {
  const uk = lang === 'uk'
  // the Tilda landings open with a two-line list («300+ місць», «від … €») — shown as the facts under the H1
  const facts = blocks[0]?.type === 'ul' && blocks[0].items.length <= 3 ? blocks[0].items : []
  const all = groups(facts.length ? blocks.slice(1) : blocks)
  const faqGroups = all.filter((g) => g.title && FAQ_RX.test(g.title))
  // what the country gives first, our agency's pluses last (owner: «зверху плюси і суть роботи»)
  const rank = (g: Group) => (g.title && /^(переваги|преимущества)/i.test(g.title) ? 0 : g.title && /^(чому наші|почему наши)/i.test(g.title) ? 2 : 1)
  const content = all.filter((g) => !faqGroups.includes(g)).sort((a, b) => rank(a) - rank(b))
  const n = cards.length
  const sec = 'container-x border-t border-line py-8 sm:py-12'
  return (
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

      {content.map((g, i) => (
        <section key={i} className={sec}>
          {g.title && <h2 className="text-[22px] leading-tight sm:text-[30px]">{g.title}</h2>}
          <GroupBody blocks={g.blocks} uk={uk} />
          {/* after the first section: what jobs there are, in photos */}
          {i === 0 && (
            <>
              <h2 className="mt-10 text-[22px] leading-tight sm:text-[30px]">{uk ? `Яка робота ${inName}` : `Какая работа ${inName}`}</h2>
              <JobTiles cards={cards} uk={uk} />
            </>
          )}
        </section>
      ))}

      <section id="catalog" className="scroll-mt-24 border-t border-line bg-cream/40">
        <div className="container-x py-8 sm:py-12">
          <h2 className="mb-4 text-[22px] leading-tight sm:text-[30px]">{uk ? `Актуальні вакансії ${inName}` : `Актуальные вакансии ${inName}`}</h2>
          <Catalog cards={cards} countryTotals={countByCountry(allCards)} preset={{ country: country as never }} leadForm={form} lang={lang} {...await catalogLandings(lang)} />
        </div>
      </section>

      {faqGroups.map((g, i) => (
        <section key={i} className={sec}>
          <h2 className="text-[22px] leading-tight sm:text-[30px]">{g.title}</h2>
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
