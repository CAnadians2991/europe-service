import { freshDate } from '@/lib/format'
import { Photo, src } from '@/components/ui/Photo'
import { IconCheck, IconStar } from '@/components/ui/icons'
import { LeadForm } from '@/components/lead/LeadForm'
import { SITE } from '@/lib/site'
import type { ReviewItem } from '@/lib/content'

/** Section head: register label (optionally numbered «01 —»), the title, a short lead */
export function SectionHead({ eyebrow, title, text, center, id, dark, index }: { eyebrow?: string; title: string; text?: string; center?: boolean; id?: string; dark?: boolean; index?: number }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl'}>
      {eyebrow && (
        <p className={`eyebrow ${dark ? '!text-white/80' : ''}`}>
          {eyebrow}
        </p>
      )}
      <h2 id={id} className={`mt-3 text-[26px] sm:text-[38px] ${dark ? 'text-white' : 'text-ink'}`}>
        {title}
      </h2>
      {text && <p className={`mt-3 text-[16.5px] leading-relaxed ${dark ? 'text-white/80' : 'text-ink-2'}`}>{text}</p>}
    </div>
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

/** Review: the quote first, the person and the job underneath (register mono for date and place) */
export function ReviewCard({ r, lang = 'uk' }: { r: ReviewItem; lang?: 'uk' | 'ru' }) {
  const vacancy = lang === 'ru' ? (r.vacancyRu ?? r.vacancy) : r.vacancy
  const city = lang === 'ru' ? (r.cityRu ?? r.city) : r.city
  return (
    <figure className="relative flex h-full min-w-0 flex-col border border-line bg-white p-6">
      <span aria-hidden className="grad-text font-display text-[56px] font-bold leading-[0.6]">“</span>
      <blockquote lang={r.lang} className="relative mt-3 flex-1 text-[16px] leading-relaxed text-ink">{r.text}</blockquote>
      {r.photos && r.photos.length > 0 && (
        <div className="relative mt-4 grid grid-cols-3 gap-1.5">
          {r.photos.slice(0, 3).map((p, k) => (
            <a key={p} href={src(p, 1200)} target="_blank" rel="noopener" className="overflow-hidden bg-surface">
              <Photo base={p} alt={`${lang === 'uk' ? 'Фото від клієнта' : 'Фото от клиента'} ${k + 1}`} width={160} height={160} sizes="(max-width: 640px) 30vw, 120px" className="aspect-square w-full object-cover" />
            </a>
          ))}
        </div>
      )}
      <figcaption className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
        <span className="min-w-0">
          <span className="block font-semibold text-ink">{r.name}</span>
          {(vacancy || city) && <span className="block text-[13.5px] leading-snug text-muted">{[vacancy, city].filter(Boolean).join(' · ')}</span>}
        </span>
        <span className="shrink-0 text-right">
          {r.rating !== undefined && <Stars n={r.rating} lang={lang} />}
          {freshDate(r.date) && <span className="num mt-1 block text-[12px] text-muted">{freshDate(r.date)}</span>}
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
    <section className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="faq-h">
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
      <div className="border-t-[3px] border-ink">
        {items.map((f, i) => (
          <details key={f.q} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-start gap-4 py-5 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span className="num mt-0.5 w-7 shrink-0 text-[13px] font-medium text-muted">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1">{f.q}</span>
              <span className="grid size-8 shrink-0 place-items-center border border-line text-ink transition group-open:rotate-45 group-open:border-brand-600 group-open:bg-brand-600 group-open:text-white">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </summary>
            <p className="-mt-1 pb-6 pl-11 pr-12 text-[16px] leading-relaxed text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function CtaBand({ title, text, form, lang = 'uk' }: { title: string; text: string; form: string; lang?: 'uk' | 'ru' }) {
  return (
    <section className="container-x py-16" aria-label={title}>
      <div className="brand-band grid gap-8 overflow-hidden p-7 text-white sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:p-12">
        <div>
          <h2 className="text-[26px] leading-tight sm:text-[34px]">{title}</h2>
          <p className="mt-3 max-w-md text-[16px] text-white/75">{text}</p>
          <ul className="mt-6 space-y-2.5 text-[15px] text-white/90">
            {(lang === 'uk'
              ? ['Консультація безкоштовна', 'Менеджер зателефонує сам', 'Підберемо вакансію під ваші документи']
              : ['Консультация бесплатная', 'Менеджер позвонит сам', 'Подберём вакансию под ваши документы']
            ).map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid size-6 place-items-center bg-white text-brand-700">
                  <IconCheck className="size-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-5 text-ink sm:p-7">
          <LeadForm form={form} lang={lang} />
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
    a: `Так. ${SITE.name} — офіційне кадрове агентство ТОВ «ЄВРОПА СЕРВІС УКРАЇНА», з ліцензією Мінсоцполітики № 223 від 15.02.2019, внесене до державного Переліку посередників Мінекономіки. Ви працюєте за офіційним договором з роботодавцем — тип договору вказано в кожній вакансії.`,
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
    a: `Да. ${SITE.name} — официальное кадровое агентство ООО «ЕВРОПА СЕРВИС УКРАИНА», с лицензией Минсоцполитики № 223 от 15.02.2019, внесённое в государственный Перечень посредников Минэкономики. Вы работаете по официальному договору с работодателем — тип договора указан в каждой вакансии.`,
  },
  {
    q: 'Есть ли вакансии для женщин и семейных пар?',
    a: 'Да. Все вакансии открыты для женщин, мужчин и семейных пар. Для пар подбираем варианты, где оба работают на одном предприятии и живут вместе.',
  },
]
