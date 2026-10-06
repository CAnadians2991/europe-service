import Link from 'next/link'
import { CATEGORIES, SITE } from '@/lib/site'
import { plural } from '@/lib/format'
import type { Category, Vacancy } from '@/lib/types'
import { Photo } from '@/components/ui/Photo'
import { Reveal } from '@/components/ui/Reveal'
import { LeadButton } from '@/components/lead/LeadModal'
import { SectionHead } from '@/components/sections/Sections'
import { Suitcase3D } from './Suitcase3D'

type Lang = 'uk' | 'ru'

/** Workplace photos for the job types: index of a hand-picked cover among the category's vacancies (real people at work) */
const CATEGORY_PICK: Partial<Record<Category, number>> = { warehouse: 2, factory: 2, food: 2, horeca: 1, cleaning: 0, construction: 0, agro: 1, auto: 2, retail: 1, driver: 2 }

export function categoryPhotos(all: Vacancy[]) {
  const out: Partial<Record<Category, string>> = {}
  for (const c of Object.keys(CATEGORY_PICK) as Category[]) {
    const list = all.filter((v) => v.category === c && v.photos[0]).sort((a, b) => Number(Boolean(b.hot)) - Number(Boolean(a.hot)))
    out[c] = (list[CATEGORY_PICK[c]!] ?? list[0])?.photos[0] ?? ''
  }
  return out
}

const HERO = {
  uk: {
    pill: 'Офіційне агентство з 2018 року · 80 000+ клієнтів',
    h1a: 'Підберемо вам ',
    h1b: 'роботу',
    h1c: ' в Європі',
    sub: 'Склад, завод, готель, будівництво, ферма — будь-яка робота під ваш досвід і документи. Від вас — лише заявка: менеджер зв’яжеться, коли вам зручно, у Viber, Telegram чи телефоном.',
    steps: [
      ['Заявка за 30 секунд', 'Номер телефону — і все'],
      ['Менеджер на зв’язку', 'У зручний час і зручний месенджер'],
      ['Вакансії під вас', 'Підбір безкоштовний'],
    ],
    formTitle: 'Залиште заявку — підберемо роботу',
    formSub: 'Безкоштовно і без зобов’язань. Відповідаємо щодня з 8:00 до 22:00.',
    send: 'Підібрати мені роботу',
    or: 'або напишіть одразу:',
    open: (n: number) => `${n} ${plural(n, ['вакансія', 'вакансії', 'вакансій'])} відкрито зараз`,
  },
  ru: {
    pill: 'Официальное агентство с 2018 года · 80 000+ клиентов',
    h1a: 'Подберём вам ',
    h1b: 'работу',
    h1c: ' в Европе',
    sub: 'Склад, завод, отель, стройка, ферма — любая работа под ваш опыт и документы. От вас — только заявка: менеджер свяжется, когда вам удобно, в Viber, Telegram или по телефону.',
    steps: [
      ['Заявка за 30 секунд', 'Номер телефона — и всё'],
      ['Менеджер на связи', 'В удобное время и удобный мессенджер'],
      ['Вакансии под вас', 'Подбор бесплатный'],
    ],
    formTitle: 'Оставьте заявку — подберём работу',
    formSub: 'Бесплатно и без обязательств. Отвечаем ежедневно с 8:00 до 22:00.',
    send: 'Подобрать мне работу',
    or: 'или напишите сразу:',
    open: (n: number) => `${n} ${plural(n, ['вакансия', 'вакансии', 'вакансий'])} открыто сейчас`,
  },
}

const STEP_ICONS = [
  <svg key="a" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>,
  <svg key="b" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
  </svg>,
  <svg key="c" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m5 12 4.5 4.5L19 7" />
  </svg>,
]

/**
 * First screen: what we do («підберемо будь-яку роботу») and what the visitor does — one button: leave a request,
 * choose how and when the manager gets in touch. Real workplace photos on the right.
 */
export function HomeHero({ lang, total, photos }: { lang: Lang; total: number; photos: string[] }) {
  const t = HERO[lang]
  const uk = lang === 'uk'
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#f2f8f3_0%,#f7f9f4_60%,var(--color-cream)_100%)]" aria-labelledby="hero-h">
      <span aria-hidden className="hero-glow -left-24 top-10 size-[420px] bg-[#9fe0bb]" />
      <span aria-hidden className="hero-glow right-[-120px] top-40 size-[480px] bg-[#a9cdf0] [animation-delay:-6s]" />

      <div className="container-x relative grid items-center gap-10 pb-14 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14 lg:pb-20 lg:pt-16">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-[13.5px] font-semibold text-brand-800 shadow-sm backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-leaf" />
            </span>
            {t.pill}
          </p>
          <h1 id="hero-h" className="mt-5 text-[36px] leading-[1.05] tracking-[-0.03em] min-[380px]:text-[40px] sm:text-[56px] lg:text-[64px]">
            {t.h1a}
            <span className="grad-text">{t.h1b}</span>
            {t.h1c}
          </h1>
          <p className="mt-5 max-w-[600px] text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">{t.sub}</p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <LeadButton
              form={uk ? 'home-hero' : 'home-hero-ru'}
              title={t.formTitle}
              subtitle={t.formSub}
              submitLabel={t.send}
              contactPrefs
              className="btn-accent !min-h-14 !px-8 !text-[17px] shadow-[0_14px_30px_-14px_rgb(30_134_74/0.8)]"
            >
              {uk ? 'Залишити заявку' : 'Оставить заявку'} <span aria-hidden>→</span>
            </LeadButton>
            <a href={`tel:${SITE.phone}`} className="num inline-flex min-h-11 items-center gap-2 text-[17px] font-semibold text-ink hover:text-brand-700">
              {SITE.phoneDisplay}
              <span className="font-sans text-[13.5px] font-normal text-muted">{uk ? 'безкоштовно' : 'бесплатно'}</span>
            </a>
          </div>

          <ol className="mt-8 grid gap-3 sm:grid-cols-3">
            {t.steps.map(([a, b], i) => (
              <li key={a} className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 shadow-[0_10px_30px_-18px_rgb(15_36_27/0.35)] backdrop-blur">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">{STEP_ICONS[i]}</span>
                <span>
                  <span className="block text-[15px] font-semibold leading-snug">{a}</span>
                  <span className="block text-[13.5px] leading-snug text-ink-2">{b}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* real workplaces of our clients */}
        <div className="relative animate-rise [animation-delay:150ms]" aria-hidden>
          <div className="relative mx-auto grid max-w-[520px] grid-cols-[1.1fr_0.9fr] gap-3 sm:gap-4">
            {photos[0] && (
              <div className="zoom-img float-slow row-span-2 overflow-hidden rounded-[22px] shadow-[0_24px_50px_-24px_rgb(15_36_27/0.55)]" style={{ ['--rot' as string]: '-1.5deg' }}>
                <Photo base={photos[0]} alt="" sizes="(max-width: 1024px) 55vw, 300px" priority className="aspect-[3/4] size-full origin-[80%_100%] scale-[1.2] object-cover object-[80%_90%]" />
              </div>
            )}
            {photos.slice(1, 3).map((p, i) => (
              <div key={p} className={`zoom-img ${i ? 'float-slow' : 'float-slow-2'} overflow-hidden rounded-[22px] shadow-[0_24px_50px_-24px_rgb(15_36_27/0.55)]`} style={{ ['--rot' as string]: `${i ? 1.5 : 2}deg` }}>
                <Photo base={p} alt="" sizes="(max-width: 1024px) 45vw, 240px" className="aspect-[4/3] size-full origin-[80%_100%] scale-[1.2] object-cover object-[80%_90%]" />
              </div>
            ))}
            <div className="absolute -bottom-5 left-4 rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:left-6">
              <p className="font-display text-[26px] font-bold leading-none text-ink">{total}</p>
              <p className="mt-1 text-[13px] font-medium text-ink-2">{t.open(total).replace(/^\d+\s/, '')}</p>
            </div>
            <div className="pointer-events-none absolute -right-6 -top-14 hidden origin-top-right scale-[0.36] lg:block">
              <Suitcase3D />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const CAT_TX = {
  uk: { eyebrow: 'Будь-яка робота', title: 'Яку роботу підберемо', text: 'Не знаєте, з чого почати? Скажіть менеджеру, що вмієте, — запропонуємо кілька варіантів.', vac: ['вакансія', 'вакансії', 'вакансій'] },
  ru: { eyebrow: 'Любая работа', title: 'Какую работу подберём', text: 'Не знаете, с чего начать? Скажите менеджеру, что умеете, — предложим несколько вариантов.', vac: ['вакансия', 'вакансии', 'вакансий'] },
}

/** Job types as photo tiles → the catalog filtered by type */
export function JobCategories({ lang, all, photos, catalog }: { lang: Lang; all: Vacancy[]; photos: Partial<Record<Category, string>>; catalog: string }) {
  const t = CAT_TX[lang]
  const cats = CATEGORIES.filter((c) => photos[c.code] && all.some((v) => v.category === c.code))
  return (
    <section className="container-x py-16 sm:py-20" aria-labelledby="cats-h">
      <SectionHead id="cats-h" eyebrow={t.eyebrow} title={t.title} text={t.text} />
      <Reveal className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cats.map((c, i) => {
          const n = all.filter((v) => v.category === c.code).length
          return (
            <Link
              key={c.code}
              href={`${catalog}?type=${c.code}`}
              data-reveal="zoom"
              style={{ ['--i' as string]: i % 5 }}
              className="zoom-img group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ink"
            >
              <Photo base={photos[c.code]!} alt="" sizes="(max-width: 768px) 50vw, 20vw" className="absolute inset-0 size-full origin-[80%_100%] scale-[1.3] object-cover object-[70%_85%] opacity-90" />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgb(10_28_20/0.85)_100%)]" />
              <span className="absolute inset-x-0 bottom-0 p-3.5 text-white sm:p-4">
                <span className="block font-display text-[17px] font-semibold leading-tight sm:text-[19px]">{lang === 'uk' ? c.name : c.nameRu}</span>
                <span className="num mt-1 block text-[13px] text-white/80">
                  {n} {plural(n, t.vac as [string, string, string])} <span className="inline-block transition group-hover:translate-x-1">→</span>
                </span>
              </span>
            </Link>
          )
        })}
      </Reveal>
    </section>
  )
}

/** Housing photos sent by our clients — a slow strip (housing photos stay in housing blocks only) */
export function HousingStrip({ lang, photos }: { lang: Lang; photos: string[] }) {
  if (photos.length < 6) return null
  const list = photos.slice(0, 16)
  return (
    <section className="overflow-hidden border-y border-line bg-white py-14 sm:py-16" aria-labelledby="housing-h">
      <div className="container-x">
        <SectionHead
          id="housing-h"
          eyebrow={lang === 'uk' ? 'Житло' : 'Жильё'}
          title={lang === 'uk' ? 'Де живуть наші клієнти' : 'Где живут наши клиенты'}
          text={lang === 'uk' ? 'Фото житла на заїздах — їх надсилають самі клієнти. Житло надає роботодавець, умови вказані в кожній вакансії.' : 'Фото жилья на заездах — их присылают сами клиенты. Жильё предоставляет работодатель, условия указаны в каждой вакансии.'}
        />
      </div>
      <div className="photo-marquee mt-8" style={{ ['--dur' as string]: `${list.length * 5}s` }}>
        {[0, 1].map((k) => (
          <ul key={k} aria-hidden={k === 1 || undefined}>
            {list.map((p) => (
              <li key={p + k} className="h-48 w-64 shrink-0 overflow-hidden rounded-2xl sm:h-56 sm:w-80">
                <Photo base={p} alt="" sizes="320px" className="size-full object-cover" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  )
}

/** Video reviews: posters of real clients (consent given), play on the reviews page */
export function ClientVideos({ lang, videos }: { lang: Lang; videos: { poster: string; name: string; vacancy?: string; city?: string }[] }) {
  if (videos.length < 4) return null
  return (
    <section className="container-x py-16 sm:py-20" aria-labelledby="vids-h">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          id="vids-h"
          eyebrow={lang === 'uk' ? 'Відеовідгуки' : 'Видеоотзывы'}
          title={lang === 'uk' ? 'Вони вже працюють за кордоном' : 'Они уже работают за границей'}
          text={lang === 'uk' ? 'Справжні клієнти — про роботу, житло й менеджерів. Кожен дав згоду на публікацію.' : 'Настоящие клиенты — о работе, жилье и менеджерах. Каждый дал согласие на публикацию.'}
        />
        <Link href={lang === 'uk' ? '/vidguki' : '/ru/otzyvy'} className="btn-ghost">
          {lang === 'uk' ? 'Усі відгуки' : 'Все отзывы'} →
        </Link>
      </div>
      <Reveal className="mt-8 flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-6">
        {videos.slice(0, 6).map((v, i) => (
          <Link
            key={v.poster}
            href={lang === 'uk' ? '/vidguki' : '/ru/otzyvy'}
            data-reveal
            style={{ ['--i' as string]: i }}
            className={`zoom-img group relative aspect-[9/16] w-40 shrink-0 snap-start overflow-hidden rounded-2xl bg-ink sm:w-auto ${i > 3 ? 'hidden lg:block' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.poster} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgb(10_28_20/0.85))]" />
            <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-700 shadow-lg transition group-hover:scale-110" aria-hidden>
              <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            <span className="absolute inset-x-0 bottom-0 p-3 text-white">
              <span className="block text-[15px] font-semibold">{v.name}</span>
              {v.vacancy && <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-white/80">{v.vacancy}</span>}
            </span>
          </Link>
        ))}
      </Reveal>
    </section>
  )
}
