'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { CATEGORIES, COUNTRY, SITE, tildaSlug } from '@/lib/site'
import { CURRENCY_SIGN, salaryHour, salaryMonth, slugify } from '@/lib/format'
import { vacancyDescription, vacancyTitle } from '@/lib/seo'
import { duplicateVacancy, restoreVersion, saveVacancy } from '@/app/(admin)/admin/actions'
import { applyParsed, applyParsedRu, youtubeIds, type ParsedVacancy } from '@/lib/admin/parse-vacancy'
import { belowMinimum } from '@/lib/salary-check'
import type { Category, Currency, Salary, Vacancy } from '@/lib/types'
import { Photos } from './PhotoUploader'
import { CountryField } from './CountryField'
import { ParseBox, ParseReport } from './ParseBox'
import { SectionsEditor } from './SectionsEditor'
import { RuTab } from './VacancyRuTab'
import { Field, Notice, Panel, Switch, Tag, fmtDate } from './ui'
import { SeoField, SeoPreview } from './SeoFields'

export const SECTIONS_UK = ['Заробітна плата', 'Графік роботи', 'Обовʼязки', 'Проживання', 'Вимоги', 'Додаткові умови', 'Місце роботи']
const CONTRACTS = ['Umowa Zlecenie', 'Umowa o Pracę', 'Umowa o Dzieło', 'Відрядження A1', 'Офіційне оформлення', 'Трудовий контракт']
const TPOST = /^\/tpost\/([a-z0-9]{9}1)-/

/** Same parsing as the server (saveVacancy): «4 700», «25,5» */
const num = (x: unknown) => {
  const n = Number(String(x ?? '').replace(',', '.').replace(/\s/g, ''))
  return x === null || x === undefined || x === '' || !Number.isFinite(n) ? null : n
}
const salaryNums = (s: Salary): Salary => ({ ...s, hourMin: num(s.hourMin), hourMax: num(s.hourMax) ?? num(s.hourMin), monthMin: num(s.monthMin), monthMax: num(s.monthMax) ?? num(s.monthMin) })

const savedText = (active: boolean) =>
  active ? 'Збережено. Зміни вже на сайті.' : 'Збережено. Вакансія вимкнена — у каталозі її не видно, доки не ввімкнете «На сайті». Її сторінка за посиланням працює й приймає заявки.'

type History = { id: number; action: string; created_at: string; version_at: string | null }[]

export function VacancyEditor({
  initial,
  isNew,
  saved,
  history = [],
  pathLocked = true,
  suggestedUid = '',
  hasDb = true,
}: {
  initial: Vacancy
  isNew: boolean
  saved?: boolean
  history?: History
  /** published (now or ever) or imported from Tilda: the address never changes */
  pathLocked?: boolean
  /** new vacancy: the Tilda-style post id picked on the server (`ab12cd34e1`) */
  suggestedUid?: string
  hasDb?: boolean
}) {
  const router = useRouter()
  const [v, setV] = useState<Vacancy>(initial)
  const [savedPath, setSavedPath] = useState(initial.path)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(saved ? { ok: true, text: savedText(initial.active) } : null)
  const [saving, start] = useTransition()
  const [tab, setTab] = useState<'uk' | 'ru'>('uk')
  const [parsed, setParsed] = useState<ParsedVacancy | null>(null)
  const [videoInput, setVideoInput] = useState('')
  const leaving = useRef(false)

  useEffect(() => {
    if (saved) window.history.replaceState(null, '', window.location.pathname)
  }, [saved])

  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => {
      if (!leaving.current) e.preventDefault()
    }
    // in-app links (← Вакансії, the admin menu) don't fire beforeunload — ask before leaving
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

  const touch = () => {
    setDirty(true)
    setMsg(null)
  }
  const set = <K extends keyof Vacancy>(k: K, val: Vacancy[K]) => {
    setV((p) => ({ ...p, [k]: val }))
    touch()
  }
  const setSal = (k: keyof Salary, val: unknown) => {
    setV((p) => ({ ...p, salary: { ...p.salary, [k]: val } }))
    touch()
  }
  /** нетто / брутто chosen by a manager — the «not stated by the source» flag no longer applies */
  const setNet = (net: boolean) => {
    setV((p) => ({ ...p, salary: { ...p.salary, net, unlabelled: undefined } }))
    touch()
  }
  const folder = v.id || slugify(v.title || 'new').slice(0, 30) || 'new'

  /* address: Tilda logic for a new vacancy; fixed once anyone could link to it (docs/SEO.md) */
  const uid = initial.path.match(TPOST)?.[1] ?? suggestedUid
  const followsTitle = isNew || (!pathLocked && TPOST.test(initial.path))
  const finalPath = followsTitle && uid ? `/tpost/${uid}-${tildaSlug(v.title || 'vakansiya')}` : v.path
  const fullUrl = SITE.url.replace(/^https?:\/\//, '') + (finalPath || '/tpost/…')

  const save = () =>
    start(async () => {
      setMsg(null)
      try {
        const r = await saveVacancy({ ...v, path: followsTitle ? finalPath : v.path }, isNew)
        if (!r.ok) {
          setMsg({ ok: false, text: r.error })
          return
        }
        setDirty(false)
        setMsg({ ok: true, text: savedText(v.active) })
        if (isNew) {
          leaving.current = true
          router.replace(`/admin/vacancies/${encodeURIComponent(r.id)}?saved=1`)
        } else {
          setV((p) => ({ ...p, path: r.path }))
          setSavedPath(r.path)
          router.refresh()
        }
      } catch {
        setMsg({ ok: false, text: 'Не вдалося зберегти: немає зв’язку із сервером або закінчився вхід. Оновіть сторінку (зміни скопіюйте заздалегідь).' })
      }
    })

  const copy = () => {
    if (dirty && !confirm('Копія буде зроблена з останньої збереженої версії — незбережені зміни в неї не потраплять. Продовжити?')) return
    leaving.current = true
    start(async () => {
      await duplicateVacancy(v.id)
    })
  }

  const onParsed = (p: ParsedVacancy) => {
    setV((cur) => applyParsed(cur, p))
    setParsed(p)
    touch()
  }

  // the same functions the vacancy page uses — so the admin sees exactly what Google gets while the fields stay empty
  const seoBase = { ...v, path: finalPath, seoTitle: '', seoDescription: '', salary: salaryNums(v.salary) }
  const known = Boolean(COUNTRY[v.country])
  const autoTitle = v.title.trim() && known ? vacancyTitle(seoBase) : ''
  const autoDescription = v.title.trim() && known ? vacancyDescription(seoBase) : ''
  const sal = salaryNums(v.salary)
  const cardPay = salaryMonth(sal) || salaryHour(sal) || v.salary.text || '—'
  const low = belowMinimum(v)

  const checks: [string, boolean][] = [
    ['Назва', v.title.trim().length >= 5],
    ['Країна', known],
    ['Місто', Boolean(v.city.trim())],
    ['Зарплата', Boolean(v.salary.text.trim() || num(v.salary.hourMin) || num(v.salary.monthMin))],
    ['Опис (розділи)', v.sections.some((s) => s.items.some((i) => i.trim()))],
    ['Фото', v.photos.length > 0],
  ]

  return (
    <div className="pb-28">
      {/* sticky action bar */}
      <div className="sticky top-[59px] z-20 -mx-4 border-b border-line bg-cream/95 px-4 py-2.5 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link href="/admin/vacancies" className="py-2 text-[14px] font-medium text-brand-700 hover:underline">← Вакансії</Link>
          <p className="hidden min-w-0 flex-1 basis-40 truncate font-semibold sm:block">{isNew ? 'Нова вакансія' : v.title || 'Без назви'}</p>
          <span className="flex-1 sm:hidden" />
          <div className="flex items-center">
            <Switch on={v.active} label="Показувати на сайті" onChange={(on) => set('active', on)} />
            <span className={`ml-1.5 text-[14px] font-medium ${v.active ? 'text-brand-700' : 'text-muted'}`}>{v.active ? 'На сайті' : 'Вимкнена'}</span>
          </div>
          {!isNew && (
            <>
              <button type="button" className="btn-ghost hidden !min-h-11 !px-3.5 !text-[14px] sm:inline-flex" onClick={copy} disabled={saving}>Копія</button>
              <a
                href={savedPath}
                target="_blank"
                className="btn-ghost !min-h-11 !px-3.5 !text-[14px]"
                title={initial.active ? undefined : 'Вимкнена вакансія не показується в каталозі, але її сторінка працює як звичайна — з формою заявки.'}
              >
                {initial.active ? 'Відкрити ↗' : 'Переглянути ↗'}
              </a>
            </>
          )}
          <button type="button" onClick={save} disabled={saving || !hasDb} className="btn-accent hidden !min-h-11 !px-6 sm:inline-flex" title={hasDb ? undefined : 'База даних не підключена'}>
            {saving ? 'Зберігаємо…' : 'Зберегти'}
          </button>
        </div>
        {msg && <Notice tone={msg.ok ? 'ok' : 'err'} className="mt-2">{msg.text}</Notice>}
        {dirty && !msg && <p className="mt-1 hidden font-mono text-[11.5px] uppercase tracking-[0.06em] text-danger sm:block">Є незбережені зміни</p>}
      </div>

      {/* phone: «Зберегти» always under the thumb */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-2.5 backdrop-blur sm:hidden">
        <span className={`flex-1 font-mono text-[11px] uppercase tracking-[0.06em] ${dirty ? 'text-danger' : 'text-muted'}`}>{dirty ? 'Є незбережені зміни' : isNew ? 'Нова вакансія' : 'Без змін'}</span>
        <button type="button" onClick={save} disabled={saving || !hasDb} className="btn-accent !min-h-11 !px-7">
          {saving ? 'Зберігаємо…' : 'Зберегти'}
        </button>
      </div>

      {/* language tabs */}
      <div className="mt-4 flex gap-1.5" role="tablist" aria-label="Мова тексту">
        <button type="button" role="tab" aria-selected={tab === 'uk'} className="chip" data-active={tab === 'uk'} onClick={() => setTab('uk')}>
          Українська
        </button>
        <button type="button" role="tab" aria-selected={tab === 'ru'} className="chip" data-active={tab === 'ru'} onClick={() => setTab('ru')}>
          Русский <span className={`num text-[12px] ${tab === 'ru' ? 'opacity-80' : v.ru?.title ? 'text-brand-700' : 'text-muted'}`}>{v.ru?.title ? '· є' : '· немає'}</span>
        </button>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {tab === 'ru' ? (
          <RuTab v={v} onChange={(ru) => set('ru', ru)} onParsedRu={(p) => set('ru', applyParsedRu(v.ru, p))} />
        ) : (
          <div className="min-w-0 space-y-5">
            {isNew ? (
              <Panel n="00" title="Текст вакансії" hint="Вставте весь текст вакансії як є (з Telegram, Viber, Word) і натисніть «Розпізнати» — сайт сам розкладе його на блоки й заповнить форму нижче.">
                <ParseBox onParsed={onParsed} />
              </Panel>
            ) : (
              <details className="card group">
                <summary className="cursor-pointer list-none px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
                  <span className="eyebrow">00 — Вставити опис текстом</span>
                  <span className="ml-2 text-[14px] text-muted group-open:hidden">вставте текст як є — сайт сам розкладе його на блоки (зарплата, графік, обовʼязки, житло…)</span>
                </summary>
                <div className="border-t border-line p-4 sm:p-5">
                  <Notice tone="warn" className="mb-3">Розпізнаний текст замінить назву, зарплату, умови й розділи. Фото, відгуки, адреса сторінки та показ на сайті не зміняться.</Notice>
                  <ParseBox onParsed={onParsed} />
                </div>
              </details>
            )}

            {parsed && (
              <ParseReport
                p={parsed}
                seo={{ title: v.seoTitle.trim() || autoTitle, description: v.seoDescription.trim() || autoDescription }}
                url={finalPath}
                onClose={() => setParsed(null)}
                onToRu={() => {
                  set('ru', applyParsedRu(v.ru, parsed))
                  setTab('ru')
                }}
                onCountryAdded={(code) => {
                  set('country', code)
                  router.refresh()
                }}
              />
            )}

            <Panel n="01" title="Основне">
              <Field label="Назва вакансії *" hint="Як на картці та в заголовку сторінки. Напр.: «Пакувальник на фабрику шоколаду Milka»">
                <input className="field" value={v.title} onChange={(e) => set('title', e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Компанія / бренд" hint="Milka, Toyota… Можна залишити порожнім.">
                  <input className="field" value={v.company} onChange={(e) => set('company', e.target.value)} />
                </Field>
                <CountryField value={v.country} onChange={(c) => set('country', c)} />
                <Field label="Місто" hint="Як пишемо кандидатам: Вроцлав, Ełk, Доетинхем">
                  <input className="field" value={v.city} onChange={(e) => set('city', e.target.value)} placeholder="Варшава" />
                </Field>
                <Field label="Велике місто поруч" hint="Для сторінок міст (Польща, Чехія): Wrocław, Kraków, Praha…">
                  <input className="field" value={v.hubCity ?? ''} onChange={(e) => set('hubCity', e.target.value)} placeholder="Wrocław" list="hub-cities" />
                  <datalist id="hub-cities">
                    {['Warszawa', 'Wrocław', 'Kraków', 'Poznań', 'Łódź', 'Katowice', 'Gdańsk', 'Szczecin', 'Lublin', 'Bydgoszcz', 'Białystok', 'Praha', 'Brno', 'Ostrava', 'Plzeň'].map((c) => <option key={c} value={c} />)}
                  </datalist>
                </Field>
                <Field label="Сфера">
                  <select className="field" value={v.category} onChange={(e) => set('category', e.target.value as Category)}>
                    {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ['hot', '★ У «Найкращих вакансіях» на головній'],
                    ['noLanguage', 'Знання мови не потрібне'],
                    ['noExperience', 'Досвід не потрібен'],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="flex min-h-12 items-center gap-3 border border-line px-3 py-2 text-[14.5px] font-medium">
                    <input type="checkbox" className="size-5 shrink-0 accent-[var(--color-brand-600)]" checked={Boolean(v[k])} onChange={(e) => set(k, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
            </Panel>

            <Panel n="02" title="Зарплата" hint="Цифри — для фільтра й сортування, текст — показується в описі.">
              <Field label="Зарплата текстом *" hint="Як написати клієнту: 28–30,5 zł/год нетто; 6 160–7 625 zł/міс">
                <input className="field" value={v.salary.text} onChange={(e) => setSal('text', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="За годину від"><input className="field num" inputMode="decimal" value={v.salary.hourMin ?? ''} onChange={(e) => setSal('hourMin', e.target.value)} /></Field>
                <Field label="За годину до"><input className="field num" inputMode="decimal" value={v.salary.hourMax ?? ''} onChange={(e) => setSal('hourMax', e.target.value)} /></Field>
                <Field label="На місяць від"><input className="field num" inputMode="numeric" value={v.salary.monthMin ?? ''} onChange={(e) => setSal('monthMin', e.target.value)} /></Field>
                <Field label="На місяць до"><input className="field num" inputMode="numeric" value={v.salary.monthMax ?? ''} onChange={(e) => setSal('monthMax', e.target.value)} /></Field>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <Field label="Валюта" className="w-44">
                  <select className="field" value={v.salary.currency} onChange={(e) => setSal('currency', e.target.value as Currency)}>
                    {(Object.keys(CURRENCY_SIGN) as Currency[]).map((c) => <option key={c} value={c}>{CURRENCY_SIGN[c] === c ? c : `${CURRENCY_SIGN[c]} (${c})`}</option>)}
                  </select>
                </Field>
                <div>
                  <span className="label">Сума вказана</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className="chip" aria-pressed={!v.salary.unlabelled && v.salary.net} onClick={() => setNet(true)}>На руки (нетто)</button>
                    <button type="button" className="chip" aria-pressed={!v.salary.unlabelled && !v.salary.net} onClick={() => setNet(false)}>Брутто</button>
                  </div>
                </div>
              </div>
              {v.salary.unlabelled && <Notice tone="warn">Нетто чи брутто — не вказано. На сайті сума без позначки. Оберіть, якщо знаєте.</Notice>}
              {low && <Notice tone="err">{low}. Ймовірно, ставка з минулих років — уточніть у роботодавця: кандидати й Google порівнюють її з мінімальною (31,40 zł/год брутто, 4 806 zł/міс).</Notice>}
              <p className="border-l-[3px] border-ink bg-surface px-3.5 py-2.5 text-[14px] text-ink-2">
                На картці: <b className="num text-ink">{cardPay}</b>
                {!v.salary.unlabelled && <span className="ml-1 text-muted">({v.salary.net ? 'на руки' : 'брутто'})</span>}
              </p>
            </Panel>

            <Panel n="03" title="Умови">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Графік роботи" hint="по 10–12 год/день, 5–6 днів на тиждень"><input className="field" value={v.schedule} onChange={(e) => set('schedule', e.target.value)} /></Field>
                <Field label="Вид договору" hint="Оберіть зі списку або впишіть">
                  <input className="field" value={v.contract} onChange={(e) => set('contract', e.target.value)} list="contracts" />
                  <datalist id="contracts">{CONTRACTS.map((c) => <option key={c} value={c} />)}</datalist>
                </Field>
                <Field label="Проживання" hint="Коротко: «безкоштовне», «500 zł/міс»"><input className="field" value={v.housing} onChange={(e) => set('housing', e.target.value)} /></Field>
                <label className="flex min-h-12 items-center gap-3 self-end border border-line px-3 py-2 text-[14.5px] font-medium">
                  <input type="checkbox" className="size-5 shrink-0 accent-[var(--color-brand-600)]" checked={v.housingFree} onChange={(e) => set('housingFree', e.target.checked)} />
                  Житло безкоштовне (позначка на картці)
                </label>
              </div>
            </Panel>

            <Panel n="04" title="Опис вакансії" hint="Кожен пункт — з нового рядка. Порожні розділи на сайті не показуються.">
              <Field label="Підзаголовок опису"><input className="field" value={v.headline} onChange={(e) => set('headline', e.target.value)} placeholder="Виробництво автозапчастин TENNECO" /></Field>
              <Field label="Короткий вступ"><textarea className="field min-h-20 [field-sizing:content]" value={v.intro} onChange={(e) => set('intro', e.target.value)} placeholder="1–2 речення про компанію чи роботу" /></Field>
              <SectionsEditor value={v.sections} onChange={(x) => set('sections', x)} templates={SECTIONS_UK} />
            </Panel>

            <Panel n="05" title="Фото та відео">
              <Photos label="Фото вакансії" hint="Перше — головне (на картці в каталозі). Горизонтальні виглядають найкраще." value={v.photos} onChange={(x) => set('photos', x)} folder={folder} />
              <Photos label="Фото житла" value={v.housingPhotos} onChange={(x) => set('housingPhotos', x)} folder={folder} />
              <Field label="Підпис під фото житла"><input className="field" value={v.housingNote} onChange={(e) => set('housingNote', e.target.value)} placeholder="Варіант житла на одному із заїздів" /></Field>
              <Photos label="Логотип компанії" hint="PNG з прозорим фоном або JPG на білому." value={v.logo ? [v.logo] : []} onChange={(x) => set('logo', x[0] ?? '')} folder={folder} single />
              <div>
                <span className="label">Відео з YouTube</span>
                {(v.videos ?? []).length > 0 && (
                  <ul className="mb-2 divide-y divide-line border border-line">
                    {(v.videos ?? []).map((id) => (
                      <li key={id} className="flex items-center gap-3 px-3 py-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://i.ytimg.com/vi/${id}/default.jpg`} alt="" width={64} height={48} loading="lazy" className="h-12 w-16 shrink-0 bg-surface object-cover" />
                        <a href={`https://youtu.be/${id}`} target="_blank" className="num min-w-0 flex-1 truncate text-[13px] text-brand-700 hover:underline">youtu.be/{id}</a>
                        <button type="button" className="grid size-10 place-items-center text-danger hover:bg-danger/5" aria-label="Прибрати відео" onClick={() => set('videos', (v.videos ?? []).filter((x) => x !== id))}>✕</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <input className="field" value={videoInput} onChange={(e) => setVideoInput(e.target.value)} placeholder="Вставте посилання: https://youtu.be/…" />
                  <button
                    type="button"
                    className="btn-ghost shrink-0"
                    disabled={!youtubeIds(videoInput).length && !/^[\w-]{11}$/.test(videoInput.trim())}
                    onClick={() => {
                      const ids = youtubeIds(videoInput)
                      if (!ids.length && /^[\w-]{11}$/.test(videoInput.trim())) ids.push(videoInput.trim())
                      set('videos', [...new Set([...(v.videos ?? []), ...ids])])
                      setVideoInput('')
                    }}
                  >
                    Додати
                  </button>
                </div>
                <p className="mt-1 text-[13px] text-muted">Показуються в блоці «Відео з місця роботи» на сторінці вакансії.</p>
              </div>
            </Panel>

            <Panel n="06" title="Відгуки про роботу" hint="Необов’язково. Показуються внизу сторінки вакансії.">
              {v.reviews.map((r, i) => (
                <div key={i} className="grid gap-2 border border-line p-2.5 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
                  <input className="field" placeholder="Ім’я" value={r.name} onChange={(e) => set('reviews', v.reviews.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                  <textarea className="field min-h-12 [field-sizing:content]" placeholder="Текст відгуку" value={r.text} onChange={(e) => set('reviews', v.reviews.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
                  <button type="button" onClick={() => set('reviews', v.reviews.filter((_, k) => k !== i))} className="grid size-11 place-items-center border border-line text-danger hover:border-danger" aria-label="Видалити відгук">✕</button>
                </div>
              ))}
              <button type="button" className="chip" onClick={() => set('reviews', [...v.reviews, { name: '', text: '' }])}>+ Додати відгук</button>
            </Panel>

            <Panel n="07" title="Адреса сторінки та SEO" hint="Заповнюється автоматично — міняти не обов’язково." id="seo">
              <div className="border border-line">
                <p className="border-b border-line bg-surface/60 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Адреса на сайті</p>
                <p className="num break-all px-3 py-2.5 text-[14px] text-ink">{fullUrl}</p>
                <p className="border-t border-line px-3 py-2 text-[13px] text-muted">
                  {isNew
                    ? 'Як у Tilda: /tpost/ + 10 символів + назва латиницею. Адреса складається з назви, доки ви її не збережете, і більше не зміниться.'
                    : followsTitle
                      ? 'Вакансія ще не з’являлася на сайті — адреса оновиться за новою назвою під час збереження. Після першої публікації вона закріпиться назавжди.'
                      : 'Адреса закріплена: на неї можуть вести посилання й реклама, тому вона не змінюється (docs/SEO.md).'}
                </p>
              </div>
              <SeoPreview url={fullUrl} title={v.seoTitle.trim() || autoTitle} description={v.seoDescription.trim() || autoDescription} custom={Boolean(v.seoTitle.trim() || v.seoDescription.trim())} />
              <SeoField label="SEO-заголовок (title)" max={60} value={v.seoTitle} auto={autoTitle} onChange={(x) => set('seoTitle', x)} />
              <SeoField label="SEO-опис (description)" max={158} value={v.seoDescription} auto={autoDescription} onChange={(x) => set('seoDescription', x)} multiline />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                <Field label="Адреса підприємства (для Google)" hint="Необов’язково. Вулиця й номер — Google точніше покаже вакансію на карті й у пошуку роботи.">
                  <input className="field" value={v.workAddress?.street ?? ''} onChange={(e) => set('workAddress', { ...v.workAddress, street: e.target.value })} placeholder="ul. Przemysłowa 5" />
                </Field>
                <Field label="Індекс">
                  <input className="field num" value={v.workAddress?.postalCode ?? ''} onChange={(e) => set('workAddress', { ...v.workAddress, postalCode: e.target.value })} placeholder="55-080" />
                </Field>
              </div>
            </Panel>
          </div>
        )}

        <aside className="space-y-4 lg:sticky lg:top-[140px] lg:self-start">
          <div className="card">
            <p className="border-b border-line px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Готовність</p>
            <ul className="divide-y divide-line">
              {checks.map(([label, ok]) => (
                <li key={label} className="flex items-center justify-between px-4 py-2 text-[14px]">
                  <span>{label}</span>
                  {ok ? <Tag tone="ok">є</Tag> : <Tag tone="err">немає</Tag>}
                </li>
              ))}
              <li className="flex items-center justify-between px-4 py-2 text-[14px]">
                <span>Російська версія</span>
                {v.ru?.title ? <Tag tone="ok">є</Tag> : <Tag>немає</Tag>}
              </li>
            </ul>
            <p className="num break-all border-t border-line px-4 py-2.5 text-[12px] text-ink-2">{finalPath || '/tpost/…'}</p>
          </div>
          <div className="card px-4 py-3 text-[14px] text-ink-2">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Підказки</p>
            <ul className="mt-2 space-y-1.5">
              <li>Набір на паузі — вимкніть «На сайті», а не видаляйте: сторінка й далі прийматиме заявки.</li>
              <li>Після «Зберегти» зміни на сайті за кілька секунд.</li>
              <li>Фото можна завантажувати прямо з телефону.</li>
              <li className="hidden lg:list-item">Ctrl/⌘ + Enter у полі тексту — «Розпізнати».</li>
            </ul>
          </div>
          {history.length > 0 && (
            <details className="card">
              <summary className="cursor-pointer list-none px-4 py-2.5 [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Історія змін</span> <span className="num text-[12px] text-muted">({history.length})</span>
              </summary>
              <p className="border-t border-line px-4 py-2 text-[13px] text-muted">«Повернути» змінює текст, фото й умови; показ на сайті лишається як зараз.</p>
              <ul className="divide-y divide-line border-t border-line text-[14px]">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 px-4 py-2">
                    <span className="num text-[13px]">{fmtDate((h.action === 'update' && h.version_at) || h.created_at, true)}</span>
                    {h.action === 'update' && (
                      <button
                        type="button"
                        className="py-1 text-[13px] font-semibold text-brand-700 hover:underline"
                        onClick={() => {
                          if (!confirm(`Повернути версію від ${fmtDate(h.version_at || h.created_at, true)}?${dirty ? ' Незбережені зміни буде втрачено.' : ''}`)) return
                          start(async () => {
                            await restoreVersion(h.id)
                            leaving.current = true
                            location.reload()
                          })
                        }}
                      >
                        Повернути
                      </button>
                    )}
                    {h.action === 'create' && <span className="text-[12px] text-muted">створено</span>}
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
