'use client'

import { useState, useTransition } from 'react'
import { CATEGORY, COUNTRY, SITE } from '@/lib/site'
import { salaryMain } from '@/lib/format'
import { FIELD_LABEL, REQUIRED_FIELDS, parseVacancyText, type ParsedField, type ParsedVacancy } from '@/lib/admin/parse-vacancy'
import { addPresetCountry } from './CountryField'
import { Notice, Tag } from './ui'

const SAMPLE = `Пакувальник на склад косметики Nivea

КОРОТКО ПРО ОСНОВНЕ
💵 Заробітна плата 28–30,50 зл/год нетто;
💰 6 160–7 625 zł/міс нетто;
📈 Робота по 10–12 год/день;
🤝 Офіційне працевлаштування за договором Umowa Zlecenie;
🏠 Проживання 500 зл/міс;
📍 м. Познань (Польща).

📜 ОБОВ'ЯЗКИ
◈ пакування продукції;
◈ контроль якості.`

/** «Вставте текст вакансії» → «Розпізнати»: the text box (UA or RU tab) */
export function ParseBox({
  onParsed,
  lang = 'uk',
  compact,
}: {
  onParsed: (p: ParsedVacancy, text: string) => void
  lang?: 'uk' | 'ru'
  compact?: boolean
}) {
  const [text, setText] = useState('')
  const run = () => {
    if (!text.trim()) return
    onParsed(parseVacancyText(text), text)
  }
  return (
    <div className="space-y-3">
      <textarea
        className={`field font-mono !text-[14.5px] leading-relaxed ${compact ? 'min-h-40' : 'min-h-56 sm:min-h-72'}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            run()
          }
        }}
        placeholder={
          lang === 'uk'
            ? `Вставте сюди текст вакансії з Tilda, Telegram чи Viber — як є, з емодзі.\n\nНапр.:\n${SAMPLE}`
            : 'Вставьте сюда русский текст вакансии — как есть, с эмодзи.'
        }
        aria-label={lang === 'uk' ? 'Текст вакансії' : 'Русский текст вакансии'}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-accent" disabled={!text.trim()} onClick={run}>
          Розпізнати
        </button>
        {text && (
          <button type="button" className="btn-ghost" onClick={() => setText('')}>
            Очистити
          </button>
        )}
        <span className="text-[13px] text-muted">
          {lang === 'uk' ? 'Заповнить назву, країну, місто, зарплату, умови й розділи. Усе можна виправити перед збереженням.' : 'Заповнить російські поля: назву, місто, зарплату, умови й розділи.'}
        </span>
      </div>
    </div>
  )
}

type Row = { key: ParsedField; value: string; status: 'ok' | 'guess' | 'missing'; note?: string }

function rowsOf(p: ParsedVacancy): Row[] {
  const v: Record<ParsedField, string> = {
    title: p.title,
    company: p.company,
    country: p.country ? `${COUNTRY[p.country]?.name ?? p.country} (${p.country.toUpperCase()})` : '',
    city: p.city,
    hubCity: p.hubCity,
    category: p.category ? (CATEGORY[p.category]?.name ?? p.category) : '',
    salary: p.salary ? [salaryMain(p.salary), p.salary.unlabelled ? 'нетто/брутто не вказано' : p.salary.net ? 'нетто' : 'брутто', p.salary.text && `«${p.salary.text}»`].filter(Boolean).join(' · ') : '',
    schedule: p.schedule,
    contract: p.contract,
    housing: p.housing,
    housingFree: p.how.housingFree ? (p.housingFree ? 'так' : 'ні') : '',
    intro: p.intro.length > 120 ? `${p.intro.slice(0, 120)}…` : p.intro,
    sections: p.sections.map((s) => `${s.title} (${s.items.length})`).join(', '),
    videos: p.videos.length ? `${p.videos.length} відео` : '',
    reviews: p.reviews.length ? `${p.reviews.length}` : '',
    housingNote: p.housingNote,
    noLanguage: p.noLanguage ? 'так' : '',
    noExperience: p.noExperience ? 'так' : '',
  }
  const order: ParsedField[] = [...REQUIRED_FIELDS, 'company', 'category', 'hubCity', 'housingFree', 'intro', 'videos', 'reviews', 'housingNote', 'noLanguage', 'noExperience']
  return order
    .filter((k) => REQUIRED_FIELDS.includes(k) || v[k])
    .map((k) => ({ key: k, value: v[k], status: v[k] ? (p.how[k]?.status ?? 'ok') : 'missing', note: p.how[k]?.note }))
}

/** What «Розпізнати» filled in, what to check and what it could not place */
export function ParseReport({
  p,
  seo,
  url,
  onClose,
  onToRu,
  onCountryAdded,
}: {
  p: ParsedVacancy
  seo?: { title: string; description: string }
  url?: string
  onClose: () => void
  onToRu?: () => void
  onCountryAdded?: (code: string) => void
}) {
  const rows = rowsOf(p)
  const missing = rows.filter((r) => r.status === 'missing')
  const [busy, start] = useTransition()
  const [countryMsg, setCountryMsg] = useState('')
  return (
    <section className="card border-t-[3px] border-t-brand-600" aria-live="polite">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
        <div>
          <h2 className="eyebrow !font-mono !text-[12.5px] !leading-normal">Розпізнано</h2>
          <p className="mt-1 text-[14px] text-muted">
            <span className="num">{rows.length - missing.length}</span> полів заповнено
            {missing.length > 0 && (
              <>
                , <span className="num font-semibold text-danger">{missing.length}</span> не знайдено — заповніть вручну
              </>
            )}
            . Перевірте позначені «перевірте».
          </p>
        </div>
        <button type="button" className="py-1 text-[14px] font-medium text-brand-700 hover:underline" onClick={onClose}>
          Сховати
        </button>
      </header>
      <div className="space-y-3 p-4 sm:p-5">
        {p.warnings.map((w) => (
          <Notice key={w} tone="warn">{w}</Notice>
        ))}
        {p.lang === 'ru' && onToRu && (
          <button type="button" className="btn-ghost !min-h-10 !text-[14px]" onClick={onToRu}>
            Перенести текст у вкладку «Русский»
          </button>
        )}
        {p.newCountry && !COUNTRY[p.newCountry.code] && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-primary !min-h-10 !text-[14px]"
              disabled={busy}
              onClick={() =>
                start(async () => {
                  const r = await addPresetCountry(p.newCountry!)
                  setCountryMsg(r.ok ? `${p.newCountry!.name} додано — сторінка /vacancies/${p.newCountry!.slug} готова.` : (r.error ?? 'Не вдалося додати'))
                  if (r.ok) onCountryAdded?.(p.newCountry!.code)
                })
              }
            >
              {busy ? 'Додаємо…' : `+ Додати країну «${p.newCountry.name}»`}
            </button>
            {countryMsg && <span className="text-[14px] text-ink-2">{countryMsg}</span>}
          </div>
        )}
        <dl className="divide-y divide-line border border-line">
          {rows.map((r) => (
            <div key={r.key} className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-3 py-2 sm:grid-cols-[170px_minmax(0,1fr)_auto] ${r.status === 'missing' ? 'bg-danger/5' : ''}`}>
              <dt className="text-[13.5px] font-semibold text-ink-2">{FIELD_LABEL[r.key]}</dt>
              <dd className="col-span-2 row-start-2 min-w-0 break-words text-[14px] text-ink sm:col-span-1 sm:col-start-2 sm:row-start-1">
                {r.value || <span className="text-muted">—</span>}
                {r.note && <span className="ml-1 text-[12.5px] text-muted">({r.note})</span>}
              </dd>
              <span className="col-start-2 row-start-1 sm:col-start-3">
                {r.status === 'ok' ? <Tag tone="ok">розпізнано</Tag> : r.status === 'guess' ? <Tag tone="warn">перевірте</Tag> : <Tag tone="err">не знайдено</Tag>}
              </span>
            </div>
          ))}
        </dl>
        {p.leftovers.length > 0 && (
          <div>
            <p className="text-[14px] font-semibold text-ink-2">Не потрапило в жодне поле — додайте вручну, якщо потрібно:</p>
            <ul className="mt-1.5 space-y-1 border-l-[3px] border-sun bg-sun-100/50 px-3 py-2">
              {p.leftovers.map((l, i) => (
                <li key={i} className="font-mono text-[13px] text-ink-2">{l}</li>
              ))}
            </ul>
          </div>
        )}
        {seo && (
          <div className="border border-line bg-surface/60 p-3">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Пропозиція для Google (змінюється в розділі 07)</p>
            {url && <p className="num mt-2 truncate text-[12.5px] text-ink-2">{SITE.url.replace(/^https?:\/\//, '')}{url}</p>}
            <p className="mt-0.5 text-[17px] leading-snug text-[#1a0dab]">{seo.title || '—'}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{seo.description || '—'}</p>
          </div>
        )}
      </div>
    </section>
  )
}
