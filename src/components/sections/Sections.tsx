import Link from 'next/link'
import { Photo, src } from '@/components/ui/Photo'
import { IconArrow, IconCheck, IconStar } from '@/components/ui/icons'
import { LeadForm } from '@/components/lead/LeadForm'
import { QuizEngine } from '@/components/quiz/QuizEngine'
import { SITE } from '@/lib/site'
import { standardQuiz } from '@/lib/quiz-engine'
import type { ReviewItem } from '@/lib/content'
import type { CountryCode } from '@/lib/types'

export function SectionHead({ eyebrow, title, text, center, id, dark }: { eyebrow?: string; title: string; text?: string; center?: boolean; id?: string; dark?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <p className={`eyebrow ${dark ? '!text-brand-100' : ''}`}>{eyebrow}</p>}
      <h2 id={id} className={`mt-3 text-[27px] leading-[1.12] sm:text-[38px] ${dark ? 'text-white' : 'text-ink'}`}>
        {title}
      </h2>
      {text && <p className={`mt-3 text-[16px] leading-relaxed ${dark ? 'text-white/75' : 'text-ink-2'}`}>{text}</p>}
    </div>
  )
}

/** Bento grid of reasons to trust — numbers first, words second */
export function Advantages({ items, title, lang = 'uk' }: { title: string; items: { title: string; text: string }[]; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const [a0, a1, a2, a3, a4] = items
  const cell = 'rounded-[26px] p-6 sm:p-7'
  return (
    <section className="container-x py-16 sm:py-24" aria-labelledby="adv-h">
      <SectionHead id="adv-h" eyebrow={uk ? 'Чому нам довіряють' : 'Почему нам доверяют'} title={title} />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <div className={`${cell} brand-band flex flex-col justify-between text-white lg:col-span-2 lg:row-span-2`}>
          <p className="font-display text-[64px] font-bold leading-none tracking-tight text-brand-100 sm:text-[88px]">{SITE.clients}</p>
          <div className="mt-8">
            <p className="font-display text-xl font-semibold">{uk ? 'клієнтів уже працюють у Європі' : 'клиентов уже работают в Европе'}</p>
            <p className="mt-2 max-w-md text-white/70">{a0?.text.split('\n')[0]}</p>
            <Link href={uk ? '/vidguki' : '/ru/otzyvy'} className="mt-5 inline-flex items-center gap-2 font-semibold text-brand-100 underline-offset-4 hover:underline">
              {uk ? 'Читати відгуки' : 'Читать отзывы'} <IconArrow className="size-4" />
            </Link>
          </div>
        </div>
        {a1 && (
          <div className={`${cell} bg-white ring-1 ring-line`}>
            <p className="font-display text-lg font-semibold">{a1.title}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{a1.text}</p>
          </div>
        )}
        {a2 && (
          <div className={`${cell} bg-accent-600`}>
            <p className="font-display text-[40px] font-bold leading-none">24/7</p>
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-white/90">{a2.text}</p>
          </div>
        )}
        {a3 && (
          <div className={`${cell} bg-white ring-1 ring-line`}>
            <p className="font-display text-[40px] font-bold leading-none text-brand-600">5000+</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{a3.text}</p>
          </div>
        )}
        {a4 && (
          <div className={`${cell} bg-brand-600 text-white`}>
            <p className="font-display text-lg font-semibold">{a4.title}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-white/75">{a4.text}</p>
          </div>
        )}
      </div>
    </section>
  )
}

/** The journey as a transit line: numbered stops connected by a dashed route */
export function Steps({ title, items, lang = 'uk' }: { title: string; items: { title: string; text: string }[]; lang?: 'uk' | 'ru' }) {
  return (
    <section className="border-y border-line bg-white py-16 [--notch:#fff] sm:py-24" aria-labelledby="steps-h">
      <div className="container-x">
        <SectionHead id="steps-h" eyebrow={lang === 'uk' ? 'Маршрут' : 'Маршрут'} title={title} />
        <ol className="relative mt-12 grid gap-8 md:grid-cols-4 md:gap-5">
          <span aria-hidden className="absolute bottom-2 left-[19px] top-2 w-0 border-l-2 border-dashed border-brand-200 md:bottom-auto md:left-4 md:right-4 md:top-[19px] md:h-0 md:w-auto md:border-l-0 md:border-t-2" />
          {items.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 md:block">
              <span className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold ring-4 ring-white ${i === items.length - 1 ? 'bg-accent-600 text-white' : 'bg-brand-600 text-white'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="md:mt-5">
                <h3 className="text-[17px] leading-snug">{s.title.replace(/^(Крок|Шаг)\s*\d+\.\s*/, '')}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Brands({ title, logos, names = [] }: { title: string; logos: string[]; names?: string[] }) {
  return (
    <section className="container-x py-12" aria-label={title}>
      <p className="text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">{title}</p>
      <ul className="mt-6 grid grid-cols-3 items-center gap-x-6 gap-y-5 sm:grid-cols-5 lg:grid-cols-10">
        {logos.map((l, i) => (
          <li key={l} className="flex h-12 items-center justify-center">
            <Photo base={l} alt={names[i] ?? ''} width={160} height={80} sizes="120px" className="max-h-10 w-auto object-contain opacity-60 mix-blend-multiply grayscale transition hover:opacity-100 hover:grayscale-0" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Stars({ n = 5, lang = 'uk' }: { n?: number; lang?: 'uk' | 'ru' }) {
  return (
    <span role="img" className="flex text-sun-600" aria-label={lang === 'uk' ? `Оцінка ${n} з 5` : `Оценка ${n} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <IconStar key={i} className={`size-4 ${i < n ? '' : 'opacity-25'}`} />
      ))}
    </span>
  )
}

/** Review as a postcard: quote mark, dashed divider, "stamp" with vacancy & city */
export function ReviewCard({ r, lang = 'uk' }: { r: ReviewItem; lang?: 'uk' | 'ru' }) {
  // the Russian site shows the stamp (vacancy · city) in Russian; the quote itself stays as the client wrote it
  const vacancy = lang === 'ru' ? (r.vacancyRu ?? r.vacancy) : r.vacancy
  const city = lang === 'ru' ? (r.cityRu ?? r.city) : r.city
  return (
    <figure className="relative flex h-full min-w-0 flex-col rounded-[24px] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-brand-100">
      <span aria-hidden className="pointer-events-none absolute bottom-16 right-5 font-display text-[72px] leading-none text-brand-100/70">”</span>
      <div className="flex items-center justify-between gap-3">
        {/* stars only when the client gave a rating (reviews from the clients' Telegram group usually have none) */}
        {r.rating !== undefined ? <Stars n={r.rating} lang={lang} /> : <span />}
        {r.date && <span className="text-xs tabular-nums text-muted">{r.date}</span>}
      </div>
      <blockquote lang={r.lang} className="relative mt-3 flex-1 text-[15px] leading-relaxed text-ink-2">{r.text}</blockquote>
      {/* the client's own photos of the housing / workplace: up to 3, tap opens the full photo */}
      {r.photos && r.photos.length > 0 && (
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {r.photos.slice(0, 3).map((p, k) => (
            <a key={p} href={src(p, 1200)} target="_blank" rel="noopener" className="overflow-hidden rounded-xl bg-brand-50">
              <Photo base={p} alt={`${lang === 'uk' ? 'Фото від клієнта' : 'Фото от клиента'} ${k + 1}`} width={160} height={160} sizes="(max-width: 640px) 30vw, 120px" className="aspect-square w-full object-cover" />
            </a>
          ))}
        </div>
      )}
      <figcaption className="mt-5 flex items-center gap-3 border-t border-dashed border-line pt-4">
        {r.photo ? (
          <Photo base={r.photo} alt={r.name} width={48} height={48} sizes="48px" className="size-11 rounded-full object-cover" />
        ) : (
          <span className="grid size-11 place-items-center rounded-full bg-brand-600 font-display text-sm font-bold text-brand-100">{r.name.charAt(0)}</span>
        )}
        <span className="min-w-0">
          <span className="block font-semibold text-ink">{r.name}</span>
          {(vacancy || city) && <span className="block text-[13px] leading-snug text-muted">{[vacancy, city].filter(Boolean).join(' · ')}</span>}
        </span>
      </figcaption>
    </figure>
  )
}

export function Faq({ items, title, eyebrow, lang = 'uk' }: { items: { q: string; a: string }[]; title?: string; eyebrow?: string; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  title ??= uk ? 'Часті запитання' : 'Частые вопросы'
  eyebrow ??= uk ? 'Питання та відповіді' : 'Вопросы и ответы'
  return (
    <section className="container-x grid gap-10 py-16 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="faq-h">
      <div>
        <SectionHead id="faq-h" eyebrow={eyebrow} title={title} />
        <p className="mt-4 max-w-sm text-ink-2">
          {uk ? 'Не знайшли відповідь? Напишіть у' : 'Не нашли ответ? Напишите в'}{' '}
          <a href={SITE.chat.telegram || SITE.telegram} target="_blank" rel="noopener" className="font-semibold text-brand-700 underline underline-offset-2">
            Telegram
          </a>{' '}
          {uk ? 'або зателефонуйте' : 'или позвоните'}{' '}
          <a href={`tel:${SITE.phone}`} className="font-semibold text-brand-700 underline underline-offset-2">
            {SITE.phoneDisplay}
          </a>
          .
        </p>
      </div>
      <div className="divide-y divide-line rounded-[26px] bg-white ring-1 ring-line">
        {items.map((f) => (
          <details key={f.q} className="group px-5 sm:px-7">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16.5px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 transition group-open:rotate-45 group-open:bg-brand-600 group-open:text-white">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </summary>
            <p className="-mt-1 pb-5 text-[15px] leading-relaxed text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function CtaBand({ title, text, form, lang = 'uk' }: { title: string; text: string; form: string; lang?: 'uk' | 'ru' }) {
  return (
    <section className="container-x py-16" aria-label={title}>
      <div className="brand-band grid gap-8 overflow-hidden rounded-[32px] p-7 text-white sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:p-12">
        <div>
          <h2 className="text-[26px] leading-tight sm:text-[34px]">{title}</h2>
          <p className="mt-3 max-w-md text-[16px] text-white/75">{text}</p>
          <ul className="mt-6 space-y-2.5 text-[15px] text-white/90">
            {(lang === 'uk'
              ? ['Консультація безкоштовна', 'Менеджер зателефонує сам', 'Підберемо вакансію під ваші документи']
              : ['Консультация бесплатная', 'Менеджер позвонит сам', 'Подберём вакансию под ваши документы']
            ).map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid size-6 place-items-center rounded-full bg-accent-600 text-white">
                  <IconCheck className="size-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[26px] bg-white p-5 text-ink sm:p-7">
          <LeadForm form={form} lang={lang} />
        </div>
      </div>
    </section>
  )
}

/** Full quiz embedded in a page section (home, catalog bottom, landings) */
export function QuizSection({ id, counts, preset, title, text }: { id: string; counts: Partial<Record<CountryCode, number>>; preset?: Record<string, string>; title: string; text?: string }) {
  return (
    <section className="py-16 [--notch:var(--color-surface)] sm:py-24" aria-labelledby={`${id}-h`}>
      <div className="container-x">
        <div className="rounded-[34px] bg-surface p-5 sm:p-10">
          <SectionHead id={`${id}-h`} eyebrow="Підбір за 1 хвилину" title={title} text={text} />
          <div className="mt-8">
            <QuizEngine config={standardQuiz(id, counts, preset)} />
          </div>
        </div>
      </div>
    </section>
  )
}

export const HOME_FAQ = [
  {
    q: 'Чи підійду я на вакансію?',
    a: 'Підберемо вакансію саме під вас — з урахуванням досвіду, документів і побажань щодо країни та роботи. На сайті лише частина пропозицій: якщо потрібної тут немає, знайдемо її під ваш запит. Залиште заявку або пройдіть підбір — менеджер запропонує варіанти.',
  },
  {
    q: 'Скільки коштують послуги агентства?',
    a: 'Сама вакансія для вас безкоштовна — оплачуються лише послуги з оформлення. Пакети: «Базовий» — 1099\u00a0грн, «Стандарт» — 1599\u00a0грн, «Преміум» — 2499\u00a0грн. Що входить у кожен пакет, дивіться на сторінці «Послуги та ціни».',
  },
  {
    q: 'Чи надається житло?',
    a: 'Так, на більшості вакансій роботодавець надає житло, а на багатьох — безкоштовно. Умови проживання вказані в описі кожної вакансії, там же є фото житла від наших клієнтів. У каталозі можна увімкнути фільтр «Житло безкоштовно».',
  },
  {
    q: 'Які документи потрібні для виїзду?',
    a: 'Потрібен закордонний біометричний паспорт. Залежно від країни та вашого статусу може знадобитися віза чи інші документи — менеджер перевірить ваші документи на безкоштовній консультації і підкаже, які вакансії доступні саме вам.',
  },
  {
    q: 'Як швидко можна виїхати на роботу?',
    a: 'Після реєстрації в базі роботодавця ми бронюємо для вас місце, а за 2–3 дні до виїзду надсилаємо маршрутний лист з адресою та контактами координатора. Точні терміни залежать від вакансії та ваших документів.',
  },
  {
    q: 'Що буде, якщо вакансія не підійде?',
    a: 'У разі серйозної причини ми безкоштовно замінимо вакансію в найкоротші терміни. Термін безкоштовної заміни залежить від пакета: «Базовий» — місяць, «Стандарт» — 6 місяців, «Преміум» — 12 місяців.',
  },
  {
    q: 'Це офіційне працевлаштування?',
    a: `Так. ${SITE.name} — офіційне кадрове агентство ТОВ «ЄВРОПА СЕРВІС УКРАЇНА» з ліцензією Мінсоцполітики № 223 від 15.02.2019. Ви працюєте за офіційним договором з роботодавцем — тип договору вказано в кожній вакансії.`,
  },
  {
    q: 'Чи є вакансії для жінок і сімейних пар?',
    a: 'Так. Усі вакансії відкриті для жінок, чоловіків і сімейних пар. Для пар підбираємо варіанти, де обоє працюють на одному підприємстві й живуть разом.',
  },
]

export const HOME_FAQ_RU = [
  {
    q: 'Подойду ли я на вакансию?',
    a: 'Подберём вакансию именно под вас — с учётом опыта, документов и пожеланий по стране и работе. На сайте только часть предложений: если нужной здесь нет, найдём её под ваш запрос. Оставьте заявку или пройдите подбор — менеджер предложит варианты.',
  },
  {
    q: 'Сколько стоят услуги агентства?',
    a: 'Сама вакансия для вас бесплатна — оплачиваются только услуги по оформлению. Пакеты: «Базовый» — 1099\u00a0грн, «Стандарт» — 1599\u00a0грн, «Премиум» — 2499\u00a0грн. Что входит в каждый пакет, смотрите на странице «Услуги и цены».',
  },
  {
    q: 'Предоставляется ли жильё?',
    a: 'Да, на большинстве вакансий работодатель предоставляет жильё, а на многих — бесплатно. Условия проживания указаны в описании каждой вакансии, там же есть фото жилья от наших клиентов. В каталоге можно включить фильтр «Жильё бесплатно».',
  },
  {
    q: 'Какие документы нужны для выезда?',
    a: 'Нужен заграничный биометрический паспорт. В зависимости от страны и вашего статуса может понадобиться виза или другие документы — менеджер проверит ваши документы на бесплатной консультации и подскажет, какие вакансии доступны именно вам.',
  },
  {
    q: 'Как быстро можно выехать на работу?',
    a: 'После регистрации в базе работодателя мы бронируем для вас место, а за 2–3 дня до выезда отправляем маршрутный лист с адресом и контактами координатора. Точные сроки зависят от вакансии и ваших документов.',
  },
  {
    q: 'Что будет, если вакансия не подойдёт?',
    a: 'При серьёзной причине мы бесплатно заменим вакансию в кратчайшие сроки. Срок бесплатной замены зависит от пакета: «Базовый» — месяц, «Стандарт» — 6 месяцев, «Премиум» — 12 месяцев.',
  },
  {
    q: 'Это официальное трудоустройство?',
    a: `Да. ${SITE.name} — официальное кадровое агентство ООО «ЕВРОПА СЕРВИС УКРАИНА» с лицензией Минсоцполитики № 223 от 15.02.2019. Вы работаете по официальному договору с работодателем — тип договора указан в каждой вакансии.`,
  },
  {
    q: 'Есть ли вакансии для женщин и семейных пар?',
    a: 'Да. Все вакансии открыты для женщин, мужчин и семейных пар. Для пар подбираем варианты, где оба работают на одном предприятии и живут вместе.',
  },
]
