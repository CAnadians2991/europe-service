import Link from 'next/link'
import { getActiveVacancies, toCard } from '@/lib/vacancies'
import { getAbout } from '@/lib/about'
import { ARTICLES, HOME, REVIEWS, isObsolete, type HomeContent } from '@/lib/content'
import { CATALOG_PATH, COUNTRIES } from '@/lib/site'
import { localHref, ruTwin } from '@/lib/alt-routes'
import { localize } from '@/lib/vacancy-i18n'
import { formatDate, plural } from '@/lib/format'
import { organizationLd, websiteLd, faqLd } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { Photo } from '@/components/ui/Photo'
import { IconArrow } from '@/components/ui/icons'
import { Faq, HOME_FAQ, HOME_FAQ_RU, ReviewCard, SectionHead } from '@/components/sections/Sections'
import { VacancyCard } from '@/components/vacancy/VacancyCard'
import { LeadForm } from '@/components/lead/LeadForm'
import { QuizButton } from '@/components/lead/LeadModal'
import { LicenseSection } from '@/components/trust/LicenseSection'
import { Guarantees } from '@/components/trust/Guarantees'
import { PressAwards } from '@/components/trust/PressAwards'
import { PackagePitch } from '@/components/services/PackagePitch'
import { VacancyTicker } from './VacancyTicker'
import { Reveal } from '@/components/ui/Reveal'
import { CountUp } from '@/components/ui/CountUp'
import { ClientVideos, HomeHero, HousingStrip, JobCategories, categoryPhotos } from './HomeVisual'
import { TeamSection } from '@/components/trust/TeamStory'
import { SocialLinks } from '@/components/layout/SocialLinks'
import { Blocks } from '@/components/content/Blocks'

const TX = {
  uk: {
    kicker: 'Кадрове агентство · Київ · з 2018 року',
    h1: 'Офіційна робота в Європі для українців',
    sub: 'Польща, Німеччина, Чехія, Литва, Нідерланди та ще 9 країн ЄС. Підберемо вакансію під ваш досвід і документи, допоможемо з оформленням і будемо на зв’язку до першого робочого дня.',
    pick: 'Підібрати вакансію',
    all: (n: number) => `Усі ${n} ${plural(n, ['вакансія', 'вакансії', 'вакансій'])}`,
    free: '— безкоштовно з усіх операторів України',
    open: 'Відкрито зараз',
    openSub: 'вакансій у реєстрі',
    updated: 'оновлюється щодня',
    allCountries: 'Усі країни',
    facts: (vac: number, countries: number) => [
      [String(vac), 'відкритих вакансій прямо зараз'],
      [String(countries), 'країн: Польща, Німеччина, Литва, Чехія…'],
      ['Житло', 'від роботодавця — у багатьох вакансіях'],
      ['5 офісів', 'Київ, Львів, Рівне, Житомир, Одеса'],
    ],
    hot: 'Термінові заїзди',
    hotText: 'Вакансії з виїздом найближчим часом — житло, офіційний договір, супровід.',
    countries: 'Країни',
    countriesTitle: 'Вакансії по країнах',
    consultTag: 'Безкоштовна консультація',
    consult: 'Залиште номер — менеджер зателефонує й підбере вакансію під ваш досвід і документи',
    send: 'Замовити дзвінок',
    stepsLabel: 'Як ми працюємо',
    stepsTitle: 'Від заявки до першого робочого дня',
    advLabel: 'Чому Europe Service',
    awards: 'Нагороди',
    press: 'Про нас пишуть',
    employers: 'Роботодавці, з якими ми співпрацюємо',
    reviews: 'Відгуки клієнтів',
    allReviews: 'Усі відгуки',
    video: 'Відео про нас',
    articles: 'Новини та статті',
    allArticles: 'Усі статті',
    cities: 'Робота в містах Польщі',
    directions: 'Напрямки',
    social: 'Вакансії щодня — у наших спільнотах',
    seo: 'Про роботу за кордоном',
  },
  ru: {
    kicker: 'Кадровое агентство · Киев · с 2018 года',
    h1: 'Официальная работа в Европе для украинцев',
    sub: 'Польша, Германия, Чехия, Литва, Нидерланды и ещё 9 стран ЕС. Подберём вакансию под ваш опыт и документы, поможем с оформлением и будем на связи до первого рабочего дня.',
    pick: 'Подобрать вакансию',
    all: (n: number) => `Все ${n} ${plural(n, ['вакансия', 'вакансии', 'вакансий'])}`,
    free: '— бесплатно со всех операторов Украины',
    open: 'Открыто сейчас',
    openSub: 'вакансий в реестре',
    updated: 'обновляется ежедневно',
    allCountries: 'Все страны',
    facts: (vac: number, countries: number) => [
      [String(vac), 'открытых вакансий прямо сейчас'],
      [String(countries), 'стран: Польша, Германия, Литва, Чехия…'],
      ['Жильё', 'от работодателя — во многих вакансиях'],
      ['5 офисов', 'Киев, Львов, Ровно, Житомир, Одесса'],
    ],
    hot: 'Срочные заезды',
    hotText: 'Вакансии с выездом в ближайшее время — жильё, официальный договор, сопровождение.',
    countries: 'Страны',
    countriesTitle: 'Вакансии по странам',
    consultTag: 'Бесплатная консультация',
    consult: 'Оставьте номер — менеджер позвонит и подберёт вакансию под ваш опыт и документы',
    send: 'Заказать звонок',
    stepsLabel: 'Как мы работаем',
    stepsTitle: 'От заявки до первого рабочего дня',
    advLabel: 'Почему Europe Service',
    awards: 'Награды',
    press: 'О нас пишут',
    employers: 'Работодатели, с которыми мы сотрудничаем',
    reviews: 'Отзывы клиентов',
    allReviews: 'Все отзывы',
    video: 'Видео о нас',
    articles: 'Новости и статьи',
    allArticles: 'Все статьи',
    cities: 'Работа в городах Польши',
    directions: 'Направления',
    social: 'Вакансии каждый день — в наших сообществах',
    seo: 'О работе за границей',
  },
}

const STEPS = {
  uk: [
    ['Залишаєте номер', 'Менеджер напише у Viber, Telegram або зателефонує, коли вам зручно.'],
    ['Обираєте роботу', 'Розповімо про умови, житло й договір. Рішення — за вами, ми лише радимо.'],
    ['Готуємо до виїзду', 'Резюме, реєстрація в роботодавця, бронь місця, маршрут і допомога з квитками.'],
    ['Ведемо до роботи', 'Координуємо дорогу до місця, а менеджер лишається на зв’язку.'],
  ],
  ru: [
    ['Оставляете номер', 'Менеджер напишет в Viber, Telegram или позвонит, когда вам удобно.'],
    ['Выбираете работу', 'Расскажем об условиях, жилье и договоре. Решение — за вами, мы только советуем.'],
    ['Готовим к выезду', 'Резюме, регистрация у работодателя, бронь места, маршрут и помощь с билетами.'],
    ['Ведём до работы', 'Координируем дорогу до места, а менеджер остаётся на связи.'],
  ],
}

function LogoRow({ title, logos, big }: { title: string; logos: { src: string; alt?: string; name?: string }[]; big?: boolean }) {
  const list = logos.filter((l) => l.src)
  if (!list.length) return null
  return (
    <div className="border-t border-line pt-5">
      <p className="eyebrow">{title}</p>
      <ul className={`mt-4 flex flex-wrap items-center ${big ? 'gap-6' : 'gap-x-8 gap-y-4'}`}>
        {list.map((l) => (
          <li key={l.src} className={big ? 'h-40' : 'h-11'}>
            <Photo base={l.src} alt={l.alt || l.name || ''} width={big ? 300 : 160} height={big ? 300 : 80} sizes={big ? '200px' : '140px'} className={`h-full w-auto object-contain ${big ? '' : 'opacity-70 mix-blend-multiply grayscale transition hover:opacity-100 hover:grayscale-0'}`} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export async function HomePage({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const t = TX[lang]
  const H: HomeContent = (uk ? HOME.uk : HOME.ru) ?? {}
  const U: HomeContent = HOME.uk ?? {}
  const p = (path: string) => (uk ? path : (ruTwin(path) ?? '/ru'))
  const catalog = uk ? CATALOG_PATH : '/ru' + CATALOG_PATH
  const [all, about] = await Promise.all([getActiveVacancies(), getAbout()])
  const byNew = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const hot = [...all.filter((v) => v.hot), ...byNew.filter((v) => !v.hot)].slice(0, 6).map((v) => toCard(localize(v, lang)))
  const countries = COUNTRIES.map((c) => ({ ...c, count: all.filter((v) => v.country === c.code).length })).filter((c) => c.count)
  // real photos: workplaces (hot vacancy covers), housing sent by clients, video reviews of clients
  const heroPhotos = categoryPhotos(all)
  const heroList = [heroPhotos.warehouse, heroPhotos.horeca, heroPhotos.construction].filter(Boolean) as string[]
  const housing = [...new Set(all.flatMap((v) => v.housingPhotos.slice(0, 2)))].slice(0, 16)
  const videos = REVIEWS.filter((r) => r.video && r.video.endsWith('.mp4') && (r.lang === lang || lang === 'ru'))
    .map((r) => ({ poster: r.video!.replace(/\.mp4$/, '.webp'), name: r.name, vacancy: (lang === 'ru' ? r.vacancyRu : undefined) ?? r.vacancy, city: r.city }))
    .filter((v) => !v.poster.includes('/work-'))
  const countryImage: Record<string, string> = Object.fromEntries((U.countries?.items ?? []).filter((c) => c.country && c.image).map((c) => [c.country as string, c.image as string]))
  for (const c of countries) if (!countryImage[c.code]) {
    const v = all.find((x) => x.country === c.code && x.photos[0])
    if (v) countryImage[c.code] = v.photos[0]
  }
  const reviews = REVIEWS.filter((r) => r.lang === lang && r.text && r.name).slice(0, 3)
  const faq = uk ? HOME_FAQ : HOME_FAQ_RU
  const byDate = (x: { datePublished?: string | null; date?: string | null }, y: { datePublished?: string | null; date?: string | null }) =>
    (y.datePublished ?? y.date ?? '').localeCompare(x.datePublished ?? x.date ?? '')
  const articles = ARTICLES.filter((a) => a.lang === lang && !isObsolete(a) && !a.listing && (a.cover || a.ogImage?.startsWith('/')))
    .sort(byDate)
    .slice(0, 4)

  return (
    <>
      <JsonLd data={organizationLd(lang)} />
      <JsonLd data={websiteLd()} />
      <JsonLd data={faqLd(faq)} />

      {/* ───────── HERO: what we do + the request form right away ───────── */}
      <HomeHero lang={lang} photos={heroList} />

      <section className="border-b border-line bg-white" aria-label={uk ? 'Europe Service у цифрах' : 'Europe Service в цифрах'}>
        {/* facts strip */}
        <div className="border-t border-line">
          <dl className="container-x grid grid-cols-2 lg:grid-cols-4">
            {t.facts(all.length, countries.length).map(([v, l], i) => (
              <div key={v} className={`py-5 pr-4 ${i % 2 ? 'border-l border-line pl-4 lg:pl-6' : ''} ${i > 1 ? 'border-t border-line lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l lg:pl-6' : ''}`}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-[24px] font-semibold leading-none tracking-[-0.02em] sm:text-[30px]">
                  <CountUp value={v} />
                </dd>
                <dd className="mt-2 text-[14px] leading-snug text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <VacancyTicker list={byNew.slice(0, 14).map((v) => localize(v, lang))} lang={lang} />
      </section>

      {/* ───────── GUARANTEES first: trust before the offer ───────── */}
      <Guarantees lang={lang} />

      {/* ───────── COUNTRIES — compact index (owner, 2026-10: above the job types) ───────── */}
      <section className="container-x pt-10 sm:pt-16" aria-labelledby="countries-h">
        <SectionHead id="countries-h" title={t.countriesTitle} />
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {countries.map((c) => (
            <li key={c.code}>
              <Link href={localHref(c.path, lang)} className="group flex min-h-14 items-center gap-3 rounded-xl border border-line bg-white p-2 pr-3 transition hover:border-brand-600">
                {countryImage[c.code] ? (
                  <Photo base={countryImage[c.code]} alt="" width={64} height={64} sizes="44px" className="size-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="brand-band grid size-10 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-semibold uppercase text-white">{c.code}</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold leading-tight group-hover:text-brand-700 sm:text-[15.5px]">{uk ? c.name : c.nameRu}</span>
                  <span className="num block text-[12px] text-muted">{c.count} {plural(c.count, uk ? ['вакансія', 'вакансії', 'вакансій'] : ['вакансия', 'вакансии', 'вакансий'])}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {uk && (U.cities?.items.length || U.audiences?.items.length) ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {[...(U.cities?.items ?? []).map((c) => ({ href: c.href, text: c.text })), ...(U.audiences?.items ?? []).map((a) => ({ href: a.href, text: a.title }))].map((x) => (
              <Link key={x.href + x.text} href={x.href} className="chip !text-[13px]">
                {x.text}
              </Link>
            ))}
          </div>
        ) : null}
      </section>


      {/* ───────── ANY JOB: job types as photo tiles ───────── */}
      <JobCategories lang={lang} all={all} photos={categoryPhotos(all)} catalog={catalog} />

      {/* ───────── 01 HOT VACANCIES ───────── */}
      <section className="container-x py-16 sm:py-20" aria-labelledby="hot-h">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead id="hot-h" title={t.hot} text={t.hotText} />
          <Link href={catalog} className="btn-ghost">
            {t.all(all.length)} <IconArrow className="size-4" />
          </Link>
        </div>
        <div className="mt-8 overflow-hidden rounded-[18px] border-x border-t border-line bg-white">
          {hot.map((v, i) => (
            <VacancyCard key={v.id} v={v} lang={lang} priority={i === 0} />
          ))}
        </div>
      </section>

      {/* ───────── about us from outside: the 1+1 story and the awards ───────── */}
      <PressAwards lang={lang} />

      {/* ───────── OUR OFFICE & TEAM (owner's shoot), then the documents ───────── */}
      <TeamSection lang={lang} />
      <LicenseSection about={about} lang={lang} compact />

      {/* ───────── STEPS — compact (owner, 2026-10: «not that important to take so much space») ───────── */}
      <section className="border-y border-line bg-white" aria-labelledby="steps-h">
        <div className="container-x py-10 sm:py-14">
          <SectionHead id="steps-h" title={t.stepsTitle} />
          <ol className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS[lang].map(([title, text], i) => (
              <li key={title} className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-3">
                <span className="num grid size-8 place-items-center rounded-full bg-brand-600 text-[14px] font-semibold text-white">{i + 1}</span>
                <span>
                  <span className="block text-[16px] font-semibold leading-snug sm:text-[17px]">{title}</span>
                  <span className="mt-0.5 block text-[14px] leading-snug text-muted sm:text-[14.5px]">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <QuizButton id="steps" className="btn-accent !px-6">
              {t.pick} <IconArrow className="size-4" />
            </QuizButton>
          </div>
        </div>
      </section>

      {/* ───────── why a package when somewhere it is «free» ───────── */}
      <PackagePitch lang={lang} href={uk ? '/poslugi' : '/ru/services'} />

      <HousingStrip lang={lang} photos={housing} />
      <ClientVideos lang={lang} videos={videos} />

      {/* ───────── REVIEWS ───────── */}
      {reviews.length > 0 && (
        <section className="border-t border-line bg-white" aria-labelledby="rev-h">
          <div className="container-x py-16 sm:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHead id="rev-h" title={t.reviews} />
              <Link href={p('/vidguki')} className="btn-ghost">
                {t.allReviews} <IconArrow className="size-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {reviews.map((r) => (
                <ReviewCard key={r.name + (r.date ?? '') + r.text.slice(0, 12)} r={r} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ───────── CONSULTATION ───────── */}
      <section className="container-x py-16" aria-labelledby="consult-h">
        <div className="brand-band grid gap-8 p-6 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:p-12">
          <div>
            <p className="eyebrow !text-white/85">{t.consultTag}</p>
            <h2 id="consult-h" className="mt-3 text-[24px] sm:text-[32px]">{t.consult}</h2>
          </div>
          <div className="bg-white p-5 text-ink sm:p-6">
            <LeadForm form={uk ? 'home-consult' : 'home-consult-ru'} submitLabel={t.send} lang={lang} />
          </div>
        </div>
      </section>


      {/* ───────── EMPLOYERS (awards and the 1+1 story moved up, next to the client videos) ───────── */}
      {U.employers && (
        <section className="container-x py-12 sm:py-16" aria-label={t.employers}>
          <LogoRow title={t.employers} logos={U.employers.logos} />
        </section>
      )}

      {/* ───────── ARTICLES — editorial ───────── */}
      {articles.length > 0 && (
        <section className="container-x py-16 sm:py-20" aria-labelledby="art-h">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead id="art-h" title={t.articles} />
            <Link href={p('/news')} className="btn-ghost">
              {t.allArticles} <IconArrow className="size-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <Link href={articles[0].path} className="group block">
              <Photo base={(articles[0].cover || articles[0].ogImage) as string} alt="" sizes="(max-width: 1024px) 100vw, 640px" className="aspect-[16/9] w-full object-cover" />
              {(articles[0].datePublished || articles[0].date) && <p className="num mt-4 text-[12.5px] text-muted">{formatDate((articles[0].datePublished || articles[0].date) as string, uk ? 'uk-UA' : 'ru-RU')}</p>}
              <h3 className="mt-2 text-[22px] leading-snug group-hover:text-brand-700">{articles[0].title}</h3>
            </Link>
            <ul className="border-t-[3px] border-ink">
              {articles.slice(1).map((a) => (
                <li key={a.path} className="border-b border-line">
                  <Link href={a.path} className="group grid grid-cols-[96px_minmax(0,1fr)] gap-4 py-4">
                    <Photo base={(a.cover || a.ogImage) as string} alt="" width={96} height={72} sizes="96px" className="aspect-[4/3] w-full object-cover" />
                    <span>
                      {(a.datePublished || a.date) && <span className="num block text-[12px] text-muted">{formatDate((a.datePublished || a.date) as string, uk ? 'uk-UA' : 'ru-RU')}</span>}
                      <span className="mt-1 block text-[16px] font-semibold leading-snug group-hover:text-brand-700">{a.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="container-x pb-4" aria-labelledby="social-h">
        <div className="flex flex-col gap-4 border-y border-line py-6 lg:flex-row lg:items-center lg:justify-between">
          <h2 id="social-h" className="font-sans text-[18px] font-semibold tracking-normal">{t.social}</h2>
          <SocialLinks lang={lang} place="home" />
        </div>
      </section>

      <Faq items={faq} lang={lang} />

      {/* ───────── SEO text of the Tilda home page (indexed content, kept visible) ───────── */}
      {H.seoText?.length ? (
        <section className="border-t border-line bg-white py-16">
          <div className="container-x grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <p className="eyebrow self-start lg:pt-2">{t.seo}</p>
            <div className="max-w-3xl [&_.prose-pw>*:first-child]:mt-0">
              <Blocks blocks={H.seoText} />
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
