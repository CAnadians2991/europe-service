import type { Metadata } from 'next'
import { getAbout } from '@/lib/about'
import { pageMeta, organizationLd } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { PageHero } from '@/components/content/PageHero'
import { OfficeTeam } from '@/components/trust/OfficeTeam'
import { LicenseSection } from '@/components/trust/LicenseSection'
import { ClassicCta } from '@/components/home/ClassicBlocks'
import { AboutPrinciples, AboutStory, aboutFaq, type AboutFacts } from '@/components/content/AboutStory'
import { Faq } from '@/components/sections/Sections'
import { faqLd } from '@/lib/seo'
import { getActiveVacancies } from '@/lib/vacancies'
import { COUNTRIES } from '@/lib/site'
import { YouTube } from '@/components/content/YouTube'

export const metadata: Metadata = pageMeta({
  title: 'О нас — официальный сайт Europe Service',
  absoluteTitle: true,
  description: 'Кадровое агентство Europe Service: лицензия Минсоцполитики № 223 от 15.02.2019, главный офис в Киеве и офисы во Львове, Ровно, Житомире, Одессе. Официальная работа в Европе.',
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
        text={`Кадровое агентство ООО «ЕВРОПА СЕРВИС УКРАИНА» с лицензией Минсоцполитики № 223 (2019). Главный офис — в Киеве, ещё четыре — во Львове, Ровно, Житомире и Одессе. Более ${SITE.clients.replace('+', '')} клиентов за время работы.`}
        crumbs={[{ name: 'Главная', path: '/ru' }, { name: 'О нас', path: '/ru/about' }]}
      />
      <AboutStory lang="ru" facts={facts} />
      <OfficeTeam about={about} heading="Наш офис и команда" lang="ru" />
      {about.video && (
        <section className="container-x pb-6">
          <div className="mx-auto max-w-3xl">
            <YouTube id={about.video} title="Офис Europe Service" lang="ru" />
          </div>
        </section>
      )}
      <LicenseSection about={about} lang="ru" />
      <AboutPrinciples lang="ru" />
      <JsonLd data={faqLd(faq)} />
      <Faq items={faq} title="Вопросы об агентстве" lang="ru" />
      <ClassicCta lang="ru" />
    </>
  )
}
