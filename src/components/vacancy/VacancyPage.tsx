import { HoverLink } from '@/components/ui/HoverLink'
import { vacancyMedia } from '@/lib/vacancy-media'
import tildaLabels from '@/data/tilda-post-labels.json'
import { VideoCards } from '@/components/reviews/VideoCards'
import { Gallery } from './Gallery'
import { VacancyCard } from './VacancyCard'
import { Breadcrumbs } from './CatalogPage'
import { ContactLinks } from './ContactLinks'
import { QuickApply } from './QuickApply'
import { LicenseBadge } from '@/components/trust/LicenseBadge'
import { ANY_REQUEST, AnyRequest } from '@/components/lead/AnyRequest'
import { LeadForm } from '@/components/lead/LeadForm'
import { ChatButtons } from '@/components/lead/ChatButtons'
import { HeaderVacancyAction } from '@/components/lead/LeadModal'
import { JsonLd } from '@/components/seo/JsonLd'
import { YouTube } from '@/components/content/YouTube'
import { Photo, src } from '@/components/ui/Photo'
import { ReviewCard, SectionHead } from '@/components/sections/Sections'
import { IconArrow, IconHome, IconPhone } from '@/components/ui/icons'
import { CATALOG_PATH, CATALOG_PATH_RU, CATEGORY, COUNTRY, SITE } from '@/lib/site'
import { jobPostingLd } from '@/lib/seo'
import { salaryHour, salaryMonth, vacancyCity } from '@/lib/format'
import { toCard } from '@/lib/vacancies'
import { localize } from '@/lib/vacancy-i18n'
import { ruTwin } from '@/lib/alt-routes'
import { REVIEWS, type ReviewItem } from '@/lib/content'
import { videoCards } from '@/lib/video-reviews'
import type { Review, Vacancy } from '@/lib/types'
import { Strands } from '@/components/motion/Strands'

const norm = (t: string) => t.toLowerCase().replace(/[^a-zа-яіїєґё0-9]/gi, '')

/** the kind of work in a review's «vacancy» stamp, by the vacancy's category */
const KIND: Partial<Record<string, RegExp>> = {
  warehouse: /склад|комплект|сортув|пакув|логіст/i, factory: /завод|виробн|фабрик|оператор|цех/i, auto: /авто|завод|оператор/i,
  food: /м.?яс|харч|птах|печив|солод|шоколад|сніданк|риб/i, retail: /магазин|супермаркет|касир|викладк/i, horeca: /готел|покоїв|офіціант|кухар|ресепш|кемпінг/i,
  cleaning: /прибир|клінінг|покоїв/i, agro: /ферм|теплиц|збир|сільськ/i,
}
/** reviews of the whole site for a vacancy without its own (owner 2026-10-26: reviews on every vacancy, as on the concept):
 *  the same employer first, then the same city, then the same kind of work; fresh ones first among equals */
function relevantReviews<T extends Pick<ReviewItem, 'vacancy' | 'city' | 'date'>>(v: Vacancy, list: T[], n: number): T[] {
  const company = (v.company ?? '').toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').split(' ').filter((w) => w.length > 2)
  const city = (vacancyCity(v) ?? '').toLowerCase()
  const kind = KIND[v.category]
  const score = (r: T) => {
    const hay = `${r.vacancy ?? ''} ${r.city ?? ''}`.toLowerCase()
    return (company.some((w) => hay.includes(w)) ? 10 : 0) + (city && hay.includes(city) ? 6 : 0) + (kind?.test(r.vacancy ?? '') ? 3 : 0)
  }
  const d = (r: T) => (r.date ?? '').split('.').reverse().join('')
  return list.map((r) => ({ r, s: score(r) })).sort((a, b) => b.s - a.s || d(b.r).localeCompare(d(a.r))).slice(0, n).map((x) => x.r)
}
/** Tilda pasted its own crumbs into some intros («Главная / Вакансии / Philips») — not content */
const isCrumbTrail = (t: string) => /^(главная|головна)\s*\//i.test(t.trim())
/** «Проживання» / «Житло» / «Проживание» / «Жильё»: the housing photos belong in this block */
const isHousing = (title: string) => /прожив|житл|жил[ьи]/i.test(title)
/** «Робота:» — a short line ending with a colon is a sub-heading inside a list */
const isSubhead = (it: string) => /:\s*$/.test(it) && it.length < 60
/** Section titles that were <h3> labels in Tilda's post text («Відгуки про роботу:», «Отзывы о работе:») keep that level */
const isTildaH3 = (title: string) => /^(відгуки? про роботу|отзывы? о работе)\s*:?$/i.test(title.trim())
/** Tilda's own labels in the post («Відео з роботи:», «Огляд продукції:», «Фото житла:», «Відгуки про роботу:») — shown as on Tilda */
type PostLabels = { videos?: string[]; housing?: string[]; reviews?: string[]; photos?: string[]; yt?: string[] }
const LABELS = tildaLabels as Record<string, PostLabels>
/** «безкоштовне» alone repeats the green tag */
const isJustFree = (t: string) => /^(безкоштовн|бесплатн)\S*\.?$/i.test(t.trim())

const TX = {
  uk: {
    home: 'Головна', vac: 'Вакансії', work: 'Робота',
    terms: 'Ключові умови', salary: 'Зарплата', net: 'на руки', gross: 'брутто',
    place: 'Місце роботи', schedule: 'Графік', contract: 'Договір', housing: 'Проживання', employer: 'Роботодавець', free: 'Житло безкоштовно',
    apply: 'Заявка на вакансію', book: 'Забронювати місце', bookText: 'Залиште номер — менеджер перевірить наявність місць і розповість деталі.',
    callback: 'Менеджер зателефонує й розповість деталі.',
    faster: 'Швидше — напишіть нам:', channels: 'Нові вакансії першими — у наших каналах:', orCall: 'Безкоштовно з усіх операторів',
    desc: 'Опис вакансії',
    // «Фото житла:», «Відгуки про роботу» — Tilda's <h3> labels of the vacancy posts
    housingPhotos: 'Фото житла:', housingAlt: 'Житло для працівників — фото',
    videos: 'Відео з місця роботи', reviews: 'Відгуки про роботу', leaveReview: 'Працювали тут? Залиште відгук',
    how: 'Як виїхати на цю вакансію',
    steps: [
      ['Заявка', 'Залишаєте номер — менеджер телефонує й відповідає на всі питання.'],
      ['Документи та реєстрація', 'Готуємо документи й реєструємо вас у базі роботодавця, бронюємо місце.'],
      ['Маршрутний лист', 'За 2–3 дні до виїзду надсилаємо адресу та контакти координатора.'],
      ['Приїзд і старт роботи', 'Вас зустрічає координатор роботодавця й допомагає з оформленням.'],
    ],
    freeNote: 'Вакансія для вас безкоштовна — оплачуються лише послуги агентства з оформлення.', prices: 'Пакети та ціни',
    income: 'Орієнтовний дохід залежить від кількості відпрацьованих годин. Актуальні умови уточнюйте в менеджера.',
    also: 'Дивіться також', alsoLabel: 'Схожі вакансії', all: 'Усі вакансії',
  },
  ru: {
    home: 'Главная', vac: 'Вакансии', work: 'Работа',
    terms: 'Ключевые условия', salary: 'Зарплата', net: 'на руки', gross: 'брутто',
    place: 'Место работы', schedule: 'График', contract: 'Договор', housing: 'Проживание', employer: 'Работодатель', free: 'Жильё бесплатно',
    apply: 'Заявка на вакансию', book: 'Забронировать место', bookText: 'Оставьте номер — менеджер проверит наличие мест и расскажет детали.',
    callback: 'Менеджер позвонит и расскажет детали.',
    faster: 'Быстрее — напишите нам:', channels: 'Новые вакансии первыми — в наших каналах:', orCall: 'Бесплатно со всех операторов',
    desc: 'Описание вакансии',
    housingPhotos: 'Фото жилья:', housingAlt: 'Жильё для работников — фото',
    videos: 'Видео с места работы', reviews: 'Отзывы о работе', leaveReview: 'Работали здесь? Оставьте отзыв',
    how: 'Как выехать на эту вакансию',
    steps: [
      ['Заявка', 'Оставляете номер — менеджер звонит и отвечает на все вопросы.'],
      ['Документы и регистрация', 'Готовим документы и регистрируем вас в базе работодателя, бронируем место.'],
      ['Маршрутный лист', 'За 2–3 дня до выезда отправляем адрес и контакты координатора.'],
      ['Приезд и начало работы', 'Вас встречает координатор работодателя и помогает с оформлением.'],
    ],
    freeNote: 'Вакансия для вас бесплатна — оплачиваются только услуги агентства по оформлению.', prices: 'Пакеты и цены',
    income: 'Ориентировочный доход зависит от количества отработанных часов. Актуальные условия уточняйте у менеджера.',
    also: 'Смотрите также', alsoLabel: 'Похожие вакансии', all: 'Все вакансии',
  },
}

/** Heading row of a register block: 3-px ink rule, optional mono number, the title, something on the right.
 * `as="h3"`: a block Tilda's post headed with an <h3> (the reviews) keeps that level, styled the same. */
function RegisterHead({ id, n, title, aside, as: Tag = 'h2' }: { id: string; n?: number; title: string; aside?: React.ReactNode; as?: 'h2' | 'h3' }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-[3px] border-ink pt-4">
      {/* the mono number sits outside the heading: the heading text is the section title alone */}
      <div className="flex items-baseline gap-3">
        {n != null && <span className="num shrink-0 text-[14px] font-medium tracking-normal text-brand-700">{String(n).padStart(2, '0')}</span>}
        <Tag id={id} className="font-display text-[20px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[23px]">
          {title}
        </Tag>
      </div>
      {aside}
    </div>
  )
}

/** Tilda texts mark emphasis as «*безкоштовно*» — show it bold instead of the asterisks */
function Emph({ text }: { text: string }) {
  const parts = text.split(/\*([^*\n]+)\*/)
  return parts.length === 1 ? text : parts.map((p, k) => (k % 2 ? <strong key={k} className="font-semibold text-ink">{p}</strong> : p))
}

/** Items of a Tilda section: square bullets, short «…:» lines as sub-heads */
function RegisterList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3">
      {items.map((it, k) =>
        isSubhead(it) ? (
          <li key={k} className="pb-1 pt-4 text-[16px] font-semibold text-ink first:pt-1">
            {it}
          </li>
        ) : (
          <li key={k} className="flex gap-3.5 border-b border-line py-2.5 text-[16px] leading-relaxed text-ink-2 last:border-b-0">
            <span aria-hidden className="mt-[0.62em] size-[7px] shrink-0 bg-brand-500" />
            <span className="min-w-0">
              <Emph text={it} />
            </span>
          </li>
        ),
      )}
    </ul>
  )
}

/** Vacancy reviews are written as the client wrote them (mostly Ukrainian) — mark the language for screen readers */
function toReviewItem(r: Review, lang: 'uk' | 'ru'): ReviewItem {
  return {
    name: r.name,
    text: r.text,
    lang: /[іїєґ]/i.test(r.text) ? 'uk' : /[ыэъё]/i.test(r.text) ? 'ru' : lang,
    date: r.date,
    // dated reviews (from the clients' group) show stars only if the client rated; older ones keep 5
    rating: r.rating ?? (r.date ? undefined : 5),
  }
}

/** Old Russian Tilda posts arrive with lang = 'ru' (their own text is Russian); the similar vacancies get their Russian texts here */
export function VacancyPage({ v, similar, lang = 'uk' }: { v: Vacancy; similar: Vacancy[]; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const t = TX[lang]
  const c = COUNTRY[v.country]
  const cName = c ? (uk ? c.name : c.nameRu) : v.country.toUpperCase()
  const catalog = uk ? CATALOG_PATH : CATALOG_PATH_RU
  const cPath = c ? (uk ? c.path : (ruTwin(c.path) ?? catalog)) : catalog
  const cat = CATEGORY[v.category]
  const city = vacancyCity(v)
  const s = v.salary
  // Tilda's parser sometimes takes a bonus («премії до 300 зл/міс») for the monthly pay: drop a «month» below 60 hours of the rate
  const monthPlausible = s.hourMin == null || (s.monthMax ?? s.monthMin ?? 0) >= s.hourMin * 60
  const month = monthPlausible ? salaryMonth(s, lang) : ''
  const hour = salaryHour(s, lang)
  const pay = month || hour || s.text.split(/[;(]/)[0].trim()
  const payLabel = `${t.salary}${s.unlabelled ? '' : ` · ${s.net ? t.net : t.gross}`}`
  const form = (base: string) => (uk ? base : `${base}-ru`)
  const chats = Boolean(SITE.chat.telegram || SITE.chat.viber || SITE.chat.whatsapp)
  const crumbs = [
    { name: t.home, path: uk ? '/' : '/ru' },
    { name: t.vac, path: uk ? '/vacancies' : '/ru/vacancies' },
    ...(c ? [{ name: `${t.work} ${uk ? c.inName : c.inNameRu}`, path: cPath }] : []),
    { name: v.company || v.title, path: v.path },
  ]

  // the agency's own Drive media for this vacancy: housing photos join the housing block, workplace photos the gallery
  const labels = LABELS[v.path.toLowerCase()] ?? {}
  // the post's YouTube videos from the Tilda text (the import lost them) when the vacancy has none of its own
  const ytVideos = v.videos?.length ? v.videos : (labels.yt ?? [])
  const extra = vacancyMedia(v.path, lang)
  // example photos from the shared pool give way to the real housing of this vacancy
  const pooled = v.housingPool && extra.housing.length > 0
  const housing = [...new Set([...(pooled ? [] : v.housingPhotos), ...extra.housing])]
  const photos = [...new Set([...v.photos, ...extra.work])]
  const housingAt = v.sections.findIndex((x) => isHousing(x.title))
  // the housing block as on the concept: short chips (free / couples / Wi-Fi), then the photos in one rounded swipe row
  const housingText = housingAt >= 0 ? v.sections[housingAt].items.join(' ') : ''
  const housingChips = [
    v.housingFree ? { label: t.free, free: true } : v.housing ? { label: v.housing.replace(/^надається\s*[—-]\s*/i, ''), free: false } : null,
    /(пар|сімейн|семейн)[^.;]{0,40}(окрем|кімнат|комнат)/i.test(housingText) ? { label: uk ? 'Пари — окрема кімната' : 'Пары — отдельная комната', free: false } : null,
    /wi-?fi|інтернет|интернет/i.test(housingText) ? { label: 'Wi-Fi', free: false } : null,
  ].filter((x): x is { label: string; free: boolean } => Boolean(x))
  const housingFigure = (housing.length > 0 || housingChips.length > 0) && (
    <figure className="mt-4">
      {housingChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {housingChips.map((x) => (
            <span key={x.label} className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-[14.5px] font-semibold ${x.free ? 'bg-brand-100 text-brand-800' : 'bg-white text-ink ring-1 ring-line'}`}>
              <IconHome className={`size-4 shrink-0 ${x.free ? 'text-brand-700' : 'text-brand-600'}`} />
              {x.label}
            </span>
          ))}
        </div>
      )}
      {housing.length > 0 && (
        <>
          <h3 className="eyebrow mt-5">{labels.housing?.[0] ?? t.housingPhotos}</h3>
          {/* one swipeable row (owner 2026-10-15: the grid took half a phone screen); the next photo peeks in */}
          <div className="-mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {housing.map((p, k) => (
              <a key={p} href={src(p, 1200)} target="_blank" rel="noopener" className="block w-[78%] max-w-[420px] shrink-0 snap-center overflow-hidden rounded-[20px] bg-surface shadow-[0_14px_30px_-22px_rgb(16_36_27/0.6)] sm:w-[300px] sm:snap-start">
                <Photo base={p} alt={`${t.housingAlt} ${k + 1}`} sizes="(max-width: 640px) 78vw, 300px" className="aspect-[4/3] w-full object-cover transition duration-500 hover:scale-[1.03]" />
              </a>
            ))}
          </div>
          {v.housingNote && !pooled && <figcaption className="mt-2 text-[15px] leading-snug text-muted">{v.housingNote}</figcaption>}
        </>
      )}
    </figure>
  )

  // reviews on every vacancy: its own first, then the closest ones of the whole site; the same for the video reviews
  const ownReviews = v.reviews.map((r) => toReviewItem(r, lang))
  const reviewsShown = [
    ...ownReviews,
    ...relevantReviews(v, REVIEWS.filter((r) => !r.video && r.text.length > 40 && !ownReviews.some((o) => o.text === r.text)), 8),
  ].slice(0, 8)
  const videosShown = extra.videos.length > 0 ? extra.videos : videoCards(relevantReviews(v, REVIEWS.filter((r) => r.video), 8), lang).slice(0, 8)

  const terms: { label: string; value: React.ReactNode; wide?: boolean }[] = [
    {
      wide: true,
      label: payLabel,
      value: (
        <>
          <span className="num block text-[18px] font-semibold leading-tight text-ink sm:text-[22px] xl:text-[20px]">{pay}</span>
          {month && hour && <span className="num mt-0.5 block text-[13.5px] font-medium text-brand-700 sm:text-[15px]">{hour}</span>}
        </>
      ),
    },
    { label: t.place, value: [city, cName].filter(Boolean).join(', ') },
    { label: t.schedule, value: v.schedule },
    { label: t.contract, value: v.contract },
    {
      label: t.housing,
      value: (v.housing || v.housingFree) && (
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          {v.housingFree && <span className="whitespace-nowrap bg-brand-100 px-2 py-0.5 text-[13.5px] font-semibold text-brand-800 sm:text-[15px]">{t.free}</span>}
          {v.housing && !(v.housingFree && isJustFree(v.housing)) && <span>{v.housing}</span>}
        </span>
      ),
    },
    { label: t.employer, value: v.company && norm(v.company) !== norm(v.title) ? v.company : '' },
  ].filter((x) => x.value)

  const ctaRow = (place: 'vacancy-top' | 'vacancy-bottom') => (
    <div data-cta className="flex gap-2 lg:hidden">
      <QuickApply id={v.id} title={v.title} lang={lang} form={form(place)} label={t.book} submitLabel={t.book} className="btn-accent !min-h-11 min-w-0 flex-1 !px-4 !py-2.5 !text-[15.5px]" />
      <ChatButtons place={place} lang={lang} compact className="!min-h-11 !px-3.5 !py-2.5" />
    </div>
  )

  const contacts = (place: string) => (
    <div>
      <p className="text-[15px] font-semibold text-ink-2">{chats ? t.faster : t.channels}</p>
      <ContactLinks place={place} lang={lang} />
      <a href={`tel:${SITE.phone}`} className="mt-3 flex min-h-11 flex-wrap items-center gap-x-2.5 text-ink hover:text-brand-700">
        <IconPhone className="size-5 shrink-0 text-brand-600" />
        <span className="num text-[17px] font-semibold">{SITE.phoneDisplay}</span>
        <span className="text-[14px] text-muted">{t.orCall}</span>
      </a>
    </div>
  )

  let n = 0

  return (
    <>
      {/* every vacancy page takes applications (owner, 2026-10: «no switched-off vacancies — each one brings calls and requests»);
          JobPosting only for today's vacancies — not for the switched-off ones nor the revived Tilda posts (Google Jobs) */}
      {v.active && !v.revived && <JsonLd data={jobPostingLd(v, lang)} />}

      <article aria-labelledby="vacancy-h">
        {/* ───────── page head: crumbs, country code, H1, the key terms as a spec sheet ───────── */}
        <section className="relative isolate overflow-clip border-b border-line bg-white">
          <Strands count={9} seed={47} className="-z-10 opacity-60" />
          <div className="container-x pb-7 pt-2 sm:pb-9">
            <div className="text-ink-2">
              <Breadcrumbs items={crumbs} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <HoverLink href={cPath} className="group inline-flex min-h-11 items-center gap-2.5">
                <span className="num bg-ink px-1.5 py-0.5 text-[12.5px] font-semibold uppercase text-white">{v.country}</span>
                <span className="text-[15px] font-semibold text-ink underline-offset-[3px] group-hover:underline">{cName}</span>
              </HoverLink>
              {cat && v.category !== 'other' && <span className="border border-line px-2 py-[3px] text-[14px] font-medium text-ink-2">{uk ? cat.name : cat.nameRu}</span>}
            </div>

            <div className="mt-2 flex items-start gap-5">
              <h1 id="vacancy-h" className="max-w-4xl flex-1 text-[26px] text-ink min-[380px]:text-[28px] sm:text-[38px] lg:text-[42px]">
                {v.title}
              </h1>
              {v.logo && (
                <span className="grid size-16 shrink-0 place-items-center overflow-hidden border border-line bg-white p-1.5 sm:size-20">
                  <Photo base={v.logo} alt={v.company || ''} width={80} height={80} sizes="80px" className="size-full object-contain" />
                </span>
              )}
            </div>


            {/* phones (owner 2026-10-26: «зменш, багато екрану займає»): tighter rows, smaller labels */}
            <p className="eyebrow mt-4 sm:mt-7">{t.terms}</p>
            <dl className="mt-2 grid border-t-2 border-ink sm:mt-3 sm:grid-cols-2 sm:gap-x-10 sm:border-t-[3px] xl:grid-cols-3">
              {terms.map((x) => (
                <div key={x.label} className={`grid grid-cols-[92px_minmax(0,1fr)] items-baseline gap-x-3 border-b border-line py-2 min-[420px]:grid-cols-[112px_minmax(0,1fr)] sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-x-4 sm:py-3.5 ${x.wide ? 'sm:col-span-2 xl:col-span-1' : ''}`}>
                  <dt className="font-mono text-[10.5px] font-medium uppercase leading-snug tracking-[0.06em] text-muted sm:text-[12px] sm:tracking-[0.08em]">{x.label}</dt>
                  <dd className="text-[14.5px] font-semibold leading-snug text-ink sm:text-[16px]">{x.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 sm:mt-5">{ctaRow('vacancy-top')}</div>
          </div>
          <div className="rule-grad" />
        </section>

        {/* ───────── body: the original text as a register + the application panel ───────── */}
        <div className="container-x grid gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          <div className="min-w-0">
            <Gallery photos={photos} alt={v.title} priority lang={lang} />

            {/* phones: the form right after the photos */}
            {/* owner 2026-10-26: «форму забронювати меньшу в 2 рази» — one short line, smaller fields, messengers + phone in one row */}
            <section id="apply-mobile" aria-labelledby="apply-mobile-h" className="mt-6 rounded-[18px] border border-line bg-white p-4 shadow-[0_16px_34px_-28px_rgb(16_36_27/0.6)] lg:hidden">
              <h2 id="apply-mobile-h" className="text-[18px] text-ink">{t.book}</h2>
              <p className="mt-0.5 text-[13.5px] leading-snug text-ink-2">{t.callback}</p>
              {/* labels stay for screen readers; the placeholders say the same on screen */}
              <div className="mt-3 [&_.field]:!py-2.5 [&_.field]:!text-[15px] [&_form]:!space-y-2 [&_label]:sr-only [&_p]:!mt-2 [&_p]:!text-[11.5px] [&_button[type=submit]]:!min-h-11 [&_button[type=submit]]:!py-2.5 [&_button[type=submit]]:!text-[15.5px]">
                <LeadForm form={form('vacancy')} vacancyId={v.id} vacancyTitle={v.title} submitLabel={t.book} compact lang={lang} namePlaceholder={uk ? 'Ім’я (необов’язково)' : 'Имя (необязательно)'} />
              </div>
              <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5">
                <ChatButtons place="vacancy-mobile" lang={lang} compact className="!min-h-10 !px-3 !py-2" />
                <a href={`tel:${SITE.phone}`} className="ml-auto flex min-h-10 items-center gap-1.5 text-ink hover:text-brand-700">
                  <IconPhone className="size-4 shrink-0 text-brand-600" />
                  <span className="num text-[15px] font-semibold">{SITE.phoneDisplay}</span>
                </a>
              </div>
              <LicenseBadge className="mt-1.5 !text-[11.5px]" lang={lang} />
            </section>

            {(v.intro && !isCrumbTrail(v.intro)) || (v.headline && norm(v.headline) !== norm(v.title)) ? (
              <div className="mt-10 max-w-3xl">
                <p className="eyebrow">{t.desc}</p>
                {v.headline && norm(v.headline) !== norm(v.title) && <h2 className="mt-3 text-[22px] text-ink sm:text-[26px]">{v.headline}</h2>}
                {v.intro && !isCrumbTrail(v.intro) && <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{v.intro}</p>}
              </div>
            ) : null}

            <div className="mt-10 space-y-10">
              {v.sections.map((x, i) => {
                const k = ++n
                return (
                  <section key={`${x.title}-${i}`} aria-labelledby={`vs-${i}`}>
                    <RegisterHead id={`vs-${i}`} n={k} title={x.title} as={isTildaH3(x.title) ? 'h3' : 'h2'} />
                    <RegisterList items={x.items} />
                    {i === housingAt && housingFigure}
                  </section>
                )
              })}

              {housingAt === -1 && housingFigure && (
                <section aria-labelledby="housing-h">
                  <RegisterHead id="housing-h" n={++n} title={t.housing} />
                  {housingFigure}
                </section>
              )}

              {ytVideos.length > 0 && (
                <section aria-labelledby="video-h">
                  <RegisterHead id="video-h" n={++n} title={labels.videos?.[0] ?? t.videos} as={labels.videos ? 'h3' : 'h2'} />
                  {/* a post with several Tilda video labels («Відео з роботи:», «Відео з житла:») keeps them all */}
                  {labels.videos?.slice(1).map((l) => (
                    <h3 key={l} className="eyebrow mt-3">
                      {l}
                    </h3>
                  ))}
                  <div className={`mt-4 grid gap-4 ${ytVideos.length > 1 ? 'sm:grid-cols-2' : ''} [&>div>div]:!my-0 [&>div>div]:!rounded-none`}>
                    {ytVideos.map((id) => (
                      <div key={id}>
                        <YouTube id={id} title={`${t.videos}: ${v.title}`} lang={lang} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {reviewsShown.length > 0 && (
              <section className="mt-10" aria-labelledby="vrev-h">
                <RegisterHead
                  id="vrev-h"
                  as="h3"
                  title={labels.reviews?.[0] ?? t.reviews}
                  aside={
                    <HoverLink href={uk ? '/vidguki' : '/ru/otzyvy'} className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-brand-700 hover:text-brand-800">
                      {uk ? 'Усі відгуки' : 'Все отзывы'} <IconArrow className="size-4" />
                    </HoverLink>
                  }
                />
                <div className="-mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
                  {reviewsShown.map((r) => (
                    <div key={r.name + r.text.slice(0, 16)} className="w-[84%] max-w-[360px] shrink-0 snap-start [&>figure]:rounded-[18px] [&>figure]:p-5 [&_blockquote]:line-clamp-6 [&_blockquote]:text-[15px]">
                      <ReviewCard r={r} lang={lang} />
                    </div>
                  ))}
                </div>
                <HoverLink href={uk ? '/vidguki#review-form-h' : '/ru/otzyvy#review-form-h'} className="mt-2 inline-flex min-h-11 items-center text-[14.5px] font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">
                  {t.leaveReview}
                </HoverLink>
              </section>
            )}

            {videosShown.length > 0 && (
              <section className="mt-10" aria-labelledby="vvid-h">
                <RegisterHead id="vvid-h" as="h3" title={uk ? 'Відеовідгуки працівників' : 'Видеоотзывы работников'} />
                <div className="mt-4">
                  <VideoCards items={videosShown} lang={lang} layout="row" />
                </div>
              </section>
            )}

            <AnyRequest lang={lang} id="vacancy-any-request" preset={{ country: v.country }} className="mt-10" />

            <section className="mt-10" aria-labelledby="how-h">
              <RegisterHead id="how-h" title={t.how} />
              <ol className="mt-2 grid sm:grid-cols-2 sm:gap-x-8">
                {t.steps.map(([st, d], k) => (
                  <li key={st} className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-3 border-b border-line py-4">
                    <span className="num text-[24px] font-medium leading-none text-brand-600">{String(k + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="block text-[16.5px] font-semibold text-ink">{st}</span>
                      <span className="mt-1 block text-[15.5px] leading-relaxed text-ink-2">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                {t.freeNote}{' '}
                <HoverLink href={uk ? '/poslugi' : '/ru/services'} className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">
                  {t.prices}
                </HoverLink>
              </p>
            </section>

            {/* after reading everything — book right here instead of scrolling back up (phones; desktop has the sticky panel) */}
            <div className="mt-6">{ctaRow('vacancy-bottom')}</div>
          </div>

          {/* ───────── sticky application panel (desktop) ───────── */}
          <aside className="hidden lg:block" aria-label={t.apply}>
            {/* taller than a laptop screen (pay, form, contacts): it scrolls inside instead of being cut off at the bottom */}
            <div className="sticky top-[96px] -mx-3 max-h-[calc(100dvh-104px)] space-y-3 overflow-y-auto overscroll-contain px-3 pb-3 [scrollbar-width:thin]">
              <div className="border border-line bg-white shadow-[var(--shadow-lift)]">
                <div className="border-b border-line px-6 pb-5 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="eyebrow">{t.apply}</p>
                    <span className="num bg-ink px-1.5 py-0.5 text-[12px] font-semibold uppercase text-white" title={cName}>
                      {v.country}
                    </span>
                  </div>
                  <p className="mt-4 font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{payLabel}</p>
                  <p className="num mt-1 text-[24px] font-semibold leading-tight text-ink">{pay}</p>
                  {month && hour && <p className="num mt-0.5 text-[15px] font-medium text-brand-700">{hour}</p>}
                </div>
                <div className="px-6 py-5">
                  <h2 id="apply" className="text-[20px] text-ink">{t.book}</h2>
                  <p className="mt-1.5 text-[15px] text-ink-2">{t.callback}</p>
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-brand-800">{ANY_REQUEST[lang].short}</p>
                  <div className="mt-4">
                    <LeadForm form={form('vacancy')} vacancyId={v.id} vacancyTitle={v.title} submitLabel={t.book} compact lang={lang} />
                  </div>
                  <LicenseBadge className="mt-4" lang={lang} />
                </div>
                <div className="border-t border-line px-6 py-5">{contacts('vacancy-sidebar')}</div>
              </div>
              <p className="px-1 text-[14px] leading-snug text-muted">{t.income}</p>
            </div>
          </aside>
        </div>
      </article>

      {similar.length > 0 && (
        <section id="similar" className="border-t border-line bg-surface py-14 sm:py-16" aria-labelledby="sim-h">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHead id="sim-h" eyebrow={t.alsoLabel} title={t.also} />
              <HoverLink href={cPath} className="btn-ghost">
                {c ? `${t.all} ${uk ? c.inName : c.inNameRu}` : t.all} <IconArrow className="size-4" />
              </HoverLink>
            </div>
            <div className="mt-8 overflow-hidden rounded-[18px] border-x border-t border-line">
              {similar.map((x) => (
                <VacancyCard key={x.id} v={toCard(localize(x, lang))} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      <HeaderVacancyAction vacancyId={v.id} vacancyTitle={v.title} />
    </>
  )
}
