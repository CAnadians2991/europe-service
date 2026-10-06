import Link from 'next/link'
import { COUNTRIES } from '@/lib/site'
import { localHref } from '@/lib/alt-routes'
import { QuizButton } from '@/components/lead/LeadModal'

/** In-site 404 (inside header/footer): closed vacancy or old link → keep the visitor with the quiz and the catalog */
export function NotFound({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <section className="container-x py-14 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-600">{uk ? 'Помилка 404' : 'Ошибка 404'}</p>
      <h1 className="mt-2 max-w-2xl text-[28px] leading-tight sm:text-[40px]">{uk ? 'Такої сторінки немає — але вакансії є' : 'Такой страницы нет — но вакансии есть'}</h1>
      <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink-2">
        {uk
          ? 'Можливо, набір на вакансію вже закрито або посилання застаріло. Пройдіть підбір за 1 хвилину — запропонуємо актуальні варіанти.'
          : 'Возможно, набор на вакансию уже закрыт или ссылка устарела. Пройдите подбор за 1 минуту — предложим актуальные варианты.'}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <QuizButton id="not-found" className="btn-accent !px-7 !py-4 !text-base">
          {uk ? 'Підібрати вакансію' : 'Подобрать вакансию'}
        </QuizButton>
        <Link href={uk ? '/vacancies/all' : '/ru/vacancies/all'} className="btn-ghost !px-7 !py-4 !text-base">
          {uk ? 'Усі вакансії' : 'Все вакансии'}
        </Link>
      </div>
      <ul className="mt-10 flex flex-wrap gap-2">
        {COUNTRIES.map((c) => (
          <li key={c.code}>
            <Link href={localHref(c.path, lang)} className="chip">
              <span aria-hidden>{c.flag}</span> {uk ? `Робота ${c.inName}` : `Работа ${c.inNameRu}`}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
