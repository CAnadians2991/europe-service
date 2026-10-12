import type { Metadata } from 'next'
import { getAbout } from '@/lib/about'
import { pageMeta, organizationLd } from '@/lib/seo'
import { JsonLd, TildaLd } from '@/components/seo/JsonLd'
import { PageHero } from '@/components/content/PageHero'
import { OfficeTeam } from '@/components/trust/OfficeTeam'
import { TeamGallery } from '@/components/trust/TeamStory'
import { AwardsList } from '@/components/trust/PressAwards'
import { LicenseSection } from '@/components/trust/LicenseSection'
import { AboutPrinciples, AboutStory, aboutFaq, type AboutFacts } from '@/components/content/AboutStory'
import { Faq } from '@/components/sections/Sections'
import { faqLd } from '@/lib/seo'
import { getActiveVacancies } from '@/lib/vacancies'
import { COUNTRIES } from '@/lib/site'
import { YouTube } from '@/components/content/YouTube'
import { TildaText } from '@/components/content/TildaText'
import { PAGES } from '@/lib/content'

// title and description exactly as on Tilda (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "Про нас - офіційний сайт Europe Service",
  absoluteTitle: true,
  description: "Офіційна робота у Польщі без посередників. Тільки безкоштовні вакансії від прямих роботодавців. Допомогаємо отримати робочу візу. Звертайтеся!",
  path: '/about',
})

export default async function Page() {
  const about = await getAbout()
  const active = await getActiveVacancies('uk')
  const facts: AboutFacts = { vacancies: active.length, countries: COUNTRIES.filter((c) => active.some((v) => v.country === c.code)).map((c) => c.code) }
  const faq = aboutFaq('uk', facts)
  return (
    <>
      <JsonLd data={organizationLd()} />
      <TildaLd path="/about" />
      {/* Tilda's H1 of /about stays the <h1>; our headline is the big line */}
      <PageHero
        title="В спектр наших послуг входить"
        lead="Про агентство Europe Service"
        text={`Кадрове агентство ТОВ «ЄВРОПА СЕРВІС УКРАЇНА» з ліцензією Мінсоцполітики № 223 (2019), у Переліку посередників Мінекономіки. Головний офіс — у Києві, ще чотири — у Львові, Рівному, Житомирі та Одесі. Працюємо з 2018 року, 65+ рекрутерів.`}
        crumbs={[{ name: 'Головна', path: '/' }, { name: 'Про нас', path: '/about' }]}
      />
      <AboutStory lang="uk" facts={facts} />
      {/* the text of Tilda's /about (services, documents, «Простота процедури працевлаштування»…) with its headings */}
      <TildaText label="Що ми робимо" blocks={PAGES.about?.blocks ?? []} skip="В спектр наших послуг входить" />
      <TeamGallery lang="uk" />
      <AwardsList lang="uk" />
      <OfficeTeam about={about} heading="Наші офіси і команда" />
      {about.video && (
        <section className="container-x grid gap-6 py-14 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8" aria-label="Офіс на відео">
          <p className="eyebrow self-start lg:pt-1">Офіс на відео</p>
          <div className="max-w-3xl [&>div]:!my-0">
            <YouTube id={about.video} title="Офіс Europe Service" />
          </div>
        </section>
      )}
      <LicenseSection about={about} />
      <AboutPrinciples lang="uk" />
      <JsonLd data={faqLd(faq)} />
      <Faq items={faq} title="Запитання про агентство" />
    </>
  )
}
