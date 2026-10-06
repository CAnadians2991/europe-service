import { QuizButton } from './LeadModal'
import { SITE } from '@/lib/site'

/**
 * «Не впевнені, що підійдете?» — nobody should leave thinking a vacancy isn't for them:
 * the managers pick a vacancy for any request, including ones not listed on the site.
 */
export const ANY_REQUEST = {
  uk: {
    eyebrow: 'Підбір під ваш запит',
    title: 'Не впевнені, що підійдете?',
    text: 'Підберемо вакансію саме під вас — з урахуванням досвіду, документів і побажань щодо країни та роботи. На сайті лише частина пропозицій: якщо потрібної тут немає, знайдемо її під ваш запит.',
    short: 'Не впевнені, що підходите? Все одно залиште заявку — менеджер підбере вакансію саме під вас.',
    cta: 'Підібрати вакансію під мене',
    call: 'або зателефонуйте',
    free: 'Безкоштовно · без реєстрації',
  },
  ru: {
    eyebrow: 'Подбор под ваш запрос',
    title: 'Не уверены, что подойдёте?',
    text: 'Подберём вакансию именно под вас — с учётом опыта, документов и пожеланий по стране и работе. На сайте только часть предложений: если нужной здесь нет, найдём её под ваш запрос.',
    short: 'Не уверены, что подходите? Всё равно оставьте заявку — менеджер подберёт вакансию именно под вас.',
    cta: 'Подобрать вакансию под меня',
    call: 'или позвоните',
    free: 'Бесплатно · без регистрации',
  },
}

export function AnyRequest({ lang = 'uk', id, preset, className = '' }: { lang?: 'uk' | 'ru'; id: string; preset?: Record<string, string>; className?: string }) {
  const t = ANY_REQUEST[lang]
  return (
    <section data-cta className={`rounded-[24px] bg-brand-100 p-5 sm:p-7 ${className}`} aria-label={t.title}>
      <p className="eyebrow">{t.eyebrow}</p>
      <p className="mt-2 font-display text-[21px] font-bold leading-tight sm:text-[24px]">{t.title}</p>
      <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-ink-2">{t.text}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <QuizButton id={id} preset={preset} className="btn-accent !px-6 !py-3.5">
          {t.cta}
        </QuizButton>
        <span className="text-sm text-ink-2">
          {t.call}{' '}
          <a href={`tel:${SITE.phone}`} className="whitespace-nowrap font-semibold text-brand-800 underline underline-offset-2">
            {SITE.phoneDisplay}
          </a>
        </span>
      </div>
    </section>
  )
}
