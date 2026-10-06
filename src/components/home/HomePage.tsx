import Link from 'next/link'
import { getActiveVacancies } from '@/lib/vacancies'
import { getAbout } from '@/lib/about'
import { ARTICLES, HOME, REVIEWS, isObsolete, type HomeContent } from '@/lib/content'
import { CATALOG_PATH, COUNTRIES, COUNTRY, SITE } from '@/lib/site'
import { ruTwin } from '@/lib/alt-routes'
import { localize } from '@/lib/vacancy-i18n'
import { plural } from '@/lib/format'
import { organizationLd, websiteLd, faqLd } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { Photo } from '@/components/ui/Photo'
import { IconArrow, IconBuilding, IconShield, IconUsers, IconClock, IconPhone, IconCheck } from '@/components/ui/icons'
import { Faq, HOME_FAQ, HOME_FAQ_RU, ReviewCard } from '@/components/sections/Sections'
import { ClassicAdvantages, ClassicCta, ClassicSteps, ClassicVacancyCard } from '@/components/home/ClassicBlocks'
import { LeadForm } from '@/components/lead/LeadForm'
import { QuizButton } from '@/components/lead/LeadModal'
import { ChatButtons } from '@/components/lead/ChatButtons'
import { AnyRequest } from '@/components/lead/AnyRequest'
import { LicenseSection } from '@/components/trust/LicenseSection'
import { OfficeTeam } from '@/components/trust/OfficeTeam'
import { SocialLinks } from '@/components/layout/SocialLinks'
import { Blocks } from '@/components/content/Blocks'
import { YouTube } from '@/components/content/YouTube'

const TX = {
  uk: {
    vacancies: 'актуальних вакансій',
    h1: 'Офіційна робота в Європі для українців',
    sub: 'Польща, Німеччина, Чехія, Литва, Нідерланди та інші країни ЄС. Підберемо вакансію, допоможемо з документами й супроводимо до першого робочого дня.',
    pick: 'Підібрати вакансію',
    anyReq: 'Не знайшли свою вакансію? Підберемо під ваш запит — навіть якщо її немає на сайті.',
    allVac: 'Усі вакансії',
    lic: 'Ліцензія № 223',
    licSub: 'Мінсоцполітики, з 15.02.2019',
    office: '5 офісів',
    officeSub: 'Київ, Львів, Рівне, Житомир, Одеса',
    clients: 'клієнтів',
    clientsSub: 'за час роботи агентства',
    since: (y: number) => `З ${y} року`,
    sinceSub: 'на ринку працевлаштування',
    promoTag: 'Безкоштовна консультація',
    promo: 'Залиште номер — менеджер зателефонує й підбере вакансію під ваш досвід і документи',
    send: 'Замовити дзвінок',
    hot: 'Термінові заїзди',
    hotSub: 'Актуальні вакансії з виїздом найближчим часом',
    swipe: 'Гортайте вбік, щоб побачити більше →',
    allN: (n: number) => `Усі ${n} ${plural(n, ['вакансія', 'вакансії', 'вакансій'])}`,
    countries: 'Вибір країни для роботи',
    view: 'Переглянути',
    reviews: 'Відгуки наших клієнтів',
    allReviews: 'Усі відгуки',
    articles: 'Корисні статті',
    allArticles: 'Усі статті',
    read: 'Читати статтю →',
    social: 'Ми в соцмережах — вакансії та новини щодня',
    steps: '4 кроки до роботи в Європі',
    cities: 'Популярні міста Польщі',
    video: 'Відео про нас',
  },
  ru: {
    vacancies: 'актуальных вакансий',
    h1: 'Официальная работа в Европе для украинцев',
    sub: 'Польша, Германия, Чехия, Литва, Нидерланды и другие страны ЕС. Подберём вакансию, поможем с документами и сопроводим до первого рабочего дня.',
    pick: 'Подобрать вакансию',
    anyReq: 'Не нашли свою вакансию? Подберём под ваш запрос — даже если её нет на сайте.',
    allVac: 'Все вакансии',
    lic: 'Лицензия № 223',
    licSub: 'Минсоцполитики, с 15.02.2019',
    office: '5 офисов',
    officeSub: 'Киев, Львов, Ровно, Житомир, Одесса',
    clients: 'клиентов',
    clientsSub: 'за время работы агентства',
    since: (y: number) => `С ${y} года`,
    sinceSub: 'на рынке трудоустройства',
    promoTag: 'Бесплатная консультация',
    promo: 'Оставьте номер — менеджер позвонит и подберёт вакансию под ваш опыт и документы',
    send: 'Заказать звонок',
    hot: 'Срочные заезды',
    hotSub: 'Актуальные вакансии с выездом в ближайшее время',
    swipe: 'Листайте в сторону, чтобы увидеть больше →',
    allN: (n: number) => `Все ${n} ${plural(n, ['вакансия', 'вакансии', 'вакансий'])}`,
    countries: 'Выбор страны для работы',
    view: 'Смотреть',
    reviews: 'Отзывы наших клиентов',
    allReviews: 'Все отзывы',
    articles: 'Полезные статьи',
    allArticles: 'Все статьи',
    read: 'Читать статью →',
    social: 'Мы в соцсетях — вакансии и новости каждый день',
    steps: '4 шага к работе в Европе',
    cities: 'Популярные города Польши',
    video: 'Видео о нас',
  },
}

/** Short, plain steps (the audience reads on a phone) */
const STEPS = {
  uk: [
    { title: 'Заявка', text: 'Залишаєте номер — менеджер телефонує й підбирає вакансію саме під вас.' },
    { title: 'Документи', text: 'Допомагаємо з документами й реєструємо вас у роботодавця. Місце бронюємо за вами.' },
    { title: 'Маршрут', text: 'Перед виїздом надсилаємо маршрутний лист: адреса, контакти, як доїхати.' },
    { title: 'Приїзд і робота', text: 'На місці вас зустрічає координатор роботодавця, а менеджер лишається на зв’язку.' },
  ],
  ru: [
    { title: 'Заявка', text: 'Оставляете номер — менеджер звонит и подбирает вакансию именно под вас.' },
    { title: 'Документы', text: 'Помогаем с документами и регистрируем вас у работодателя. Место бронируем за вами.' },
    { title: 'Маршрут', text: 'Перед выездом отправляем маршрутный лист: адрес, контакты, как добраться.' },
    { title: 'Приезд и работа', text: 'На месте вас встречает координатор работодателя, а менеджер остаётся на связи.' },
  ],
}

function LogoStrip({ title, logos, plain }: { title: string; logos: { src: string; alt?: string; name?: string }[]; plain?: boolean }) {
  const list = logos.filter((l) => l.src)
  if (!list.length) return null
  return (
    <section className="container-x py-10" aria-label={title}>
      <h2 className="text-center text-[22px] sm:text-[28px]">{title}</h2>
      <ul className={`mt-6 grid items-center gap-x-6 gap-y-5 ${plain ? 'grid-cols-2 justify-items-center sm:mx-auto sm:max-w-xl' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'}`}>
        {list.map((l) => (
          <li key={l.src} className={`flex items-center justify-center ${plain ? 'h-44' : 'h-16'}`}>
            <Photo base={l.src} alt={l.alt || l.name || ''} width={plain ? 300 : 200} height={plain ? 300 : 100} sizes={plain ? '240px' : '160px'} className={`w-auto object-contain ${plain ? 'max-h-44' : 'max-h-14 opacity-75 mix-blend-multiply grayscale transition hover:opacity-100 hover:grayscale-0'}`} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export async function HomePage({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const t = TX[lang]
  const H: HomeContent = (uk ? HOME.uk : HOME.ru) ?? {}
  const U: HomeContent = HOME.uk ?? {}
  const p = (path: string) => (uk ? path : (ruTwin(path) ?? '/ru'))
  const [all, about] = await Promise.all([getActiveVacancies(), getAbout()])
  // «Термінові заїзди»: the vacancies marked hot, then the newest ones
  const byNew = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const hot = [...all.filter((v) => v.hot), ...byNew.filter((v) => !v.hot)].slice(0, 8).map((v) => localize(v, lang))
  const countries = COUNTRIES.map((c) => ({ ...c, count: all.filter((v) => v.country === c.code).length })).filter((c) => c.count)
  const countryCards = (U.countries?.items ?? []).filter((c) => c.country && COUNTRY[c.country])
  const reviews = REVIEWS.filter((r) => r.lang === lang && r.text && r.name).slice(0, 3)
  const faq = uk ? HOME_FAQ : HOME_FAQ_RU
  const advantages = H.advantages ?? U.advantages
  const stepIcons = (U.steps?.groups ?? []).flatMap((g) => g.items.map((i) => i.icon ?? '')).filter(Boolean)
  const steps = STEPS[lang].map((s, i) => ({ ...s, icon: stepIcons[i] ?? '' }))
  const byDate = (x: { datePublished?: string | null; date?: string | null }, y: { datePublished?: string | null; date?: string | null }) =>
    (y.datePublished ?? y.date ?? '').localeCompare(x.datePublished ?? x.date ?? '')
  const articles = ARTICLES.filter((a) => a.lang === lang && !isObsolete(a) && !a.listing && (a.cover || a.ogImage?.startsWith('/')))
    .sort(byDate)
    .slice(0, 4)
  const audiences = (U.audiences?.items ?? []).filter((a) => a.image)

  return (
    <>
      <JsonLd data={organizationLd(lang)} />
      <JsonLd data={websiteLd()} />
      <JsonLd data={faqLd(faq)} />

      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden bg-white">
        <span aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-brand-50" />
        <span aria-hidden className="pointer-events-none absolute -left-32 bottom-0 size-[320px] rounded-full bg-[#eaf2fb]" />
        <div className="container-x relative pb-10 pt-10 text-center sm:pb-14 sm:pt-16">
          <Link href={p(CATALOG_PATH)} className="inline-flex min-h-11 items-center rounded-full bg-brand-100 px-5 py-2 text-[14px] font-semibold text-brand-800 hover:bg-brand-200">
            {all.length} {t.vacancies}
          </Link>
          <h1 className="mx-auto mt-6 max-w-[860px] text-[28px] leading-[1.12] min-[360px]:text-[32px] min-[400px]:text-[36px] sm:text-[52px]">{t.h1}</h1>
          <p className="mx-auto mt-5 max-w-[660px] text-[17px] leading-relaxed text-ink-2">{t.sub}</p>
          {H.hero?.bullets?.length ? (
            <ul className="mx-auto mt-6 flex max-w-[760px] flex-wrap justify-center gap-x-5 gap-y-2 text-[15px] font-medium">
              {H.hero.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-white">
                    <IconCheck className="size-3" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <QuizButton id="hero" className="btn-accent !px-8 !py-4 !text-base">
              {t.pick}
            </QuizButton>
            <ChatButtons place="home-hero" lang={lang} inline />
            <Link href={p(CATALOG_PATH)} className="btn-ghost !px-8 !py-4 !text-base">
              {t.allVac} <IconArrow className="size-4" />
            </Link>
          </div>
          <p className="mt-4">
            <a href={`tel:${SITE.phone}`} className="inline-flex min-h-11 items-center gap-1.5 text-[16px] font-semibold text-brand-700">
              <IconPhone className="size-[18px]" /> <span className="whitespace-nowrap">{SITE.phoneDisplay}</span>{' '}
              <span className="font-normal text-muted">{uk ? '— безкоштовно з усіх операторів' : '— бесплатно со всех операторов'}</span>
            </a>
          </p>

          {/* trust row */}
          <ul className="mx-auto mt-10 grid max-w-[920px] grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {[
              { I: IconShield, t: t.lic, d: t.licSub, href: `${p('/about')}#perelik` },
              { I: IconBuilding, t: t.office, d: t.officeSub, href: p('/contacts') },
              { I: IconUsers, t: `${SITE.clients} ${t.clients}`, d: t.clientsSub, href: p('/vidguki') },
              { I: IconClock, t: t.since(SITE.foundingYear), d: t.sinceSub, href: p('/about') },
            ].map(({ I, t: title, d, href }) => (
              <li key={title}>
                <Link href={href} className="flex h-full flex-col gap-2 rounded-2xl bg-white p-3.5 ring-1 ring-brand-100 transition hover:ring-brand-300 sm:flex-row sm:items-center sm:gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600 sm:size-10">
                    <I className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold leading-tight">{title}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{d}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── HOT VACANCIES ───────── */}
      <section className="container-x py-12 sm:py-16" aria-labelledby="hot-h">
        <h2 id="hot-h" className="text-center text-[26px] sm:text-[34px]">{t.hot}</h2>
        <p className="mt-2 text-center text-[15px] text-muted">{t.hotSub}</p>
        <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
          {countries.map((c) => (
            <Link key={c.code} href={p(c.path)} className="chip shrink-0">
              <span aria-hidden>{c.flag}</span> {uk ? c.name : c.nameRu} <span className="text-xs">{c.count}</span>
            </Link>
          ))}
        </div>
        {/* phone: one swipeable row instead of 8 screens of scrolling */}
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {hot.map((v) => (
            <ClassicVacancyCard key={v.id} v={v} lang={lang} className="w-[82%] shrink-0 snap-center sm:w-auto" />
          ))}
        </div>
        <p aria-hidden className="mt-2 text-center text-[13px] text-muted sm:hidden">{t.swipe}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <QuizButton id="hot" className="btn-accent !px-8 !py-4 !text-base">
            {t.pick}
          </QuizButton>
          <Link href={p(CATALOG_PATH)} className="btn-ghost !px-8 !py-4 !text-base">
            {t.allN(all.length)}
          </Link>
        </div>
      </section>

      {/* ───────── CONSULTATION FORM ───────── */}
      <section className="container-x pb-6" aria-labelledby="promo-h">
        <div className="brand-band relative overflow-hidden rounded-[30px] px-5 py-10 text-center text-white sm:px-10 sm:py-12">
          <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full border border-white/15" />
          <span className="relative inline-flex rounded-full bg-white/15 px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.12em] ring-1 ring-white/30">{t.promoTag}</span>
          <h2 id="promo-h" className="relative mx-auto mt-4 max-w-2xl text-[20px] leading-snug sm:text-[28px]">
            {t.promo}
          </h2>
          <div className="relative mx-auto mt-7 max-w-[760px]">
            <LeadForm form={uk ? 'home-consult' : 'home-consult-ru'} inline dark submitLabel={t.send} lang={lang} />
          </div>
        </div>
      </section>

      {/* ───────── COUNTRIES (Tilda «Вибір країни для роботи») ───────── */}
      {countryCards.length > 0 && (
        <section className="container-x py-12 sm:py-16" aria-labelledby="countries-h">
          <h2 id="countries-h" className="text-center text-[26px] sm:text-[34px]">{t.countries}</h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {countryCards.map((c) => {
              const info = COUNTRY[c.country as string]
              const n = all.filter((v) => v.country === info.code).length
              return (
                <li key={info.code}>
                  <Link href={p(info.path)} className="group relative block overflow-hidden rounded-[22px] bg-brand-100">
                    {c.image && <Photo base={c.image} alt="" sizes="(max-width: 640px) 50vw, 300px" className="aspect-[4/3] w-full object-cover" />}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
                    <span className="absolute inset-x-0 bottom-0 p-3.5 text-white sm:p-4">
                      <span className="block text-[17px] font-bold leading-tight sm:text-[19px]">
                        <span aria-hidden>{info.flag}</span> {uk ? info.name : info.nameRu}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-white/85">{n ? `${n} ${plural(n, uk ? ['вакансія', 'вакансії', 'вакансій'] : ['вакансия', 'вакансии', 'вакансий'])}` : t.view}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="container-x pb-4">
        <AnyRequest lang={lang} id="home-any-request" className="mx-auto max-w-4xl" />
      </div>

      {/* ───────── AUDIENCES («Пропонуємо вакансії для кожного») ───────── */}
      {uk && audiences.length > 0 && (
        <section className="container-x py-12" aria-labelledby="aud-h">
          <h2 id="aud-h" className="text-center text-[26px] sm:text-[34px]">{U.audiences?.title}</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((a) => (
              <li key={a.title}>
                <Link href={a.href} className="group flex h-full flex-col overflow-hidden rounded-[22px] bg-white ring-1 ring-line transition hover:ring-brand-300">
                  <Photo base={a.image as string} alt="" sizes="(max-width: 640px) 100vw, 300px" className="aspect-[16/10] w-full object-cover" />
                  <span className="p-5">
                    <span className="block text-[18px] font-bold group-hover:text-brand-700">{a.title}</span>
                    {a.text && <span className="mt-1 block text-[14.5px] text-ink-2">{a.text}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {advantages && <ClassicAdvantages title={advantages.title} items={advantages.items.map((i) => ({ ...i, icon: i.icon ?? '' }))} />}
      <ClassicSteps title={t.steps} items={steps} lang={lang} />
      <ClassicCta lang={lang} />

      {/* ───────── TRUST: offices, licence, awards, press ───────── */}
      <OfficeTeam about={about} lang={lang} />
      <LicenseSection about={about} lang={lang} />
      {U.awards && <LogoStrip title={uk ? U.awards.title : 'Наши награды'} logos={U.awards.images} plain />}
      {U.employers && <LogoStrip title={uk ? U.employers.title : 'Работодатели, с которыми мы сотрудничаем'} logos={U.employers.logos} />}
      {U.press && <LogoStrip title={uk ? U.press.title : 'О нас пишут'} logos={U.press.logos} />}

      {U.video?.youtube && (
        <section className="container-x py-10" aria-labelledby="video-h">
          <h2 id="video-h" className="text-center text-[26px] sm:text-[34px]">{t.video}</h2>
          <div className="mx-auto mt-6 max-w-3xl">
            <YouTube id={U.video.youtube} title={t.video} />
          </div>
        </section>
      )}

      {/* ───────── REVIEWS ───────── */}
      {reviews.length > 0 && (
        <section className="container-x py-14" aria-labelledby="rev-h">
          <h2 id="rev-h" className="text-center text-[26px] sm:text-[34px]">{t.reviews}</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.name + (r.date ?? '') + r.text.slice(0, 12)} r={r} lang={lang} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={p('/vidguki')} className="btn-ghost">
              {t.allReviews} <IconArrow className="size-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ───────── POPULAR CITIES ───────── */}
      {uk && (U.cities?.items.length ?? 0) > 0 && (
        <section className="container-x pb-6" aria-labelledby="cities-h">
          <h2 id="cities-h" className="text-[20px]">{t.cities}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {U.cities!.items.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="chip">
                  {c.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ───────── SOCIALS ───────── */}
      <section className="container-x py-6" aria-labelledby="social-h">
        <div className="mx-auto max-w-4xl rounded-[24px] bg-surface p-5 sm:p-6">
          <h2 id="social-h" className="text-[18px] leading-snug sm:text-[20px]">{t.social}</h2>
          <SocialLinks lang={lang} place="home" className="mt-4" />
        </div>
      </section>

      {/* ───────── ARTICLES ───────── */}
      {articles.length > 0 && (
        <section className="container-x py-14" aria-labelledby="art-h">
          <h2 id="art-h" className="text-center text-[26px] sm:text-[34px]">{t.articles}</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((a) => (
              <Link key={a.path} href={a.path} className="group overflow-hidden rounded-[22px] bg-brand-50 transition lg:hover:shadow-[var(--shadow-lift)]">
                <div className="aspect-[16/10] overflow-hidden">
                  <Photo base={(a.cover || a.ogImage) as string} alt="" sizes="(max-width: 640px) 100vw, 300px" className="size-full object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="text-[16px] font-bold leading-snug group-hover:text-brand-700">{a.title}</h3>
                  <span className="mt-4 inline-flex text-sm font-semibold text-brand-800">{t.read}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={p('/news')} className="btn-ghost">
              {t.allArticles} <IconArrow className="size-4" />
            </Link>
          </div>
        </section>
      )}

      <Faq items={faq} lang={lang} />

      {/* ───────── SEO text of the Tilda home page ───────── */}
      {H.seoText?.length ? (
        <section className="container-x pb-14">
          <details className="mx-auto max-w-3xl rounded-2xl bg-surface p-5 sm:p-6">
            <summary className="cursor-pointer text-[17px] font-semibold">{uk ? 'Про роботу за кордоном з Europe Service' : 'О работе за границей с Europe Service'}</summary>
            <div className="mt-4">
              <Blocks blocks={H.seoText} />
            </div>
          </details>
        </section>
      ) : null}
    </>
  )
}
