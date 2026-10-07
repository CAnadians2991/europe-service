import Link from 'next/link'
import { getActiveVacancies, toCard } from '@/lib/vacancies'
import { getAbout } from '@/lib/about'
import { ARTICLES, HOME, REVIEWS, isObsolete, type HomeContent } from '@/lib/content'
import { CATALOG_PATH, COUNTRIES, COUNTRY, SITE } from '@/lib/site'
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
import { ChatButtons } from '@/components/lead/ChatButtons'
import { LicenseSection } from '@/components/trust/LicenseSection'
import { Guarantees } from '@/components/trust/Guarantees'
import { Suitcase3D } from './Suitcase3D'
import { VacancyTicker } from './VacancyTicker'
import { Reveal } from '@/components/ui/Reveal'
import { CountUp } from '@/components/ui/CountUp'
import { ClientVideos, HomeHero, HousingStrip, JobCategories, categoryPhotos } from './HomeVisual'
import { OfficeTeam } from '@/components/trust/OfficeTeam'
import { SocialLinks } from '@/components/layout/SocialLinks'
import { Blocks } from '@/components/content/Blocks'
import { YouTube } from '@/components/content/YouTube'

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
    facts: [
      ['80 000+', 'клієнтів за 7 років роботи'],
      ['5', 'офісів: Київ, Львів, Рівне, Житомир, Одеса'],
      ['№ 223', 'ліцензія Мінсоцполітики з 2019 року'],
      ['24/7', 'підтримка клієнтів у Viber і Telegram'],
    ],
    hot: 'Термінові заїзди',
    hotText: 'Вакансії з виїздом найближчим часом — житло, офіційний договір, супровід.',
    countries: 'Країни',
    countriesTitle: 'Де працюють наші клієнти',
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
    facts: [
      ['80 000+', 'клиентов за 7 лет работы'],
      ['5', 'офисов: Киев, Львов, Ровно, Житомир, Одесса'],
      ['№ 223', 'лицензия Минсоцполитики с 2019 года'],
      ['24/7', 'поддержка клиентов в Viber и Telegram'],
    ],
    hot: 'Срочные заезды',
    hotText: 'Вакансии с выездом в ближайшее время — жильё, официальный договор, сопровождение.',
    countries: 'Страны',
    countriesTitle: 'Где работают наши клиенты',
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
    ['Заявка', 'Залишаєте номер або проходите підбір — менеджер телефонує й уточнює досвід, документи й побажання.'],
    ['Підбір і документи', 'Пропонуємо вакансії, реєструємо вас у роботодавця, бронюємо місце й допомагаємо з документами.'],
    ['Маршрут', 'Перед виїздом надсилаємо маршрутний лист: адреса, контакти координатора, як доїхати.'],
    ['Робота', 'На місці зустрічає координатор роботодавця, а ваш менеджер лишається на зв’язку.'],
  ],
  ru: [
    ['Заявка', 'Оставляете номер или проходите подбор — менеджер звонит и уточняет опыт, документы и пожелания.'],
    ['Подбор и документы', 'Предлагаем вакансии, регистрируем вас у работодателя, бронируем место и помогаем с документами.'],
    ['Маршрут', 'Перед выездом отправляем маршрутный лист: адрес, контакты координатора, как добраться.'],
    ['Работа', 'На месте встречает координатор работодателя, а ваш менеджер остаётся на связи.'],
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

/** One phrase of the heading in the corporate gradient (no-op when the phrase is not there) */
function Accent({ text, word }: { text: string; word: string }) {
  const i = text.indexOf(word)
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <span className="grad-text">{word}</span>
      {text.slice(i + word.length)}
    </>
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
  const advantages = H.advantages ?? U.advantages
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
      <HomeHero lang={lang} total={all.length} photos={heroList} />

      <section className="border-b border-line bg-white" aria-label={uk ? 'Europe Service у цифрах' : 'Europe Service в цифрах'}>
        {/* facts strip */}
        <div className="border-t border-line">
          <dl className="container-x grid grid-cols-2 lg:grid-cols-4">
            {t.facts.map(([v, l], i) => (
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

      {/* ───────── ANY JOB: job types as photo tiles ───────── */}
      <JobCategories lang={lang} all={all} photos={categoryPhotos(all)} catalog={catalog} />

      {/* ───────── 01 HOT VACANCIES ───────── */}
      <section className="container-x py-16 sm:py-20" aria-labelledby="hot-h">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead id="hot-h" index={1} eyebrow={uk ? 'Вакансії' : 'Вакансии'} title={t.hot} text={t.hotText} />
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

      {/* ───────── 02 STEPS — how it goes ───────── */}
      <section className="border-y border-line bg-white" aria-labelledby="steps-h">
        <div className="container-x py-14 sm:py-20">
        <SectionHead id="steps-h" index={2} eyebrow={t.stepsLabel} title={t.stepsTitle} />
        <Reveal>
        <ol className="mt-12 grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
          {STEPS[lang].map(([title, text], i, all) => (
            <li key={title} data-reveal style={{ ['--i' as string]: i }}>
              <span className="block bg-line">
                <span className="stage-bar" style={{ opacity: 0.4 + (0.6 * (i + 1)) / all.length }} />
              </span>
              <p className="mt-4 flex items-baseline justify-between font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                <span>{uk ? 'Етап' : 'Этап'}</span>
                <span className="num text-ink">
                  {String(i + 1).padStart(2, '0')}
                  <span className="text-muted">/{String(all.length).padStart(2, '0')}</span>
                </span>
              </p>
              <h3 className="mt-3 text-[20px]">{title}</h3>
              <p className="mt-2 max-w-[320px] text-[15.5px] leading-relaxed text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
        </Reveal>
        <div className="mt-10">
          <QuizButton id="steps" className="btn-accent !px-7">
            {t.pick} <IconArrow className="size-4" />
          </QuizButton>
        </div>
        </div>
      </section>

      <HousingStrip lang={lang} photos={housing} />
      <ClientVideos lang={lang} videos={videos} />

      {/* ───────── 03 COUNTRIES — an index ───────── */}
      <section className="border-y border-line bg-white" aria-labelledby="countries-h">
        <div className="container-x py-16 sm:py-20">
          <SectionHead id="countries-h" index={3} eyebrow={t.countries} title={t.countriesTitle} />
          <Reveal>
          <ul className="mt-8 grid border-t-[3px] border-ink sm:grid-cols-2 sm:gap-x-10">
            {countries.map((c, i) => (
              <li key={c.code} className="border-b border-line" data-reveal="left" style={{ ['--i' as string]: i % 6 }}>
                <Link href={localHref(c.path, lang)} className="group flex min-h-[76px] items-center gap-4 py-3">
                  {countryImage[c.code] ? (
                    <Photo base={countryImage[c.code]} alt="" width={96} height={64} sizes="96px" className="h-14 w-20 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="brand-band grid h-14 w-20 shrink-0 place-items-center rounded-xl font-mono text-[13px] font-semibold uppercase text-white">{c.code}</span>
                  )}
                  <span className="flex-1 font-display text-[19px] font-semibold tracking-[-0.01em] group-hover:text-brand-700 sm:text-[21px]">{uk ? c.name : c.nameRu}</span>
                  <span className="num text-[14px] text-muted">
                    {c.count} <span className="hidden min-[420px]:inline">{plural(c.count, uk ? ['вакансія', 'вакансії', 'вакансій'] : ['вакансия', 'вакансии', 'вакансий'])}</span>
                  </span>
                  <span aria-hidden className="text-[18px] text-muted transition group-hover:translate-x-1 group-hover:text-brand-700">→</span>
                </Link>
              </li>
            ))}
          </ul>
          </Reveal>
          {uk && (U.cities?.items.length || U.audiences?.items.length) ? (
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {U.cities?.items.length ? (
                <div>
                  <p className="eyebrow">{t.cities}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {U.cities.items.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="chip">
                          {c.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {U.audiences?.items.length ? (
                <div>
                  <p className="eyebrow">{t.directions}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {U.audiences.items.map((a) => (
                      <li key={a.title}>
                        <Link href={a.href} className="chip">
                          {a.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

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


      {/* ───────── 04 ADVANTAGES — a spec sheet ───────── */}
      {advantages && (
        <section className="border-t border-line bg-white" aria-labelledby="adv-h">
          <div className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <SectionHead id="adv-h" index={4} eyebrow={t.advLabel} title={advantages.title} />
            <dl className="border-t-[3px] border-ink">
              {advantages.items.map((a) => (
                <div key={a.title} className="grid gap-1 border-b border-line py-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] sm:gap-6">
                  <dt className="text-[17px] font-semibold">{a.title}</dt>
                  <dd className="text-[15.5px] leading-relaxed text-ink-2">{a.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ───────── 05 OFFICES & TEAM, 06 DOCUMENTS ───────── */}
      <OfficeTeam about={about} lang={lang} />
      <LicenseSection about={about} lang={lang} compact />

      {/* ───────── AWARDS · PRESS · EMPLOYERS ───────── */}
      <section className="container-x space-y-8 py-16 sm:py-20" aria-label={`${t.awards}, ${t.press}`}>
        <div className="grid gap-8 lg:grid-cols-2">
          {U.awards && <LogoRow title={t.awards} logos={U.awards.images} big />}
          {U.video?.youtube && (
            <div className="border-t border-line pt-5">
              <p className="eyebrow">{t.video}</p>
              <div className="mt-4 [&>div]:!my-0 [&>div]:!rounded-none">
                <YouTube id={U.video.youtube} title={t.video} />
              </div>
            </div>
          )}
        </div>
        {U.press && <LogoRow title={t.press} logos={U.press.logos} />}
        {U.employers && <LogoRow title={t.employers} logos={U.employers.logos} />}
      </section>

      {/* ───────── REVIEWS ───────── */}
      {reviews.length > 0 && (
        <section className="border-t border-line bg-white" aria-labelledby="rev-h">
          <div className="container-x py-16 sm:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHead id="rev-h" eyebrow={t.reviews} title={t.reviews} />
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

      {/* ───────── ARTICLES — editorial ───────── */}
      {articles.length > 0 && (
        <section className="container-x py-16 sm:py-20" aria-labelledby="art-h">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead id="art-h" eyebrow={t.articles} title={t.articles} />
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
