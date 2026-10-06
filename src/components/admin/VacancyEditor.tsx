'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { CATEGORIES, COUNTRY, SITE } from '@/lib/site'
import { CURRENCY_SIGN, salaryHour, salaryMonth, slugify } from '@/lib/format'
import { vacancyDescription, vacancyTitle } from '@/lib/seo'
import { restoreVersion, saveVacancy } from '@/app/(admin)/admin/actions'
import { Photos } from './PhotoUploader'
import { CountryField } from './CountryField'
import type { Category, Currency, Vacancy, VacancyRu } from '@/lib/types'

import { SECTION_TEMPLATES } from '@/lib/vacancy-template'
import { belowMinimum } from '@/lib/salary-check'

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

/** Google search result as the vacancy will appear there */
function SeoPreview({ url, title, description, custom }: { url: string; title: string; description: string; custom: boolean }) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
      <p className="text-xs font-semibold text-muted">Так вакансія виглядатиме в Google {custom ? '(ваш текст)' : '(сформовано автоматично)'}</p>
      <p className="mt-2 truncate text-[13px] text-ink-2">{url}</p>
      {/* same rule as pageMeta: short titles get the «| Europe Service» tail */}
      <p className="mt-0.5 text-lg leading-snug text-[#1a0dab]">{title ? (title.includes('Europe Service') || title.length > 44 ? title : `${title} | Europe Service`) : 'Назва вакансії'}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-2">{description || 'Опис з’явиться, коли заповните назву, зарплату й умови.'}</p>
    </div>
  )
}

/** Empty = automatic (and it keeps updating when the salary or housing change); typing overrides it */
function SeoField({ label, max, value, auto, onChange, multiline }: { label: string; max: number; value: string; auto: string; onChange: (v: string) => void; multiline?: boolean }) {
  const len = (value.trim() || auto).length
  const Input = multiline ? 'textarea' : 'input'
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="label">{label}</span>
        <span className={`text-xs ${len > max ? 'font-semibold text-danger' : 'text-muted'}`}>{len} / {max} символів</span>
      </div>
      <Input className={`field ${multiline ? 'min-h-24' : ''}`} value={value} placeholder={auto} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)} />
      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
        {value.trim() ? (
          <>
            <span>Ваш текст. Автоматичний більше не підставляється.</span>
            <button type="button" className="py-1 font-semibold text-brand-700 hover:underline" onClick={() => onChange('')}>Повернути автоматичний</button>
          </>
        ) : (
          <>
            <span>Порожньо — сайт сам підставить текст, сірий у полі, і оновлюватиме його разом зі зміною зарплати й умов.</span>
            {auto && <button type="button" className="py-1 font-semibold text-brand-700 hover:underline" onClick={() => onChange(auto)}>Змінити вручну</button>}
          </>
        )}
      </div>
    </div>
  )
}

const savedText = (active: boolean) =>
  active ? 'Збережено! Зміни вже на сайті.' : 'Збережено. Вакансія прихована — на сайті її не видно, доки не ввімкнете «Показувати на сайті».'

/** Same parsing as the server (saveVacancy): «4 700», «25,5» */
const num = (x: unknown) => {
  const n = Number(String(x ?? '').replace(',', '.').replace(/\s/g, ''))
  return x === null || x === '' || !Number.isFinite(n) ? null : n
}

export function VacancyEditor({ initial, isNew, saved, history = [] }: { initial: Vacancy; isNew: boolean; saved?: boolean; history?: { id: number; action: string; created_at: string; version_at: string | null }[] }) {
  const router = useRouter()
  const [v, setV] = useState<Vacancy>(initial)
  const [savedPath, setSavedPath] = useState(initial.path)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(saved ? { ok: true, text: savedText(initial.active) } : null)
  const [saving, start] = useTransition()
  const leaving = useRef(false)

  useEffect(() => {
    if (saved) window.history.replaceState(null, '', window.location.pathname)
  }, [saved])

  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => {
      if (!leaving.current) e.preventDefault()
    }
    // in-app links (← До списку, the admin menu) don't fire beforeunload — ask before leaving
    const click = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      if (!confirm('Є незбережені зміни. Піти зі сторінки без збереження?')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', h)
    document.addEventListener('click', click, true)
    return () => {
      window.removeEventListener('beforeunload', h)
      document.removeEventListener('click', click, true)
    }
  }, [dirty])

  const set = <K extends keyof Vacancy>(k: K, val: Vacancy[K]) => {
    setV((p) => ({ ...p, [k]: val }))
    setDirty(true)
    setMsg(null)
  }
  const setSal = (k: keyof Vacancy['salary'], val: unknown) => {
    setV((p) => ({ ...p, salary: { ...p.salary, [k]: val } }))
    setDirty(true)
    setMsg(null)
  }
  /** нетто / брутто chosen by a manager — the «not stated by the source» flag no longer applies */
  const setNet = (net: boolean) => {
    setV((p) => ({ ...p, salary: { ...p.salary, net, unlabelled: undefined } }))
    setDirty(true)
    setMsg(null)
  }
  const folder = v.id || slugify(v.title || 'new').slice(0, 30) || 'new'

  const save = () =>
    start(async () => {
      setMsg(null)
      const r = await saveVacancy(v, isNew)
      if (!r.ok) {
        setMsg({ ok: false, text: r.error })
        return
      }
      setDirty(false)
      setMsg({ ok: true, text: savedText(v.active) })
      if (isNew) router.replace(`/admin/vacancies/${r.id}?saved=1`)
      else {
        setV((p) => ({ ...p, path: r.path }))
        setSavedPath(r.path)
        router.refresh()
      }
    })

  const autoPath = `${v.country === 'gr' ? '/vacancies/greece' : COUNTRY[v.country].path}/${slugify(v.company || v.title || 'vakansiia')}`
  // the same functions the vacancy page uses — so the admin sees exactly what Google gets while the fields stay empty
  const seoBase = {
    ...v,
    seoTitle: '',
    seoDescription: '',
    salary: { ...v.salary, hourMin: num(v.salary.hourMin), hourMax: num(v.salary.hourMax) ?? num(v.salary.hourMin), monthMin: num(v.salary.monthMin), monthMax: num(v.salary.monthMax) ?? num(v.salary.monthMin) },
  }
  const autoTitle = v.title.trim() ? vacancyTitle(seoBase) : ''
  const autoDescription = v.title.trim() ? vacancyDescription(seoBase) : ''

  return (
    <div className="pb-28">
      {/* sticky action bar */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/vacancies" className="py-2 text-sm font-semibold text-brand-700 hover:underline">← До списку</Link>
          <p className="min-w-0 flex-1 truncate font-bold">{isNew ? 'Нова вакансія' : v.title || 'Без назви'}</p>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="size-5 accent-[var(--color-ok)]" checked={v.active} onChange={(e) => set('active', e.target.checked)} />
            Показувати на сайті
          </label>
          {!isNew && (
            <a
              href={savedPath}
              target="_blank"
              className="btn-ghost !px-4 !py-2.5 !text-sm"
              title={initial.active ? undefined : 'Прихована вакансія відкривається з позначкою «Набір закрито», без форми заявки, і не індексується Google. Так можна перевірити фото й текст перед публікацією.'}
            >
              {initial.active ? 'Відкрити ↗' : 'Переглянути ↗'}
            </a>
          )}
          <button type="button" onClick={save} disabled={saving} className="btn-accent !px-6 !py-2.5">
            {saving ? 'Зберігаємо…' : 'Зберегти'}
          </button>
        </div>
        {msg && <p className={`mt-2 rounded-xl px-3 py-2 text-sm font-semibold ${msg.ok ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`}>{msg.text}</p>}
        {dirty && !msg && <p className="mt-1 text-xs font-semibold text-danger">Є незбережені зміни</p>}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card title="1. Основне">
            <Field label="Назва вакансії *" hint="Як на картці та в заголовку сторінки. Напр.: «Пакувальник на фабрику шоколаду Milka»">
              <input className="field" value={v.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Компанія / бренд" hint="Напр.: Milka, Toyota. Можна залишити порожнім.">
                <input className="field" value={v.company} onChange={(e) => set('company', e.target.value)} />
              </Field>
              <Field label="Місто">
                <input className="field" value={v.city} onChange={(e) => set('city', e.target.value)} placeholder="Варшава" />
              </Field>
              <CountryField value={v.country} onChange={(c) => set('country', c)} />
              <Field label="Сфера">
                <select className="field" value={v.category} onChange={(e) => set('category', e.target.value as Category)}>
                  {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-sm font-semibold">
              <input type="checkbox" className="size-5 accent-[var(--color-brand-600)]" checked={v.hot} onChange={(e) => set('hot', e.target.checked)} />
              ★ Показувати на головній у блоці «Найкращі вакансії»
            </label>
          </Card>

          <Card title="2. Зарплата" hint="Цифри потрібні для фільтра й сортування, текст — показується в описі.">
            <Field label="Зарплата текстом *" hint="Як написати клієнту. Напр.: 25–30,5 zł/год нетто; 4700–5200 zł/міс (47 000–52 000 грн)">
              <input className="field" value={v.salary.text} onChange={(e) => setSal('text', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="За годину від"><input className="field" inputMode="decimal" value={v.salary.hourMin ?? ''} onChange={(e) => setSal('hourMin', e.target.value)} /></Field>
              <Field label="За годину до"><input className="field" inputMode="decimal" value={v.salary.hourMax ?? ''} onChange={(e) => setSal('hourMax', e.target.value)} /></Field>
              <Field label="На місяць від"><input className="field" inputMode="numeric" value={v.salary.monthMin ?? ''} onChange={(e) => setSal('monthMin', e.target.value)} /></Field>
              <Field label="На місяць до"><input className="field" inputMode="numeric" value={v.salary.monthMax ?? ''} onChange={(e) => setSal('monthMax', e.target.value)} /></Field>
            </div>
            {belowMinimum(v) && (
              <p className="rounded-2xl bg-danger/10 p-3 text-sm font-semibold text-danger">
                ⚠ {belowMinimum(v)}. Ймовірно, ставка з минулих років — уточніть у роботодавця й оновіть: кандидати й Google порівнюють її з мінімальною (31,40 zł/год брутто, 4 806 zł/міс).
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <Field label="Валюта" className="w-40">
                <select className="field" value={v.salary.currency} onChange={(e) => setSal('currency', e.target.value as Currency)}>
                  {(Object.keys(CURRENCY_SIGN) as Currency[]).map((c) => <option key={c} value={c}>{CURRENCY_SIGN[c] === c ? c : `${CURRENCY_SIGN[c]} (${c})`}</option>)}
                </select>
              </Field>
              <div>
                <span className="label">Сума вказана</span>
                <div className="flex gap-2">
                  <button type="button" className="chip" aria-pressed={!v.salary.unlabelled && v.salary.net} onClick={() => setNet(true)}>На руки (нетто)</button>
                  <button type="button" className="chip" aria-pressed={!v.salary.unlabelled && !v.salary.net} onClick={() => setNet(false)}>До податків (брутто)</button>
                </div>
                {v.salary.unlabelled && <p className="mt-1 text-xs text-muted">Джерело не вказало нетто чи брутто — на сайті сума без позначки. Оберіть, якщо знаєте.</p>}
              </div>
            </div>
            <p className="rounded-2xl bg-brand-50 p-3 text-sm text-brand-800">
              На картці буде: <b>{salaryMonth({ ...v.salary, monthMin: num(v.salary.monthMin), monthMax: num(v.salary.monthMax) ?? num(v.salary.monthMin) }) || salaryHour({ ...v.salary, hourMin: num(v.salary.hourMin), hourMax: num(v.salary.hourMax) ?? num(v.salary.hourMin) }) || v.salary.text || '—'}</b>
            </p>
          </Card>

          <Card title="3. Умови">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Графік роботи" hint="Напр.: 10–12 год/день, 5–6 днів на тиждень"><input className="field" value={v.schedule} onChange={(e) => set('schedule', e.target.value)} /></Field>
              <Field label="Вид договору" hint="Напр.: Umowa Zlecenie"><input className="field" value={v.contract} onChange={(e) => set('contract', e.target.value)} /></Field>
              <Field label="Проживання" hint="Коротко: «надається безкоштовно», «200 zł/міс»"><input className="field" value={v.housing} onChange={(e) => set('housing', e.target.value)} /></Field>
              <label className="flex items-center gap-3 self-end rounded-2xl bg-surface p-3 text-sm font-semibold">
                <input type="checkbox" className="size-5 accent-[var(--color-ok)]" checked={v.housingFree} onChange={(e) => set('housingFree', e.target.checked)} />
                Житло безкоштовне (зелена позначка)
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-sm font-semibold">
                <input type="checkbox" className="size-5 accent-[var(--color-ok)]" checked={Boolean(v.noLanguage)} onChange={(e) => set('noLanguage', e.target.checked)} />
                Знання мови не потрібне
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-sm font-semibold">
                <input type="checkbox" className="size-5 accent-[var(--color-ok)]" checked={Boolean(v.noExperience)} onChange={(e) => set('noExperience', e.target.checked)} />
                Досвід не потрібен
              </label>
            </div>
          </Card>

          <Card title="4. Опис вакансії" hint="Кожен пункт списку пишіть з нового рядка. Порожні розділи не показуються.">
            <Field label="Підзаголовок опису"><input className="field" value={v.headline} onChange={(e) => set('headline', e.target.value)} placeholder="Напр.: Виробництво автозапчастин TENNECO" /></Field>
            <Field label="Короткий вступ"><textarea className="field min-h-20" value={v.intro} onChange={(e) => set('intro', e.target.value)} placeholder="1–2 речення про компанію чи роботу" /></Field>
            {v.sections.map((s, i) => (
              <div key={i} className="rounded-2xl border border-line p-4">
                <div className="flex items-center gap-2">
                  <input className="field !py-2.5 font-semibold" value={s.title} placeholder="Назва розділу" onChange={(e) => set('sections', v.sections.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} />
                  <button type="button" disabled={i === 0} onClick={() => { const a = [...v.sections]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; set('sections', a) }} className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-surface disabled:opacity-30" aria-label="Вище">↑</button>
                  <button type="button" disabled={i === v.sections.length - 1} onClick={() => { const a = [...v.sections]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; set('sections', a) }} className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-surface disabled:opacity-30" aria-label="Нижче">↓</button>
                  <button type="button" onClick={() => set('sections', v.sections.filter((_, k) => k !== i))} className="grid size-10 shrink-0 place-items-center rounded-xl text-danger hover:bg-danger/10" aria-label="Видалити розділ">✕</button>
                </div>
                <textarea
                  className="field mt-2 min-h-28 leading-relaxed [field-sizing:content]"
                  value={s.items.join('\n')}
                  placeholder={'Кожен пункт з нового рядка\nНапр.: Пакування продукції\nКонтроль якості'}
                  onChange={(e) => set('sections', v.sections.map((x, k) => (k === i ? { ...x, items: e.target.value.split('\n') } : x)))}
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <span className="self-center text-sm font-semibold text-muted">Додати розділ:</span>
              {SECTION_TEMPLATES.filter((t) => !v.sections.some((s) => s.title === t)).map((t) => (
                <button key={t} type="button" className="chip" onClick={() => set('sections', [...v.sections, { title: t, items: [] }])}>+ {t}</button>
              ))}
              <button type="button" className="chip" onClick={() => set('sections', [...v.sections, { title: '', items: [] }])}>+ Свій розділ</button>
            </div>
          </Card>

          <Card title="5. Фото">
            <Photos label="Фото вакансії" hint="Перше фото — головне (на картці в каталозі). Горизонтальні фото виглядають найкраще." value={v.photos} onChange={(x) => set('photos', x)} folder={folder} />
            <Photos label="Фото житла" value={v.housingPhotos} onChange={(x) => set('housingPhotos', x)} folder={folder} />
            <Field label="Підпис під фото житла"><input className="field" value={v.housingNote} onChange={(e) => set('housingNote', e.target.value)} placeholder="Варіант житла на одному із заїздів" /></Field>
            <Photos label="Логотип компанії" hint="PNG з прозорим фоном (найкраще) або JPG на білому." value={v.logo ? [v.logo] : []} onChange={(x) => set('logo', x[0] ?? '')} folder={folder} single />
          </Card>

          <Card title="6. Відгуки про роботу" hint="Необов’язково. Показуються внизу сторінки вакансії.">
            {v.reviews.map((r, i) => (
              <div key={i} className="grid gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[180px_1fr_auto]">
                <input className="field" placeholder="Ім’я" value={r.name} onChange={(e) => set('reviews', v.reviews.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                <textarea className="field min-h-12" placeholder="Текст відгуку" value={r.text} onChange={(e) => set('reviews', v.reviews.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
                <button type="button" onClick={() => set('reviews', v.reviews.filter((_, k) => k !== i))} className="grid size-10 place-items-center rounded-xl text-danger hover:bg-danger/10" aria-label="Видалити відгук">✕</button>
              </div>
            ))}
            <button type="button" className="chip" onClick={() => set('reviews', [...v.reviews, { name: '', text: '' }])}>+ Додати відгук</button>
          </Card>

          <details className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
            <summary className="cursor-pointer text-lg font-bold">7. Адреса сторінки та SEO <span className="text-sm font-normal text-muted">(заповнюється автоматично — міняти не обов’язково)</span></summary>
            <div className="mt-4 space-y-4">
              <SeoPreview url={SITE.url.replace(/^https?:\/\//, '') + (v.path || autoPath)} title={v.seoTitle.trim() || autoTitle} description={v.seoDescription.trim() || autoDescription} custom={Boolean(v.seoTitle.trim() || v.seoDescription.trim())} />
              <Field label="Адреса сторінки (URL)" hint={isNew ? `Якщо залишити порожнім: ${autoPath}` : 'Увага: після зміни адреси старі посилання в рекламі перестануть працювати.'}>
                <input className="field font-mono" value={v.path} placeholder={autoPath} onChange={(e) => set('path', e.target.value)} />
              </Field>
              <SeoField label="SEO-заголовок (title)" max={60} value={v.seoTitle} auto={autoTitle} onChange={(x) => set('seoTitle', x)} />
              <SeoField label="SEO-опис (description)" max={158} value={v.seoDescription} auto={autoDescription} onChange={(x) => set('seoDescription', x)} multiline />
              <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                <Field label="Адреса підприємства (для Google)" hint="Необов’язково. Вулиця й номер, якщо знаєте — Google точніше покаже вакансію на карті й у пошуку роботи.">
                  <input className="field" value={v.workAddress?.street ?? ''} onChange={(e) => set('workAddress', { ...v.workAddress, street: e.target.value })} placeholder="ul. Przemysłowa 5" />
                </Field>
                <Field label="Індекс">
                  <input className="field" value={v.workAddress?.postalCode ?? ''} onChange={(e) => set('workAddress', { ...v.workAddress, postalCode: e.target.value })} placeholder="55-080" />
                </Field>
              </div>
            </div>
          </details>
          <RuEditor v={v} onChange={(ru) => set('ru', ru)} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[140px] lg:self-start">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <p className="font-bold">Підказки</p>
            <ul className="mt-2 space-y-2 text-sm text-ink-2">
              <li>• Обов’язкові поля позначені *.</li>
              <li>• Якщо набір тимчасово закрито — зніміть «Показувати на сайті», а не видаляйте.</li>
              <li>• Після «Зберегти» зміни з’являються на сайті за кілька секунд.</li>
              <li>• Фото можна завантажувати прямо з телефону.</li>
            </ul>
          </div>
          {history.length > 0 && (
            <details className="rounded-3xl bg-white p-5 ring-1 ring-line">
              <summary className="cursor-pointer font-bold">Історія змін</summary>
              <p className="mt-1 text-xs text-muted">Збережені раніше версії. «Повернути» змінює лише текст, фото й умови — показ на сайті лишається як зараз.</p>
              <ul className="mt-2 divide-y divide-line text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 py-2">
                    <span>{new Date((h.action === 'update' && h.version_at) || h.created_at).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    {h.action === 'update' && (
                      <button
                        type="button"
                        className="py-1 text-xs font-semibold text-brand-700 hover:underline"
                        onClick={() => {
                          if (!confirm(`Повернути версію від ${new Date(h.version_at || h.created_at).toLocaleString('uk-UA')}?${dirty ? ' Незбережені зміни буде втрачено.' : ''}`)) return
                          start(async () => {
                            await restoreVersion(h.id)
                            leaving.current = true
                            location.reload()
                          })
                        }}
                      >
                        Повернути цю версію
                      </button>
                    )}
                    {h.action === 'create' && <span className="text-xs text-muted">створено</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </aside>
      </div>
    </div>
  )
}

/** Sections ↔ one textarea: «# Назва розділу» then one item per line */
const sectionsToText = (xs: { title: string; items: string[] }[] = []) => xs.map((x) => `# ${x.title}\n${x.items.join('\n')}`).join('\n\n')
function textToSections(t: string) {
  const out: { title: string; items: string[] }[] = []
  for (const line of t.split('\n')) {
    const h = line.match(/^#\s*(.*)$/)
    if (h) out.push({ title: h[1].trim(), items: [] })
    else if (line.trim() && out.length) out[out.length - 1].items.push(line.trim())
  }
  return out
}

/** Russian version of the vacancy (shown on /ru/vacancies/…). Not updated automatically when the Ukrainian text changes. */
function RuEditor({ v, onChange }: { v: Vacancy; onChange: (ru: VacancyRu | undefined) => void }) {
  const ru = v.ru
  const [sectionsText, setSectionsText] = useState(() => sectionsToText(ru?.sections))
  const setRu = (patch: Partial<VacancyRu>) => onChange({ title: '', ...ru, ...patch })
  return (
    <details className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
      <summary className="cursor-pointer text-lg font-bold">
        8. Російська версія{' '}
        <span className={`text-sm font-normal ${ru?.title ? 'text-ok' : 'text-muted'}`}>{ru?.title ? '— є переклад' : '— немає перекладу (на RU-сайті показується українською)'}</span>
      </summary>
      <div className="mt-4 space-y-4">
        <p className="rounded-2xl bg-sun-100 p-3 text-sm text-ink">
          Російський текст <b>не оновлюється сам</b>. Змінили ставку, графік чи житло українською — виправте й тут, або натисніть «Прибрати переклад»: тоді RU-сторінка покаже українську версію й не індексуватиметься.
        </p>
        <Field label="Назва російською"><input className="field" value={ru?.title ?? ''} onChange={(e) => setRu({ title: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Місто"><input className="field" value={ru?.city ?? ''} onChange={(e) => setRu({ city: e.target.value })} /></Field>
          <Field label="Зарплата (текст)"><input className="field" value={ru?.salaryText ?? ''} onChange={(e) => setRu({ salaryText: e.target.value })} /></Field>
          <Field label="Графік"><input className="field" value={ru?.schedule ?? ''} onChange={(e) => setRu({ schedule: e.target.value })} /></Field>
          <Field label="Договір"><input className="field" value={ru?.contract ?? ''} onChange={(e) => setRu({ contract: e.target.value })} /></Field>
          <Field label="Проживання"><input className="field" value={ru?.housing ?? ''} onChange={(e) => setRu({ housing: e.target.value })} /></Field>
          <Field label="Підзаголовок"><input className="field" value={ru?.headline ?? ''} onChange={(e) => setRu({ headline: e.target.value })} /></Field>
        </div>
        <Field label="Вступ"><textarea className="field min-h-20" value={ru?.intro ?? ''} onChange={(e) => setRu({ intro: e.target.value })} /></Field>
        <Field label="Розділи опису" hint="Назва розділу — рядок, що починається з «#», далі кожен пункт з нового рядка.">
          <textarea
            className="field min-h-60 font-mono"
            value={sectionsText}
            onChange={(e) => {
              setSectionsText(e.target.value)
              setRu({ sections: textToSections(e.target.value) })
            }}
          />
        </Field>
        {ru?.title && (
          <button type="button" className="btn !bg-danger/10 !px-4 !py-2.5 text-danger" onClick={() => onChange(undefined)}>
            Прибрати переклад
          </button>
        )}
      </div>
    </details>
  )
}
