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

// title and description exactly as on Tilda (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "О нас — официальный сайт работы в Польше",
  absoluteTitle: true,
  description: "Официальная работа в Польше без посредников ✅Только бесплатные вакансии от прямых работодателей ✅Помогаем получить рабочую визу ➦ Обращайтесь!",
  path: '/ru/about',
  lang: 'ru',
})

export default async function Page() {
  const about = await getAbout()
  const active = await getActiveVacancies()
  const facts: AboutFacts = { vacancies: active.length, countries: COUNTRIES.filter((c) => active.some((v) => v.country === c.code)).map((c) => c.code) }
  const faq = aboutFaq('ru', facts)
  return (
    <>
      <JsonLd data={organizationLd('ru')} />
      <PageHero
        title="Об агентстве Europe Service"
        text={`Кадровое агентство ООО «ЕВРОПА СЕРВИС УКРАИНА» с лицензией Минсоцполитики № 223 (2019), в Перечне посредников Минэкономики. Главный офис — в Киеве, ещё четыре — во Львове, Ровно, Житомире и Одессе. Работаем с 2018 года, 65+ рекрутеров.`}
        crumbs={[{ name: 'Главная', path: '/ru' }, { name: 'О нас', path: '/ru/about' }]}
      />
      <AboutStory lang="ru" facts={facts} />
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
