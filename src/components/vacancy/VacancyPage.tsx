import Link from 'next/link'
import { Gallery } from './Gallery'
import { VacancyCard } from './VacancyCard'
import { Breadcrumbs } from './CatalogPage'
import { LicenseBadge } from '@/components/trust/LicenseBadge'
import { ANY_REQUEST, AnyRequest } from '@/components/lead/AnyRequest'
import { LeadForm } from '@/components/lead/LeadForm'
import { JsonLd } from '@/components/seo/JsonLd'
import { Photo, src } from '@/components/ui/Photo'
import { Stars } from '@/components/sections/Sections'
import { IconClock, IconDoc, IconHome, IconPhone, IconPin, IconWallet } from '@/components/ui/icons'
import { CATEGORY, COUNTRY, SITE } from '@/lib/site'
import { jobPostingLd } from '@/lib/seo'
import { salaryHour, salaryMonth, vacancyCity } from '@/lib/format'
import { toCard } from '@/lib/vacancies'
import { ruTwin } from '@/lib/alt-routes'
import type { Vacancy } from '@/lib/types'
import { ContactLinks } from './ContactLinks'
import { ChatButtons } from '@/components/lead/ChatButtons'
import { HeaderVacancyAction, QuizButton } from '@/components/lead/LeadModal'
import { QuickApply } from './QuickApply'


const norm = (t: string) => t.toLowerCase().replace(/[^a-zа-яіїєґё0-9]/gi, '')

const TX = {
  uk: {
    home: 'Головна', vac: 'Вакансії', work: 'Робота', place: 'Місце роботи', schedule: 'Графік', contract: 'Договір', housing: 'Проживання',
    closed: 'Набір на цю вакансію зараз закрито. Подивіться схожі пропозиції нижче або пройдіть підбір — запропонуємо актуальний аналог.',
    analog: 'Підібрати аналог', free: 'Житло безкоштовно', salary: 'Зарплата', net: '· на руки', gross: '· брутто',
    book: 'Забронювати місце', bookText: 'Залиште номер — менеджер перевірить наявність місць і розповість деталі.',
    housingPhotos: 'Фото житла', housingAlt: 'Житло для працівників — фото', reviews: 'Відгуки про роботу', leaveReview: 'Працювали тут? Залиште відгук',
    how: 'Як виїхати на цю вакансію',
    steps: [
      ['Заявка', 'Залишаєте номер — менеджер телефонує й відповідає на всі питання.'],
      ['Документи та реєстрація', 'Готуємо документи й реєструємо вас у базі роботодавця, бронюємо місце.'],
      ['Маршрутний лист', 'За 2–3 дні до виїзду надсилаємо адресу та контакти координатора.'],
      ['Приїзд і старт роботи', 'Вас зустрічає координатор роботодавця й допомагає з оформленням.'],
    ],
    freeNote: 'Вакансія для вас безкоштовна — оплачуються лише послуги агентства з оформлення.', prices: 'Пакети та ціни',
    ticket: 'Квиток на роботу', callback: 'Менеджер зателефонує й розповість деталі.', closedShort: 'Набір закрито', closedText: 'Підберемо схожу актуальну вакансію за 1 хвилину.',
    faster: 'Швидше — напишіть нам:', channels: 'Нові вакансії першими — у наших каналах:',
    income: 'Орієнтовний дохід залежить від кількості відпрацьованих годин. Актуальні умови уточнюйте в менеджера.',
    also: 'Дивіться також', all: 'Усі вакансії',
  },
  ru: {
    home: 'Главная', vac: 'Вакансии', work: 'Работа', place: 'Место работы', schedule: 'График', contract: 'Договор', housing: 'Проживание',
    closed: 'Набор на эту вакансию сейчас закрыт. Посмотрите похожие предложения ниже или пройдите подбор — предложим актуальный аналог.',
    analog: 'Подобрать аналог', free: 'Жильё бесплатно', salary: 'Зарплата', net: '· на руки', gross: '· брутто',
    book: 'Забронировать место', bookText: 'Оставьте номер — менеджер проверит наличие мест и расскажет детали.',
    housingPhotos: 'Фото жилья', housingAlt: 'Жильё для работников — фото', reviews: 'Отзывы о работе', leaveReview: 'Работали здесь? Оставьте отзыв',
    how: 'Как выехать на эту вакансию',
    steps: [
      ['Заявка', 'Оставляете номер — менеджер звонит и отвечает на все вопросы.'],
      ['Документы и регистрация', 'Готовим документы и регистрируем вас в базе работодателя, бронируем место.'],
      ['Маршрутный лист', 'За 2–3 дня до выезда отправляем адрес и контакты координатора.'],
      ['Приезд и начало работы', 'Вас встречает координатор работодателя и помогает с оформлением.'],
    ],
    freeNote: 'Вакансия для вас бесплатна — оплачиваются только услуги агентства по оформлению.', prices: 'Пакеты и цены',
    ticket: 'Билет на работу', callback: 'Менеджер позвонит и расскажет детали.', closedShort: 'Набор закрыт', closedText: 'Подберём похожую актуальную вакансию за 1 минуту.',
    faster: 'Быстрее — напишите нам:', channels: 'Новые вакансии первыми — в наших каналах:',
    income: 'Ориентировочный доход зависит от количества отработанных часов. Актуальные условия уточняйте у менеджера.',
    also: 'Смотрите также', all: 'Все вакансии',
  },
}

/** `v` and `similar` come already localized (see lib/vacancy-i18n) */
export function VacancyPage({ v, similar, lang = 'uk' }: { v: Vacancy; similar: Vacancy[]; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const t = TX[lang]
  const c = COUNTRY[v.country]
  const cName = uk ? c.name : c.nameRu
  const cPath = uk ? c.path : (ruTwin(c.path) ?? '/ru/vacancies/all')
  const city = vacancyCity(v)
  const month = salaryMonth(v.salary, lang)
  const hour = salaryHour(v.salary, lang)
  const crumbs = [
    { name: t.home, path: uk ? '/' : '/ru' },
    { name: t.vac, path: uk ? '/vacancies/all' : '/ru/vacancies/all' },
    { name: `${t.work} ${uk ? c.inName : c.inNameRu}`, path: cPath },
    { name: v.company || v.title, path: v.path },
  ]

  const facts = [
    { icon: IconPin, label: t.place, value: [city, cName].filter(Boolean).join(', ') },
    { icon: IconClock, label: t.schedule, value: v.schedule },
    { icon: IconDoc, label: t.contract, value: v.contract },
    { icon: IconHome, label: t.housing, value: v.housing },
  ].filter((f) => f.value)

  return (
    <>
      {v.active && <JsonLd data={jobPostingLd(v, lang)} />}

      <div className="border-b border-line bg-surface">
        <div className="container-x text-ink-2">
          <Breadcrumbs items={crumbs} />
        </div>
      </div>

      {!v.active && (
        <div className="bg-danger/10">
          <div className="container-x flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="font-semibold text-ink">{t.closed}</p>
            <QuizButton id="closed-vacancy" preset={{ country: v.country }} className="btn-dark !py-2.5">{t.analog}</QuizButton>
          </div>
        </div>
      )}

      <article className="container-x grid gap-8 py-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        <div className="min-w-0">
          {/* title block */}
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] sm:text-[13px]">
            <Link href={cPath} className="relative inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 font-semibold text-white after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] hover:bg-brand-700">
              <span aria-hidden>{c.flag}</span> {cName}
            </Link>
            <span className={`rounded-full bg-white px-2.5 py-0.5 font-medium text-ink-2 ring-1 ring-line ${v.housingFree && v.active ? 'max-[419px]:hidden' : ''}`}>{uk ? CATEGORY[v.category]?.name : CATEGORY[v.category]?.nameRu}</span>
            {v.housingFree && v.active && <span className="rounded-full bg-ok px-2.5 py-0.5 font-semibold text-white">{t.free}</span>}
          </div>
          <div className="mt-3 flex items-start gap-4">
            <h1 className="flex-1 text-[26px] leading-[1.12] text-ink sm:text-[34px]">{v.title}</h1>
            {v.logo && (
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-line sm:size-20">
                <Photo base={v.logo} alt={v.company || ''} width={80} height={80} sizes="80px" className="size-full object-contain" />
              </span>
            )}
          </div>
          {city && (
            <p className="mt-2 flex items-center gap-1.5 text-[15px] text-muted">
              <IconPin className="size-4" /> {city}, {cName}
            </p>
          )}

          {/* salary (mobile-first, repeated in sidebar on desktop) */}
          <div className="brand-band mt-5 rounded-[24px] p-5 text-white lg:hidden">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">{t.salary}{v.salary.unlabelled ? '' : ` ${v.salary.net ? t.net : t.gross}`}</p>
              <p className="font-display text-sm font-bold"><span aria-hidden>{c.flag}</span> {cName}</p>
            </div>
            <p className="mt-1 font-display text-[24px] font-bold leading-tight tracking-tight">{month || hour || v.salary.text.split(/[;(]/)[0]}</p>
            {month && hour && <p className="mt-0.5 font-semibold text-white">{hour}</p>}
          </div>
          {v.active && (
            <div className="mt-3 flex gap-2 lg:hidden">
              <QuickApply
                id={v.id}
                title={v.title}
                lang={lang}
                form={uk ? 'vacancy-top' : 'vacancy-top-ru'}
                label={t.book}
                submitLabel={t.book}
                className="btn-accent min-w-0 flex-1 !px-4 !py-3 !text-[15px]"
              />
              <ChatButtons place="vacancy-top" lang={lang} compact />
            </div>
          )}

          <div className="mt-6">
            <Gallery photos={v.photos} alt={v.title} priority lang={lang} />
          </div>

          {/* facts */}
          <dl className="mt-6 grid grid-cols-2 gap-2 sm:gap-3">
            {facts.map((f) => (
              <div key={f.label} className="grid grid-cols-1 gap-x-3 gap-y-1 rounded-2xl bg-white p-3.5 ring-1 ring-line sm:grid-cols-[40px_1fr] sm:p-4">
                <dt className="contents">
                  <span className="hidden size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 sm:row-span-2 sm:grid">
                    <f.icon className="size-5" />
                  </span>
                  <span className="text-[13px] font-semibold text-muted">{f.label}</span>
                </dt>
                <dd className="text-[14px] font-semibold leading-snug text-ink sm:col-start-2 sm:mt-0.5 sm:text-[15px]">{f.value}</dd>
              </div>
            ))}
          </dl>

          {/* mobile form right after the facts */}
          {v.active && <div id="apply-mobile" className="mt-8 rounded-[24px] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-line lg:hidden">
            <p className="font-display text-xl font-semibold">{t.book}</p>
            <p className="mt-1 text-[15px] text-ink-2">{t.bookText}</p>
            <p className="mt-2 text-[14px] font-semibold text-brand-800">{ANY_REQUEST[lang].short}</p>
            <div className="mt-4">
              <LeadForm form={uk ? 'vacancy' : 'vacancy-ru'} vacancyId={v.id} vacancyTitle={v.title} submitLabel={t.book} lang={lang} />
            </div>
            <LicenseBadge className="mt-4" lang={lang} />
          </div>
          }

          {/* description */}
          <div className="mt-10">
            {v.headline && norm(v.headline) !== norm(v.title) && <h2 className="text-[24px] text-ink">{v.headline}</h2>}
            {v.intro && <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{v.intro}</p>}
            <div className="mt-6 space-y-4">
              {v.sections.map((s) => (
                <section key={s.title} className="rounded-[24px] bg-white p-5 ring-1 ring-line sm:p-6">
                  <h2 className="text-[18px] text-ink">{s.title}</h2>
                  <ul className="mt-3 space-y-2">
                    {s.items.map((it, k) =>
                      /:\s*$/.test(it) && it.length < 60 ? (
                        <li key={k} className="pt-2 text-[15px] font-semibold text-ink first:pt-0">
                          {it}
                        </li>
                      ) : (
                        <li key={k} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
                          <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent-600" />
                          <span>{it}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          <AnyRequest lang={lang} id="vacancy-any-request" preset={{ country: v.country }} className="mt-8" />

          {v.housingPhotos.length > 0 && (
            <section className="mt-10" aria-labelledby="housing-h">
              <h2 id="housing-h" className="text-[24px]">{t.housingPhotos}</h2>
              {v.housingNote && <p className="mt-2 text-sm text-muted">{v.housingNote}</p>}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {v.housingPhotos.map((p, k) => (
                  <a key={p} href={src(p, 1200)} target="_blank" rel="noopener" className="overflow-hidden rounded-2xl bg-brand-50">
                    <Photo base={p} alt={`${t.housingAlt} ${k + 1}`} sizes="(max-width: 640px) 50vw, 260px" className="aspect-[4/3] w-full object-cover transition" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {v.reviews.length > 0 && (
            <section className="mt-10" aria-labelledby="vrev-h">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 id="vrev-h" className="text-[24px]">{t.reviews}</h2>
                <Link href={uk ? '/vidguki#review-form-h' : '/ru/otzyvy#review-form-h'} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 underline underline-offset-2">{t.leaveReview}</Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {v.reviews.map((r) => {
                  // dated reviews (from the clients' group) show stars only if the client rated; older ones keep 5
                  const stars = r.rating ?? (r.date ? undefined : 5)
                  return (
                    <figure key={r.name + r.text.slice(0, 10)} className="rounded-[24px] bg-white p-5 ring-1 ring-line">
                      {stars !== undefined && <Stars n={stars} lang={lang} />}
                      {/* reviews are quoted as the client wrote them (mostly Ukrainian) — mark the language for screen readers and search engines */}
                      <blockquote lang={/[іїєґ]/i.test(r.text) ? 'uk' : /[ыэъё]/i.test(r.text) ? 'ru' : undefined} className={`${stars !== undefined ? 'mt-2 ' : ''}text-[15px] leading-relaxed text-ink-2`}>«{r.text}»</blockquote>
                      <figcaption className="mt-3 font-bold">
                        {r.name}
                        {r.date && <span className="font-normal text-muted"> · {r.date}</span>}
                      </figcaption>
                    </figure>
                  )
                })}
              </div>
            </section>
          )}

          <section className="mt-10 rounded-[24px] bg-white p-6 ring-1 ring-line" aria-labelledby="how-h">
            <h2 id="how-h" className="text-[20px]">{t.how}</h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2">
              {t.steps.map(([st, d], k) => (
                <li key={st} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 font-display text-xs font-bold text-white">0{k + 1}</span>
                  <span>
                    <span className="block font-bold">{st}</span>
                    <span className="text-[15px] text-ink-2">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-muted">
              {t.freeNote}{' '}
              <Link href={uk ? '/poslugi' : '/ru/services'} className="font-semibold text-brand-700 underline underline-offset-2">{t.prices}</Link>
            </p>
          </section>
          {/* after reading everything — book right here instead of scrolling back to the top (phones; desktop has the sticky sidebar) */}
          {v.active && (
            <div className="mt-4 flex gap-2 lg:hidden">
              <QuickApply
                id={v.id}
                title={v.title}
                lang={lang}
                form={uk ? 'vacancy-bottom' : 'vacancy-bottom-ru'}
                label={t.book}
                submitLabel={t.book}
                className="btn-accent min-w-0 flex-1 !px-4 !py-3 !text-[15px]"
              />
              <ChatButtons place="vacancy-bottom" lang={lang} compact />
            </div>
          )}
        </div>

        {/* sticky sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-[96px] space-y-4">
            <div className="overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-lift)] ring-1 ring-brand-100">
              <div className="brand-band px-6 pb-6 pt-5 text-white">
                <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.2em] text-white/55">
                  <span>{t.ticket}</span>
                  <span>№ {v.id.slice(0, 10).toUpperCase()}</span>
                </div>
                {/* destination only — candidates come from Ukraine and from abroad alike */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-[30px] leading-none" aria-hidden>{c.flag}</span>
                  <span className="font-display text-[26px] font-bold leading-none">{cName}</span>
                </div>
                <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">{t.salary}{v.salary.unlabelled ? '' : ` ${v.salary.net ? t.net : t.gross}`}</p>
                <p className="mt-1 font-display text-[26px] font-bold leading-tight tracking-tight">{month || hour || v.salary.text.split(/[;(]/)[0]}</p>
                {month && hour && <p className="mt-0.5 font-semibold text-white">{hour}</p>}
              </div>
              <div className="ticket-perf" />
              <div className="p-6 pt-5">
                {v.active ? (
                  <>
                    <p id="apply" className="font-display text-lg font-semibold">{t.book}</p>
                    <p className="mt-1 text-sm text-ink-2">{t.callback}</p>
                    <p className="mt-2 text-[13.5px] font-semibold text-brand-800">{ANY_REQUEST[lang].short}</p>
                    <div className="mt-4">
                      <LeadForm form={uk ? 'vacancy' : 'vacancy-ru'} vacancyId={v.id} vacancyTitle={v.title} submitLabel={t.book} compact lang={lang} />
                    </div>
                    <LicenseBadge className="mt-4" lang={lang} />
                  </>
                ) : (
                  <>
                    <p className="font-display text-lg font-semibold">{t.closedShort}</p>
                    <p className="mt-1 text-sm text-ink-2">{t.closedText}</p>
                    <QuizButton id="closed-vacancy-side" preset={{ country: v.country }} className="btn-accent mt-4 w-full !py-3.5">
                      {t.analog}
                    </QuizButton>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-[24px] bg-white p-5 ring-1 ring-line">
              <p className="text-sm font-semibold text-ink-2">{SITE.chat.telegram || SITE.chat.viber ? t.faster : t.channels}</p>
              <ContactLinks place="vacancy-sidebar" lang={lang} />
              <a href={`tel:${SITE.phone}`} className="mt-3 flex min-h-11 items-center gap-2 text-[15px] font-bold text-ink hover:text-brand-700">
                <IconPhone className="size-5 text-brand-600" /> {SITE.phoneDisplay}
              </a>
            </div>
            <p className="flex items-start gap-2 px-2 text-xs text-muted">
              <IconWallet className="size-4 shrink-0" /> {t.income}
            </p>
          </div>
        </aside>
      </article>

      {similar.length > 0 && (
        <section className="bg-surface py-14 [--notch:var(--color-surface)]" aria-labelledby="sim-h">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="sim-h" className="text-[26px]">{t.also}</h2>
              <Link href={cPath} className="btn-ghost">{t.all} {uk ? c.inName : c.inNameRu}</Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <VacancyCard key={s.id} v={toCard(s)} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {v.active && <HeaderVacancyAction vacancyId={v.id} vacancyTitle={v.title} />}
    </>
  )
}
