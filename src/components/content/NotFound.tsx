import Link from 'next/link'
import { COUNTRIES, SITE } from '@/lib/site'
import { localHref } from '@/lib/alt-routes'
import { QuizButton } from '@/components/lead/LeadModal'
import { IconArrow } from '@/components/ui/icons'

/** In-site 404 (inside header/footer): closed vacancy or old link → keep the visitor with the quiz and the catalog */
export function NotFound({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-white">
        <span aria-hidden className="grad-text pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 select-none font-display text-[220px] font-bold leading-none tracking-[-0.06em] opacity-[0.16] lg:block">
          404
        </span>
        <div className="container-x relative py-12 sm:py-16">
          <p className="eyebrow">
            <span className="size-2 bg-leaf" aria-hidden />
            {uk ? 'Помилка 404' : 'Ошибка 404'}
          </p>
          <h1 className="mt-4 max-w-3xl text-[28px] min-[380px]:text-[32px] sm:text-[48px]">{uk ? 'Такої сторінки немає — але вакансії є' : 'Такой страницы нет — но вакансии есть'}</h1>
          <p className="mt-5 max-w-2xl text-[16.5px] leading-relaxed text-ink-2">
            {uk
              ? 'Можливо, набір на вакансію вже закрито або посилання застаріло. Пройдіть підбір за 1 хвилину — запропонуємо актуальні варіанти.'
              : 'Возможно, набор на вакансию уже закрыт или ссылка устарела. Пройдите подбор за 1 минуту — предложим актуальные варианты.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <QuizButton id="not-found" className="btn-accent !px-7">
              {uk ? 'Підібрати вакансію' : 'Подобрать вакансию'} <IconArrow className="size-4" />
            </QuizButton>
            <Link href={uk ? '/vacancies/aktualni_vakansii' : '/ru/vacancies/aktualni_vakansii'} className="btn-ghost !px-7">
              {uk ? 'Усі вакансії' : 'Все вакансии'}
            </Link>
          </div>
          <a href={`tel:${SITE.phone}`} className="num mt-5 inline-flex min-h-11 items-center gap-2 text-[17px] font-semibold text-ink hover:text-brand-700">
            {SITE.phoneDisplay} <span className="font-sans text-[15px] font-normal text-muted">{uk ? '— безкоштовно' : '— бесплатно'}</span>
          </a>
        </div>
        <div className="rule-grad" />
      </section>

      <nav className="container-x py-12 sm:py-14" aria-labelledby="nf-countries">
        <p id="nf-countries" className="eyebrow">
          {uk ? 'Робота за країнами' : 'Работа по странам'}
        </p>
        <ul className="mt-4 grid border-t-[3px] border-ink sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {COUNTRIES.map((c) => (
            <li key={c.code} className="border-b border-line">
              <Link href={localHref(c.path, lang)} className="group flex min-h-14 items-center gap-3 py-2 text-[16px] font-medium hover:text-brand-700">
                <span className="num grid h-7 w-9 shrink-0 place-items-center bg-ink text-[11.5px] font-semibold uppercase text-white">{c.code}</span>
                <span className="flex-1">{uk ? `Робота ${c.inName}` : `Работа ${c.inNameRu}`}</span>
                <span aria-hidden className="text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-700">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
