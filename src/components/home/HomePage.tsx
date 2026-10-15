import { HoverLink } from '@/components/ui/HoverLink'
import { getActiveVacancies, toCard } from '@/lib/vacancies'
import { ARTICLES, HOME, REVIEWS, isObsolete, type HomeContent } from '@/lib/content'
import { CATALOG_PATH, COUNTRIES } from '@/lib/site'
import { localHref, ruTwin } from '@/lib/alt-routes'
import { localize } from '@/lib/vacancy-i18n'
import { plural } from '@/lib/format'
import { videoCards } from '@/lib/video-reviews'
import { organizationLd, websiteLd, faqLd } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { Photo } from '@/components/ui/Photo'
import { Flag } from '@/components/ui/Flag'
import { IconArrow } from '@/components/ui/icons'
import { Faq, HOME_FAQ, HOME_FAQ_RU, SectionHead } from '@/components/sections/Sections'
import { VacancyCard } from '@/components/vacancy/VacancyCard'
import { QuizButton } from '@/components/lead/LeadModal'
import { Guarantees } from '@/components/trust/Guarantees'
import { PressAwards } from '@/components/trust/PressAwards'
import { CountUp } from '@/components/ui/CountUp'
import { ClientVideos, HomeHero, JobCategories, categoryPhotos } from './HomeVisual'
import { TeamSection } from '@/components/trust/TeamStory'
import { Blocks } from '@/components/content/Blocks'
import { ReadMore } from '@/components/ui/ReadMore'

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
      [String(vac), `${plural(vac, ['відкрита вакансія', 'відкриті вакансії', 'відкритих вакансій'])} прямо зараз`],
      [String(countries), 'країн: Польща, Німеччина, Литва, Чехія…'],
      ['Житло', 'від роботодавця — у багатьох вакансіях'],
      ['5 офісів', 'Київ, Львів, Рівне, Житомир, Одеса'],
    ],
    hot: 'Термінові заїзди',
    hotText: '(актуальні вакансії з виїздом найближчим часом)',
    countries: 'Країни',
    countriesTitle: 'Вибір країни для роботи',
    consultTag: 'Безкоштовна консультація',
    consult: 'Залиште номер — менеджер зателефонує й підбере вакансію під ваш досвід і документи',
    send: 'Замовити дзвінок',
    stepsLabel: 'Як ми працюємо',
    stepsTitle: 'Етапи працевлаштування',
    advLabel: 'Чому Europe Service',
    awards: 'Нагороди',
    press: 'Про нас пишуть',
    employers: 'Роботодавці з якими ми співпрацюємо',
    reviews: 'Відгуки про нас',
    allReviews: 'Усі відгуки',
    video: 'Відео про нас',
    articles: 'Корисні статті',
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
      [String(vac), `${plural(vac, ['открытая вакансия', 'открытые вакансии', 'открытых вакансий'])} прямо сейчас`],
      [String(countries), 'стран: Польша, Германия, Литва, Чехия…'],
      ['Жильё', 'от работодателя — во многих вакансиях'],
      ['5 офисов', 'Киев, Львов, Ровно, Житомир, Одесса'],
    ],
    hot: 'Срочные заезды',
    hotText: '(актуальные вакансии с выездом в ближайшее время)',
    countries: 'Страны',
    countriesTitle: 'Выбор страны для работы',
    consultTag: 'Бесплатная консультация',
    consult: 'Оставьте номер — менеджер позвонит и подберёт вакансию под ваш опыт и документы',
    send: 'Заказать звонок',
    stepsLabel: 'Как мы работаем',
    stepsTitle: 'Этапы трудоустройства',
    advLabel: 'Почему Europe Service',
    awards: 'Награды',
    press: 'О нас пишут',
    employers: 'Работодатели с которыми мы сотрудничаем',
    reviews: 'Отзывы о нас',
    allReviews: 'Все отзывы',
    video: 'Видео о нас',
    articles: 'Полезные статьи',
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
    ['Підбір вакансії', 'Розповімо про умови, житло й договір. Рішення — за вами, ми лише радимо.'],
    ['Оформлення договору', 'Резюме, реєстрація в роботодавця, бронь місця, маршрут і допомога з квитками.'],
    ['Ведемо до роботи', 'Координуємо дорогу до місця, а менеджер лишається на зв’язку.'],
  ],
  ru: [
    ['Оставляете номер', 'Менеджер напишет в Viber, Telegram или позвонит, когда вам удобно.'],
    ['Подбор вакансии', 'Расскажем об условиях, жилье и договоре. Решение — за вами, мы только советуем.'],
    ['Оформление договора', 'Резюме, регистрация у работодателя, бронь места, маршрут и помощь с билетами.'],
    ['Ведём до работы', 'Координируем дорогу до места, а менеджер остаётся на связи.'],
  ],
}

function LogoRow({ title, logos, big, h2 }: { title: string; logos: { src: string; alt?: string; name?: string }[]; big?: boolean; h2?: boolean }) {
  const list = logos.filter((l) => l.src)
  if (!list.length) return null
  return (
    <div className="border-t border-line pt-5">
      {h2 ? <h2 className="accent-bar text-[20px] sm:text-[24px]">{title}</h2> : <p className="eyebrow">{title}</p>}
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
  // the step texts are Tilda's own sentences of the home page («Підбір вакансії» 3, «Оформлення договору» 4), one-to-one
  const tildaSteps = (H.steps?.groups ?? []).flatMap((g) => g.items.map((x) => x.text.trim().replace(/([^.!?])$/, '$1.')))
  const steps: [string, string][] =
    tildaSteps.length === 7
      ? STEPS[lang].map(([title], i) => [title, [[0], [1, 2], [3, 4], [5, 6]][i].map((k) => tildaSteps[k]).join(' ')])
      : (STEPS[lang] as [string, string][])
  const U: HomeContent = HOME.uk ?? {}
  const p = (path: string) => (uk ? path : (ruTwin(path) ?? '/ru'))
  const catalog = uk ? CATALOG_PATH : '/ru' + CATALOG_PATH
  const all = await getActiveVacancies(lang)
  const byNew = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const hot = [...all.filter((v) => v.hot), ...byNew.filter((v) => !v.hot)].slice(0, 6).map((v) => toCard(localize(v, lang)))
  const countries = COUNTRIES.map((c) => ({ ...c, count: all.filter((v) => v.country === c.code).length })).filter((c) => c.count)
  // real photos: workplaces (hot vacancy covers), housing sent by clients, video reviews of clients
  const heroPhotos = categoryPhotos(all)
  const heroList = [heroPhotos.warehouse, heroPhotos.horeca, heroPhotos.construction].filter(Boolean) as string[]
  const videos = videoCards(REVIEWS.filter((r) => r.lang === lang || lang === 'ru'), lang)
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
      </section>

      {/* ───────── OUR OFFICE & TEAM right under the figures (owner 2026-10-15: «фото команди вище») ───────── */}
      <TeamSection lang={lang} compact />

      {/* ───────── GUARANTEES: trust before the offer ───────── */}
      <Guarantees lang={lang} vacancies={all.length} countries={countries.length} />

      {/* ───────── COUNTRIES — compact index (owner, 2026-10: above the job types) ───────── */}
      <section className="container-x py-10 sm:py-14" aria-labelledby="countries-h">
        <SectionHead id="countries-h" title={t.countriesTitle} />
        <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {countries.map((c) => (
            <li key={c.code}>
              <HoverLink href={localHref(c.path, lang)} className="group flex min-h-12 items-center gap-2.5 rounded-xl border border-line bg-white px-2.5 py-1.5 transition hover:border-brand-600">
                <Flag code={c.code} className="h-5 w-[30px]" />
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold leading-tight group-hover:text-brand-700 sm:text-[15px]">{uk ? c.name : c.nameRu}</span>
                <span className="num shrink-0 text-[12.5px] text-muted">{c.count}</span>
              </HoverLink>
            </li>
          ))}
        </ul>
      </section>


      {/* ───────── ANY JOB: job types as photo tiles ───────── */}
      <JobCategories lang={lang} all={all} photos={categoryPhotos(all)} catalog={catalog} />

      {/* ───────── 01 HOT VACANCIES ───────── */}
      <section className="container-x py-10 sm:py-14" aria-labelledby="hot-h">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h2 id="hot-h" className="accent-bar text-[24px] sm:text-[36px]">{t.hot}</h2>
            <h3 className="mt-2 font-sans text-[16.5px] font-normal leading-relaxed tracking-normal text-ink-2">{t.hotText}</h3>
          </div>
          <HoverLink href={catalog} className="btn-ghost">
            {t.all(all.length)} <IconArrow className="size-4" />
          </HoverLink>
        </div>
        <div className="mt-8 overflow-hidden rounded-[18px] border-x border-t border-line bg-white">
          {hot.map((v) => (
            <VacancyCard key={v.id} v={v} lang={lang} />
          ))}
        </div>
      </section>

      {/* ───────── «Відгуки про нас» (Tilda heading): video reviews ───────── */}
      <ClientVideos lang={lang} videos={videos} title={t.reviews} />

      {/* ───────── about us from outside: the 1+1 story and the awards ───────── */}
      <PressAwards lang={lang} />

      {/* ───────── STEPS — compact (owner, 2026-10: «not that important to take so much space») ───────── */}
      <section className="border-y border-line bg-white" aria-labelledby="steps-h">
        <div className="container-x py-10 sm:py-14">
          <SectionHead id="steps-h" title={t.stepsTitle} />
          <ol className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, text], i) => (
              <li key={title} className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-3">
                <span className="num grid size-8 place-items-center rounded-full bg-brand-600 text-[14px] font-semibold text-white">{i + 1}</span>
                <span>
                  <h3 className="font-sans text-[16px] font-semibold leading-snug tracking-normal sm:text-[17px]">{title}</h3>
                  <span className="mt-0.5 block text-[14px] leading-snug text-muted sm:text-[14.5px]">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <QuizButton id="steps" className="btn-accent !px-6">
              {t.pick} <IconArrow className="size-4" />
            </QuizButton>
            <HoverLink href={uk ? '/poslugi' : '/ru/services'} className="text-[15px] font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[4px]">
              {uk ? 'Пакет супроводу від 1 099 грн — що входить →' : 'Пакет сопровождения от 1 099 грн — что входит →'}
            </HoverLink>
          </div>
        </div>
      </section>


      {/* ───────── EMPLOYERS (awards and the 1+1 story moved up, next to the client videos) ───────── */}
      {U.employers && (
        <section className="container-x py-10 sm:py-14" aria-label={t.employers}>
          <LogoRow title={t.employers} logos={U.employers.logos} h2 />
        </section>
      )}

      {/* ───────── ARTICLES — editorial ───────── */}
      {articles.length > 0 && (
        <section className="container-x py-10 sm:py-14" aria-labelledby="art-h">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead id="art-h" title={t.articles} />
            <HoverLink href={p('/news')} className="btn-ghost">
              {t.allArticles} <IconArrow className="size-4" />
            </HoverLink>
          </div>
          <ul className="mt-5 grid gap-x-8 border-t border-line sm:grid-cols-2 lg:grid-cols-3">
            {articles.slice(0, 3).map((a) => (
              <li key={a.path} className="border-b border-line">
                <HoverLink href={a.path} className="group grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 py-3">
                  <Photo base={(a.cover || a.ogImage) as string} alt="" width={96} height={72} sizes="72px" className="aspect-[4/3] w-full rounded-lg object-cover" />
                  <span className="text-[15px] font-semibold leading-snug group-hover:text-brand-700">{a.title}</span>
                </HoverLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Faq items={faq} lang={lang} />

      {/* ───────── SEO text of the Tilda home page (indexed content, kept visible) ───────── */}
      {H.seoText?.length ? (
        <section className="border-t border-line bg-white py-10 sm:py-14">
          <div className="container-x grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <p className="eyebrow self-start lg:pt-2">{t.seo}</p>
            <ReadMore className="max-w-3xl [&_.prose-pw>*:first-child]:mt-0" more={uk ? 'Читати далі' : 'Читать дальше'} less={uk ? 'Згорнути' : 'Свернуть'}>
              <Blocks blocks={H.seoText} />
            </ReadMore>
          </div>
        </section>
      ) : null}
    </>
  )
}
