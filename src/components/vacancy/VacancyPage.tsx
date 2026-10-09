import Link from 'next/link'
import { vacancyMedia } from '@/lib/vacancy-media'
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
import { HeaderVacancyAction, QuizButton } from '@/components/lead/LeadModal'
import { JsonLd } from '@/components/seo/JsonLd'
import { YouTube } from '@/components/content/YouTube'
import { Photo, src } from '@/components/ui/Photo'
import { ReviewCard, SectionHead } from '@/components/sections/Sections'
import { IconArrow, IconPhone } from '@/components/ui/icons'
import { CATALOG_PATH, CATALOG_PATH_RU, CATEGORY, COUNTRY, SITE } from '@/lib/site'
import { jobPostingLd } from '@/lib/seo'
import { salaryHour, salaryMonth, vacancyCity } from '@/lib/format'
import { toCard } from '@/lib/vacancies'
import { localize } from '@/lib/vacancy-i18n'
import { ruTwin } from '@/lib/alt-routes'
import type { ReviewItem } from '@/lib/content'
import type { Review, Vacancy } from '@/lib/types'

const norm = (t: string) => t.toLowerCase().replace(/[^a-zа-яіїєґё0-9]/gi, '')
/** Tilda pasted its own crumbs into some intros («Главная / Вакансии / Philips») — not content */
const isCrumbTrail = (t: string) => /^(главная|головна)\s*\//i.test(t.trim())
/** «Проживання» / «Житло» / «Проживание» / «Жильё»: the housing photos belong in this block */
const isHousing = (title: string) => /прожив|житл|жил[ьи]/i.test(title)
/** «Робота:» — a short line ending with a colon is a sub-heading inside a list */
const isSubhead = (it: string) => /:\s*$/.test(it) && it.length < 60
/** Section titles that were <h3> labels in Tilda's post text («Відгуки про роботу:», «Отзывы о работе:») keep that level */
const isTildaH3 = (title: string) => /^(відгуки? про роботу|отзывы? о работе)\s*:?$/i.test(title.trim())
/** «безкоштовне» alone repeats the green tag */
const isJustFree = (t: string) => /^(безкоштовн|бесплатн)\S*\.?$/i.test(t.trim())

const TX = {
  uk: {
    home: 'Головна', vac: 'Вакансії', work: 'Робота', no: 'Вакансія №',
    terms: 'Ключові умови', salary: 'Зарплата', net: 'на руки', gross: 'брутто',
    place: 'Місце роботи', schedule: 'Графік', contract: 'Договір', housing: 'Проживання', employer: 'Роботодавець', free: 'Житло безкоштовно',
    closedShort: 'Набір закрито',
    closed: 'Набір на цю вакансію зараз закрито. Оголошення збережене для довідки — оберіть схожу відкриту вакансію або пройдіть підбір, і менеджер запропонує актуальний аналог.',
    closedText: 'Підберемо схожу актуальну вакансію за 1 хвилину.',
    analog: 'Підібрати схожу вакансію', seeSimilar: 'Схожі відкриті вакансії',
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
    home: 'Главная', vac: 'Вакансии', work: 'Работа', no: 'Вакансия №',
    terms: 'Ключевые условия', salary: 'Зарплата', net: 'на руки', gross: 'брутто',
    place: 'Место работы', schedule: 'График', contract: 'Договор', housing: 'Проживание', employer: 'Работодатель', free: 'Жильё бесплатно',
    closedShort: 'Набор закрыт',
    closed: 'Набор на эту вакансию сейчас закрыт. Объявление сохранено для справки — выберите похожую открытую вакансию или пройдите подбор, и менеджер предложит актуальный аналог.',
    closedText: 'Подберём похожую актуальную вакансию за 1 минуту.',
    analog: 'Подобрать похожую вакансию', seeSimilar: 'Похожие открытые вакансии',
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
    { name: t.vac, path: catalog },
    ...(c ? [{ name: `${t.work} ${uk ? c.inName : c.inNameRu}`, path: cPath }] : []),
    { name: v.company || v.title, path: v.path },
  ]

  // the agency's own Drive media for this vacancy: housing photos join the housing block, workplace photos the gallery
  const extra = vacancyMedia(v.path, lang)
  const housing = [...new Set([...v.housingPhotos, ...extra.housing])]
  const photos = [...new Set([...v.photos, ...extra.work])]
  const housingAt = v.sections.findIndex((x) => isHousing(x.title))
  const housingFigure = housing.length > 0 && (
    <figure className="mt-5">
      <h3 className="eyebrow">{t.housingPhotos}</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {housing.map((p, k) => (
          <a key={p} href={src(p, 1200)} target="_blank" rel="noopener" className="block overflow-hidden bg-surface">
            <Photo base={p} alt={`${t.housingAlt} ${k + 1}`} sizes="(max-width: 640px) 50vw, 260px" className="aspect-[4/3] w-full object-cover" />
          </a>
        ))}
      </div>
      {v.housingNote && <figcaption className="mt-2.5 text-[15px] leading-snug text-muted">{v.housingNote}</figcaption>}
    </figure>
  )

  const terms: { label: string; value: React.ReactNode; wide?: boolean }[] = [
    {
      wide: true,
      label: payLabel,
      value: (
        <>
          <span className="num block text-[20px] font-semibold leading-tight text-ink sm:text-[22px] xl:text-[20px]">{pay}</span>
          {month && hour && <span className="num mt-0.5 block text-[15px] font-medium text-brand-700">{hour}</span>}
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
          {v.housingFree && <span className="whitespace-nowrap bg-brand-100 px-2 py-0.5 text-[15px] font-semibold text-brand-800">{t.free}</span>}
          {v.housing && !(v.housingFree && isJustFree(v.housing)) && <span>{v.housing}</span>}
        </span>
      ),
    },
    { label: t.employer, value: v.company && norm(v.company) !== norm(v.title) ? v.company : '' },
  ].filter((x) => x.value)

  const ctaRow = (place: 'vacancy-top' | 'vacancy-bottom') =>
    v.active && (
      <div data-cta className="flex gap-2 lg:hidden">
        <QuickApply id={v.id} title={v.title} lang={lang} form={form(place)} label={t.book} submitLabel={t.book} className="btn-accent min-w-0 flex-1 !px-4" />
        <ChatButtons place={place} lang={lang} compact />
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
      {v.active && <JsonLd data={jobPostingLd(v, lang)} />}

      <article aria-labelledby="vacancy-h">
        {/* ───────── page head: crumbs, country code, H1, the key terms as a spec sheet ───────── */}
        <section className="border-b border-line bg-white">
          <div className="container-x pb-7 pt-2 sm:pb-9">
            <div className="text-ink-2">
              <Breadcrumbs items={crumbs} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link href={cPath} className="group inline-flex min-h-11 items-center gap-2.5">
                <span className="num bg-ink px-1.5 py-0.5 text-[12.5px] font-semibold uppercase text-white">{v.country}</span>
                <span className="text-[15px] font-semibold text-ink underline-offset-[3px] group-hover:underline">{cName}</span>
              </Link>
              {cat && v.category !== 'other' && <span className="border border-line px-2 py-[3px] text-[14px] font-medium text-ink-2">{uk ? cat.name : cat.nameRu}</span>}
              <span className="num ml-auto hidden text-[12.5px] uppercase tracking-[0.06em] text-muted sm:inline">
                {t.no} {v.id.slice(0, 10).toUpperCase()}
              </span>
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

            {/* closed: the Tilda page stays online with its full text — say so plainly and offer a live alternative */}
            {!v.active && (
              <div data-cta role="note" className="mt-6 border border-danger/35 bg-danger/[0.05] p-4 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-5">
                <div className="max-w-2xl">
                  <p className="num inline-block bg-danger px-2 py-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-white">{t.closedShort}</p>
                  <p className="mt-2.5 text-[16px] leading-relaxed text-ink">{t.closed}</p>
                </div>
                <div className="mt-4 flex flex-col gap-2 min-[480px]:flex-row sm:mt-0 sm:shrink-0 sm:flex-col">
                  <QuizButton id="closed-vacancy" preset={{ country: v.country }} className="btn-dark">
                    {t.analog}
                  </QuizButton>
                  {similar.length > 0 && (
                    <a href="#similar" className="btn-ghost">
                      {t.seeSimilar} <span aria-hidden>↓</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            <p className="eyebrow mt-7">{t.terms}</p>
            <dl className="mt-3 grid border-t-[3px] border-ink sm:grid-cols-2 sm:gap-x-10 xl:grid-cols-3">
              {terms.map((x) => (
                <div key={x.label} className={`grid grid-cols-[112px_minmax(0,1fr)] items-baseline gap-x-4 border-b border-line py-3.5 min-[420px]:grid-cols-[132px_minmax(0,1fr)] ${x.wide ? 'sm:col-span-2 xl:col-span-1' : ''}`}>
                  <dt className="font-mono text-[12px] font-medium uppercase leading-snug tracking-[0.08em] text-muted">{x.label}</dt>
                  <dd className="text-[16px] font-semibold leading-snug text-ink">{x.value}</dd>
                </div>
              ))}
            </dl>

            {v.active && <div className="mt-5">{ctaRow('vacancy-top')}</div>}
          </div>
          <div className="rule-grad" />
        </section>

        {/* ───────── body: the original text as a register + the application panel ───────── */}
        <div className="container-x grid gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          <div className="min-w-0">
            <Gallery photos={photos} alt={v.title} priority lang={lang} />

            {/* phones: the form right after the photos */}
            {v.active && (
              <section id="apply-mobile" aria-labelledby="apply-mobile-h" className="mt-8 border border-line border-t-[3px] border-t-ink bg-white p-5 lg:hidden">
                <p className="eyebrow">{t.apply}</p>
                <h2 id="apply-mobile-h" className="mt-2 text-[22px] text-ink">{t.book}</h2>
                <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{t.bookText}</p>
                <p className="mt-2 text-[15px] font-semibold text-brand-800">{ANY_REQUEST[lang].short}</p>
                <div className="mt-4">
                  <LeadForm form={form('vacancy')} vacancyId={v.id} vacancyTitle={v.title} submitLabel={t.book} lang={lang} />
                </div>
                <LicenseBadge className="mt-4" lang={lang} />
                <div className="mt-5 border-t border-line pt-4">{contacts('vacancy-mobile')}</div>
              </section>
            )}

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

              {v.videos && v.videos.length > 0 && (
                <section aria-labelledby="video-h">
                  <RegisterHead id="video-h" n={++n} title={t.videos} />
                  <div className={`mt-4 grid gap-4 ${v.videos.length > 1 ? 'sm:grid-cols-2' : ''} [&>div>div]:!my-0 [&>div>div]:!rounded-none`}>
                    {v.videos.map((id) => (
                      <div key={id}>
                        <YouTube id={id} title={`${t.videos}: ${v.title}`} lang={lang} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {extra.videos.length > 0 && (
              <section className="mt-10" aria-labelledby="vvid-h">
                <RegisterHead id="vvid-h" as="h3" title={uk ? 'Відеовідгуки працівників' : 'Видеоотзывы работников'} />
                <div className="mt-4">
                  <VideoCards items={extra.videos} lang={lang} />
                </div>
              </section>
            )}

            <AnyRequest lang={lang} id="vacancy-any-request" preset={{ country: v.country }} className="mt-10" />

            {v.reviews.length > 0 && (
              <section className="mt-10" aria-labelledby="vrev-h">
                <RegisterHead
                  id="vrev-h"
                  as="h3"
                  title={t.reviews}
                  aside={
                    <Link href={uk ? '/vidguki#review-form-h' : '/ru/otzyvy#review-form-h'} className="inline-flex min-h-11 items-center text-[15px] font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">
                      {t.leaveReview}
                    </Link>
                  }
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
                  {v.reviews.map((r) => (
                    <ReviewCard key={r.name + r.text.slice(0, 16)} r={toReviewItem(r, lang)} lang={lang} />
                  ))}
                </div>
              </section>
            )}

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
                <Link href={uk ? '/poslugi' : '/ru/services'} className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">
                  {t.prices}
                </Link>
              </p>
            </section>

            {/* after reading everything — book right here instead of scrolling back up (phones; desktop has the sticky panel) */}
            {v.active && <div className="mt-6">{ctaRow('vacancy-bottom')}</div>}
          </div>

          {/* ───────── sticky application panel (desktop) ───────── */}
          <aside className="hidden lg:block" aria-label={v.active ? t.apply : t.closedShort}>
            <div className="sticky top-[96px] space-y-3">
              <div className="border border-line bg-white shadow-[var(--shadow-lift)]">
                <div className="border-b border-line px-6 pb-5 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="eyebrow">{v.active ? t.apply : t.closedShort}</p>
                    <span className="num bg-ink px-1.5 py-0.5 text-[12px] font-semibold uppercase text-white" title={cName}>
                      {v.country}
                    </span>
                  </div>
                  <p className="mt-4 font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{payLabel}</p>
                  <p className="num mt-1 text-[24px] font-semibold leading-tight text-ink">{pay}</p>
                  {month && hour && <p className="num mt-0.5 text-[15px] font-medium text-brand-700">{hour}</p>}
                </div>
                <div className="px-6 py-5">
                  {v.active ? (
                    <>
                      <h2 id="apply" className="text-[20px] text-ink">{t.book}</h2>
                      <p className="mt-1.5 text-[15px] text-ink-2">{t.callback}</p>
                      <p className="mt-2 text-[15px] font-semibold leading-snug text-brand-800">{ANY_REQUEST[lang].short}</p>
                      <div className="mt-4">
                        <LeadForm form={form('vacancy')} vacancyId={v.id} vacancyTitle={v.title} submitLabel={t.book} compact lang={lang} />
                      </div>
                      <LicenseBadge className="mt-4" lang={lang} />
                    </>
                  ) : (
                    <>
                      <h2 className="text-[20px] text-ink">{t.closedShort}</h2>
                      <p className="mt-1.5 text-[15px] text-ink-2">{t.closedText}</p>
                      <QuizButton id="closed-vacancy-side" preset={{ country: v.country }} className="btn-accent mt-4 w-full">
                        {t.analog}
                      </QuizButton>
                      {similar.length > 0 && (
                        <a href="#similar" className="btn-ghost mt-2 w-full">
                          {t.seeSimilar} <span aria-hidden>↓</span>
                        </a>
                      )}
                    </>
                  )}
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
              <SectionHead id="sim-h" eyebrow={t.alsoLabel} title={v.active ? t.also : t.seeSimilar} />
              <Link href={cPath} className="btn-ghost">
                {c ? `${t.all} ${uk ? c.inName : c.inNameRu}` : t.all} <IconArrow className="size-4" />
              </Link>
            </div>
            <div className="mt-8 overflow-hidden rounded-[18px] border-x border-t border-line">
              {similar.map((x) => (
                <VacancyCard key={x.id} v={toCard(localize(x, lang))} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {v.active && <HeaderVacancyAction vacancyId={v.id} vacancyTitle={v.title} />}
    </>
  )
}
