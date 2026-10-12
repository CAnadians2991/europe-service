import type { Metadata } from 'next'
import { getAbout } from '@/lib/about'
import { pageMeta, organizationLd } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
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

// title and description exactly as on Tilda (the page ranks with them) — Tilda's /ru/about had them in Ukrainian
export const metadata: Metadata = pageMeta({
  title: "Про нас - офіційний сайт роботи в Польщі",
  absoluteTitle: true,
  description: "Офіційна робота у Польщі без посередників ✅Тільки безкоштовні вакансії від прямих роботодавців ✅Допомогаємо отримати робочу візу ➦ Звертайтеся!",
  path: '/ru/about',
  lang: 'ru',
})

export default async function Page() {
  const about = await getAbout()
  const active = await getActiveVacancies('ru')
  const facts: AboutFacts = { vacancies: active.length, countries: COUNTRIES.filter((c) => active.some((v) => v.country === c.code)).map((c) => c.code) }
  const faq = aboutFaq('ru', facts)
  return (
    <>
      <JsonLd data={organizationLd('ru')} />
      {/* the same pattern as /about: the heading of Tilda's text is the <h1>, our headline the big line */}
      <PageHero
        title="В спектр наших услуг входит"
        lead="Об агентстве Europe Service"
        text={`Кадровое агентство ООО «ЕВРОПА СЕРВИС УКРАИНА» с лицензией Минсоцполитики № 223 (2019), в Перечне посредников Минэкономики. Главный офис — в Киеве, ещё четыре — во Львове, Ровно, Житомире и Одессе. Работаем с 2018 года, 65+ рекрутеров.`}
        crumbs={[{ name: 'Главная', path: '/ru' }, { name: 'О нас', path: '/ru/about' }]}
      />
      <AboutStory lang="ru" facts={facts} />
      {/* the text of Tilda's /ru/about («Простая процедура трудоустройства»…) with its headings */}
      <TildaText label="Что мы делаем" blocks={PAGES.about_ru?.blocks ?? []} skip="В спектр наших услуг входит" />
      <TeamGallery lang="ru" />
      <AwardsList lang="ru" />
      <OfficeTeam about={about} heading="Наш офис и команда" lang="ru" />
      {about.video && (
        <section className="container-x grid gap-6 py-14 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8" aria-label="Офис на видео">
          <p className="eyebrow self-start lg:pt-1">Офис на видео</p>
          <div className="max-w-3xl [&>div]:!my-0">
            <YouTube id={about.video} title="Офис Europe Service" lang="ru" />
          </div>
        </section>
      )}
      <LicenseSection about={about} lang="ru" />
      <AboutPrinciples lang="ru" />
      <JsonLd data={faqLd(faq)} />
      <Faq items={faq} title="Вопросы об агентстве" lang="ru" />
    </>
  )
}
