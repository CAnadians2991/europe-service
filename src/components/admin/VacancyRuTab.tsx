'use client'

import { COUNTRY } from '@/lib/site'
import { vacancyDescription, vacancyTitle } from '@/lib/seo'
import { ruFromUk, ukrainianLeft } from '@/lib/admin/ru-copy'
import type { ParsedVacancy } from '@/lib/admin/parse-vacancy'
import type { Vacancy, VacancyRu } from '@/lib/types'
import { ParseBox } from './ParseBox'
import { SectionsEditor } from './SectionsEditor'
import { Field, Notice, Panel } from './ui'
import { SeoField } from './SeoFields'

const SECTIONS_RU = ['Заработная плата', 'График работы', 'Обязанности', 'Проживание', 'Требования', 'Дополнительные условия', 'Место работы']

/**
 * The «Русский» tab: the texts of /ru/… (data.ru). Empty title = no translation: the Russian page shows the Ukrainian
 * text and is not indexed. Not updated automatically when the Ukrainian text changes.
 */
export function RuTab({ v, onChange, onParsedRu }: { v: Vacancy; onChange: (ru: VacancyRu | undefined) => void; onParsedRu: (p: ParsedVacancy) => void }) {
  const ru = v.ru
  const setRu = (patch: Partial<VacancyRu>) => onChange({ title: '', ...ru, ...patch })
  const filled = Boolean(ru && (ru.title || ru.intro || ru.sections?.length))
  const left = ukrainianLeft(ru)
  const c = COUNTRY[v.country]
  // what Google gets on the Russian page while the SEO fields stay empty
  const base: Vacancy = {
    ...v,
    title: ru?.title || v.title,
    city: ru?.city ?? v.city,
    housing: ru?.housing ?? v.housing,
    contract: ru?.contract ?? v.contract,
    seoTitle: '',
    seoDescription: '',
  }
  const autoTitle = ru?.title && c ? vacancyTitle(base, 'ru') : ''
  const autoDescription = ru?.title && c ? vacancyDescription(base, 'ru') : ''

  return (
    <div className="min-w-0 space-y-5">
      <Panel
        n="RU"
        title="Російська версія"
        hint={ru?.title ? 'Переклад є — сторінка /ru/… показує ці тексти й індексується.' : 'Перекладу немає — російська сторінка показує український текст і не індексується Google.'}
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (filled && !confirm('Російські поля вже заповнені. Замінити їх українським текстом?')) return
              onChange(ruFromUk(v, ru))
            }}
          >
            Скопіювати з української
          </button>
          {ru && (
            <button type="button" className="btn-ghost text-danger" onClick={() => confirm('Прибрати російський переклад?') && onChange(undefined)}>
              Прибрати переклад
            </button>
          )}
        </div>
        <p className="text-[13.5px] text-muted">«Скопіювати» переносить український текст у ці поля й перекладає назви розділів та одиниці (год → ч, міс → мес). Решту перекладіть перед збереженням.</p>
        {left.length > 0 && <Notice tone="warn">Українські літери (і, ї, є, ґ) у полях: {left.join(', ')}. Схоже, ці поля ще не перекладені.</Notice>}
        <Notice tone="info">Російський текст не оновлюється сам. Змінили ставку, графік чи житло українською — виправте й тут.</Notice>
      </Panel>

      <details className="card group">
        <summary className="cursor-pointer list-none px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="eyebrow">Вставити російський текст</span>
          <span className="ml-2 text-[14px] text-muted group-open:hidden">є готовий текст російською — розпізнати його</span>
        </summary>
        <div className="border-t border-line p-4 sm:p-5">
          <ParseBox lang="ru" compact onParsed={(p) => onParsedRu(p)} />
        </div>
      </details>

      <Panel n="01" title="Тексти">
        <Field label="Назва російською *" hint="Без неї переклад не показується">
          <input className="field" value={ru?.title ?? ''} onChange={(e) => setRu({ title: e.target.value })} placeholder={v.title} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Город"><input className="field" value={ru?.city ?? ''} onChange={(e) => setRu({ city: e.target.value })} placeholder={v.city} /></Field>
          <Field label="Зарплата (текст)"><input className="field" value={ru?.salaryText ?? ''} onChange={(e) => setRu({ salaryText: e.target.value })} placeholder={v.salary.text} /></Field>
          <Field label="График"><input className="field" value={ru?.schedule ?? ''} onChange={(e) => setRu({ schedule: e.target.value })} placeholder={v.schedule} /></Field>
          <Field label="Договор"><input className="field" value={ru?.contract ?? ''} onChange={(e) => setRu({ contract: e.target.value })} placeholder={v.contract} /></Field>
          <Field label="Проживание"><input className="field" value={ru?.housing ?? ''} onChange={(e) => setRu({ housing: e.target.value })} placeholder={v.housing} /></Field>
          <Field label="Подзаголовок"><input className="field" value={ru?.headline ?? ''} onChange={(e) => setRu({ headline: e.target.value })} placeholder={v.headline} /></Field>
        </div>
        <Field label="Вступление"><textarea className="field min-h-20 [field-sizing:content]" value={ru?.intro ?? ''} onChange={(e) => setRu({ intro: e.target.value })} placeholder={v.intro} /></Field>
        <Field label="Подпись под фото жилья"><input className="field" value={ru?.housingNote ?? ''} onChange={(e) => setRu({ housingNote: e.target.value })} placeholder={v.housingNote} /></Field>
      </Panel>

      <Panel n="02" title="Разделы описания" hint="Пустые разделы на сайте не показываются. Без разделов RU-страница берёт украинские.">
        <SectionsEditor value={ru?.sections ?? []} onChange={(x) => setRu({ sections: x })} templates={SECTIONS_RU} placeholder={'Каждый пункт с новой строки\nНапр.: Упаковка продукции'} />
      </Panel>

      <Panel n="03" title="SEO русской страницы">
        <SeoField label="SEO-заголовок (title)" max={60} value={ru?.seoTitle ?? ''} auto={autoTitle} onChange={(x) => setRu({ seoTitle: x })} />
        <SeoField label="SEO-описание (description)" max={158} value={ru?.seoDescription ?? ''} auto={autoDescription} onChange={(x) => setRu({ seoDescription: x })} multiline />
      </Panel>
    </div>
  )
}
