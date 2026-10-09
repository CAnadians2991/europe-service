import Link from 'next/link'
import { CATEGORIES, SITE } from '@/lib/site'
import { plural } from '@/lib/format'
import type { Category, Vacancy } from '@/lib/types'
import { Photo } from '@/components/ui/Photo'
import { LeadButton } from '@/components/lead/LeadModal'
import { SectionHead } from '@/components/sections/Sections'
import { VideoCards } from '@/components/reviews/VideoCards'
import type { VideoCard } from '@/lib/video-reviews'

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
    /** Tilda's main H1 (the page ranks with it) — kept as the H1, styled as the line above the big headline */
    seoH1: 'Офіційна робота в Європі для українців',
    h1a: 'Підберемо роботу в Європі',
    h1b: 'і допоможемо доїхати',
    sub: 'Склади, заводи, готелі, будівництво — обираєте ви. Ми підготуємо документи, допоможемо з квитками й дорогою, а менеджер буде на зв’язку.',
    cta: 'Підібрати мені роботу',
    under: 'Менеджер напише у Viber чи Telegram у зручний час',
    formTitle: 'Залиште заявку — підберемо роботу',
    formSub: 'Безкоштовно і без зобов’язань. Менеджер зв’яжеться у зручний для вас час.',
    send: 'Підібрати мені роботу',
    or: 'або напишіть одразу:',
    open: (n: number) => `${n} ${plural(n, ['вакансія', 'вакансії', 'вакансій'])} відкрито зараз`,
  },
  ru: {
    seoH1: 'Официальная работа в Европе для украинцев',
    h1a: 'Подберём работу в Европе',
    h1b: 'и поможем доехать',
    sub: 'Склады, заводы, отели, стройка — выбираете вы. Мы подготовим документы, поможем с билетами и дорогой, а менеджер будет на связи.',
    cta: 'Подобрать мне работу',
    under: 'Менеджер напишет в Viber или Telegram в удобное время',
    formTitle: 'Оставьте заявку — подберём работу',
    formSub: 'Бесплатно и без обязательств. Менеджер свяжется в удобное для вас время.',
    send: 'Подобрать мне работу',
    or: 'или напишите сразу:',
    open: (n: number) => `${n} ${plural(n, ['вакансия', 'вакансии', 'вакансий'])} открыто сейчас`,
  },
}

/**
 * First screen as a magazine spread: a solid brand-green plane with one big white headline and one real photo of
 * a person at work. No blobs, pills, floating cards or icon tiles — the look every template has.
 */
/** Hero photo (owner's pick, 2026-10): a woman and a man in hard hats in a warehouse aisle — from our IKEA vacancy, 1200 px */
const HERO_PHOTO = '/media/v/chekhiia-ikea/38a6b6c422'

export function HomeHero({ lang, photos }: { lang: Lang; photos: string[] }) {
  const t = HERO[lang]
  const uk = lang === 'uk'
  const photo = HERO_PHOTO || photos[0]
  return (
    <section className="relative bg-[linear-gradient(135deg,#25834f_0%,#1f7d5e_58%,#2a7a85_100%)] text-white" aria-labelledby="hero-h">
      <div className="mx-auto grid max-w-[1440px] lg:min-h-[600px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        {/* photo first on phones */}
        <div className="relative aspect-[4/3] overflow-hidden bg-ink sm:aspect-[16/9] lg:order-2 lg:aspect-auto">
          {photo && <Photo base={photo} alt={uk ? 'Працівники складу в касках' : 'Работники склада в касках'} sizes="(max-width: 1024px) 100vw, 50vw" priority className="absolute inset-0 size-full object-cover object-[18%_40%]" />}
        </div>

        <div className="flex flex-col justify-center px-4 py-9 sm:px-8 sm:py-12 lg:order-1 lg:py-16 lg:pl-[max(2rem,calc((100vw-1240px)/2+1rem))] lg:pr-14 xl:pr-20">
          <h1 id="hero-h" className="font-sans text-[15px] font-semibold leading-snug tracking-normal text-white/95 sm:text-[17px]">{t.seoH1}</h1>
          <p className="mt-3 font-display text-[38px] font-bold leading-[1.02] tracking-[-0.035em] text-white min-[380px]:text-[42px] sm:text-[60px] lg:text-[68px] xl:text-[76px]">
            {t.h1a} <span className="block text-[#c9f0d8]">{t.h1b}</span>
          </p>
          <p className="mt-5 max-w-[540px] text-[17px] leading-relaxed text-white sm:text-[18.5px]">{t.sub}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <LeadButton
              form={uk ? 'home-hero' : 'home-hero-ru'}
              title={t.formTitle}
              subtitle={t.formSub}
              submitLabel={t.send}
              contactPrefs
              className="btn !min-h-14 w-full bg-white !px-7 !text-[17px] text-brand-800 hover:bg-brand-50 sm:w-auto"
            >
              {t.cta} <span aria-hidden>→</span>
            </LeadButton>
            <a href={`tel:${SITE.phone}`} className="btn num !min-h-14 w-full border border-white/35 !px-6 text-white hover:border-white sm:w-auto">
              {SITE.phoneDisplay}
            </a>
          </div>
          <p className="mt-4 text-[13.5px] text-white/90">{t.under}</p>
        </div>
      </div>
      {/* the logo gradient as a seam between the hero and the page */}
      <div className="rule-grad !h-1" aria-hidden />
    </section>
  )
}

const CAT_TX = {
  uk: { eyebrow: 'Будь-яка робота', title: 'Пропонуємо вакансії для кожного', text: 'Не знаєте, з чого почати? Скажіть менеджеру, що вмієте, — запропонуємо кілька варіантів.', vac: ['вакансія', 'вакансії', 'вакансій'] },
  ru: { eyebrow: 'Любая работа', title: 'Предлагаем вакансии для каждого', text: 'Не знаете, с чего начать? Скажите менеджеру, что умеете, — предложим несколько вариантов.', vac: ['вакансия', 'вакансии', 'вакансий'] },
}

/** Job types as photo tiles → the catalog filtered by type */
/** the «all vacancies» tile fills the free cells of the last row (3 columns on phones, 4 on tablets, 5 on desktop) */
const SPAN = {
  base: ['col-span-3', 'col-span-1', 'col-span-2'],
  sm: ['sm:col-span-4', 'sm:col-span-1', 'sm:col-span-2', 'sm:col-span-3'],
  lg: ['lg:col-span-5', 'lg:col-span-1', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-4'],
}
const fill = (n: number, cols: number, list: string[]) => {
  const rem = n % cols
  return { cls: list[rem ? cols - rem : 0], full: rem === 0 }
}

export function JobCategories({ lang, all, photos, catalog }: { lang: Lang; all: Vacancy[]; photos: Partial<Record<Category, string>>; catalog: string }) {
  const t = CAT_TX[lang]
  const uk = lang === 'uk'
  const cats = CATEGORIES.filter((c) => photos[c.code] && all.some((v) => v.category === c.code))
  const b = fill(cats.length, 3, SPAN.base)
  const m = fill(cats.length, 4, SPAN.sm)
  const l = fill(cats.length, 5, SPAN.lg)
  return (
    <section className="border-y border-line bg-white" aria-labelledby="cats-h">
      <div className="container-x py-9 sm:py-14">
        <SectionHead id="cats-h" title={t.title} text={t.text} />
        {/* compact tiles (owner, 2026-10): a photo that shows the job, the name under it, three in a row on a phone */}
        <ul className="-mx-4 mt-5 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:mt-6 sm:grid sm:grid-cols-4 sm:gap-x-4 sm:gap-y-4 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {cats.map((c) => {
            const n = all.filter((v) => v.category === c.code).length
            return (
              <li key={c.code} className="w-[34%] shrink-0 snap-start sm:w-auto">
                <Link href={`${catalog}?type=${c.code}`} className="group block">
                  <span className="zoom-img block overflow-hidden rounded-xl bg-surface">
                    <Photo base={photos[c.code]!} alt="" sizes="(max-width: 640px) 32vw, (max-width: 1024px) 24vw, 220px" className="aspect-[4/3] w-full origin-[80%_90%] scale-[1.2] object-cover object-[70%_70%] transition group-hover:scale-[1.26]" />
                  </span>
                  <span className="mt-1.5 block text-[13.5px] font-semibold leading-tight text-ink group-hover:text-brand-700 sm:text-[15.5px]">{uk ? c.name : c.nameRu}</span>
                  <span className="num block text-[12px] text-muted sm:text-[13px]">
                    {n} {plural(n, t.vac as [string, string, string])}
                  </span>
                </Link>
              </li>
            )
          })}
          <li className={`w-[40%] shrink-0 snap-start sm:w-auto ${b.cls} ${m.cls} ${l.cls}`}>
            <Link
              href={catalog}
              className={`flex h-full min-h-14 flex-col justify-center rounded-xl bg-brand-600 px-4 py-3 text-white transition hover:bg-brand-700 ${b.full ? '' : 'max-sm:aspect-auto'} ${l.full ? 'lg:min-h-0 lg:flex-row lg:items-center lg:justify-between' : ''}`}
            >
              <span className="text-[15px] font-semibold leading-tight sm:text-[17px]">{uk ? `Усі ${all.length} ${plural(all.length, ['вакансія', 'вакансії', 'вакансій'])}` : `Все ${all.length} ${plural(all.length, ['вакансия', 'вакансии', 'вакансий'])}`}</span>
              <span className="mt-1 text-[13px] text-white/90 lg:mt-0">{uk ? 'Дивитися каталог →' : 'Смотреть каталог →'}</span>
            </Link>
          </li>
        </ul>
      </div>
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
export function ClientVideos({ lang, videos, title }: { lang: Lang; videos: VideoCard[]; title?: string }) {
  if (videos.length < 4) return null
  return (
    <section className="border-y border-line bg-white" aria-labelledby="vids-h">
      <div className="container-x py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          id="vids-h"
          title={title ?? (lang === 'uk' ? 'Вони вже працюють за кордоном' : 'Они уже работают за границей')}
          text={lang === 'uk' ? 'Наші клієнти — про роботу, житло й менеджерів.' : 'Наши клиенты — о работе, жилье и менеджерах.'}
        />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={lang === 'uk' ? '/vidguki' : '/ru/otzyvy'} className="btn-ghost">
            {lang === 'uk' ? 'Усі відгуки' : 'Все отзывы'} →
          </Link>
          <Link href={lang === 'uk' ? '/vacancies/z-zhytlom' : '/ru/vacancies/s-zhilem'} className="text-[15px] font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[4px]">
            {lang === 'uk' ? 'Вакансії з житлом →' : 'Вакансии с жильём →'}
          </Link>
        </div>
      </div>
      <div className="mt-6">
        <VideoCards items={videos.slice(0, 8)} lang={lang} layout="row" />
      </div>
      </div>
    </section>
  )
}
