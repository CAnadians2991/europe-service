'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteCountry, saveCountry, type CountryInput } from '@/app/(admin)/admin/actions'
import { guessCountry, type CountryPreset } from '@/lib/country-presets'
import { SEO_LIMITS, countryH1, countryTexts } from '@/lib/admin/country-texts'
import { SITE, type CountryInfo, type CountrySeoText } from '@/lib/site'
import { CountryPicker } from './CountryPicker'
import { Code, Confirm, Field, Notice, PageHead, Panel, Tag } from './ui'

export type CountryRow = CountryInfo & { active: number; hidden: number }

const EMPTY: CountryInput = { code: '', name: '', nameRu: '', inName: '', inNameRu: '', slug: '', seo: {} }
const host = SITE.url.replace(/^https?:\/\//, '')

const toInput = (c: CountryRow): CountryInput => ({
  code: c.code,
  name: c.name,
  nameRu: c.nameRu,
  inName: c.inName,
  inNameRu: c.inNameRu,
  slug: c.path.replace('/vacancies/', ''),
  seo: c.seo ?? {},
})

/** Google result + the top of the country page, as they will look (the H1 is the site's template) */
function CountryPreview({ form, lang, saved }: { form: CountryInput; lang: 'uk' | 'ru'; saved: boolean }) {
  const t: CountrySeoText = form.seo?.[lang] ?? {}
  const auto = countryTexts(form)[lang]
  const title = t.title || auto.title
  const path = `${lang === 'ru' ? '/ru' : ''}/vacancies/${form.slug || '…'}`
  return (
    <div className="space-y-3">
      <div className="border border-line bg-surface/60 p-3.5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">У Google</p>
        <p className="num mt-2 truncate text-[12.5px] text-ink-2">{host}{path}</p>
        <p className="mt-0.5 text-[17px] leading-snug text-[#1a0dab]">{title.length > 44 ? title : `${title} | Europe Service`}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{t.description || auto.description}</p>
      </div>
      <div className="border border-line bg-white">
        <p className="border-b border-line bg-surface/60 px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Сторінка країни</p>
        <div className="p-4">
          <p className="num text-[12px] text-muted">{lang === 'uk' ? 'Головна / Вакансії' : 'Главная / Вакансии'} / {(lang === 'uk' ? form.name : form.nameRu) || '…'}</p>
          <p className="mt-2 font-display text-[22px] font-semibold leading-tight tracking-[-0.02em]">{countryH1(form, lang)}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{t.text || auto.text}</p>
          <div className="rule-grad mt-4" />
          <p className="mt-3 text-[13.5px] text-muted">
            {lang === 'uk' ? 'Далі — вакансії країни. Без відкритих вакансій сторінка закрита від Google, а в меню й фільтрі країни немає.' : 'Дальше — вакансии страны.'}
          </p>
        </div>
      </div>
      {saved && form.slug && (
        <a href={path} target="_blank" className="btn-ghost !min-h-10 !text-[14px]">Відкрити сторінку ↗</a>
      )}
    </div>
  )
}

function SeoInputs({ form, lang, onChange }: { form: CountryInput; lang: 'uk' | 'ru'; onChange: (k: keyof CountrySeoText, v: string) => void }) {
  const t = form.seo?.[lang] ?? {}
  const auto = countryTexts(form)[lang]
  const counter = (val: string, max: number) => <span className={`num text-[12px] ${val.length > max ? 'font-semibold text-danger' : 'text-muted'}`}>{val.length}/{max}</span>
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-baseline justify-between"><span className="label">{lang === 'uk' ? 'Заголовок для Google' : 'Заголовок для Google (RU)'}</span>{counter(t.title ?? '', SEO_LIMITS.title)}</div>
        <input className="field" value={t.title ?? ''} placeholder={auto.title} onChange={(e) => onChange('title', e.target.value)} />
      </div>
      <div>
        <div className="flex items-baseline justify-between"><span className="label">{lang === 'uk' ? 'Опис для Google' : 'Описание для Google'}</span>{counter(t.description ?? '', SEO_LIMITS.description)}</div>
        <textarea className="field min-h-24 [field-sizing:content]" value={t.description ?? ''} placeholder={auto.description} onChange={(e) => onChange('description', e.target.value)} />
      </div>
      <div>
        <div className="flex items-baseline justify-between"><span className="label">{lang === 'uk' ? 'Текст під заголовком сторінки' : 'Текст под заголовком'}</span>{counter(t.text ?? '', SEO_LIMITS.text)}</div>
        <textarea className="field min-h-24 [field-sizing:content]" value={t.text ?? ''} placeholder={auto.text} onChange={(e) => onChange('text', e.target.value)} />
      </div>
    </div>
  )
}

export function CountriesEditor({ rows, initialName = '', hasDb = true }: { rows: CountryRow[]; initialName?: string; hasDb?: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState<CountryInput>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  // typed by hand (not from the list): the Russian forms and the code are needed
  const [manual, setManual] = useState(false)
  // the SEO texts are still the generated ones: they follow the names until the manager edits one
  const [autoTexts, setAutoTexts] = useState(true)
  const [lang, setLang] = useState<'uk' | 'ru'>('uk')
  const [msg, setMsg] = useState<{ ok: boolean; text: string; path?: string } | null>(null)
  const [busy, start] = useTransition()
  const [remove, setRemove] = useState<CountryRow | null>(null)

  const taken = new Set(rows.map((r) => r.code))
  const open = Boolean(editing || form.name)

  const setName = <K extends keyof CountryInput>(k: K, v: CountryInput[K]) =>
    setForm((f) => {
      const next = { ...f, [k]: v }
      return autoTexts && ['name', 'nameRu', 'inName', 'inNameRu'].includes(k as string) ? { ...next, seo: countryTexts(next) } : next
    })
  const setSeo = (l: 'uk' | 'ru', k: keyof CountrySeoText, v: string) => {
    setAutoTexts(false)
    setForm((f) => ({ ...f, seo: { ...f.seo, [l]: { ...f.seo?.[l], [k]: v } } }))
  }

  const reset = () => {
    setForm(EMPTY)
    setEditing(null)
    setManual(false)
    setAutoTexts(true)
  }
  const pick = (p: CountryPreset) => {
    setForm({ ...EMPTY, ...p, seo: countryTexts(p) })
    setManual(false)
    setAutoTexts(true)
    setMsg(null)
  }

  const save = () =>
    start(async () => {
      const r = await saveCountry(form, editing ?? undefined)
      if (!r.ok) return setMsg({ ok: false, text: r.error ?? 'Не вдалося зберегти' })
      setMsg({
        ok: true,
        text: `${editing ? 'Збережено' : `${form.name} додано`}. Країну вже можна вибрати у вакансії; у меню й фільтрі сайту вона з’явиться з першою відкритою вакансією.`,
        path: `/vacancies/${form.slug}`,
      })
      reset()
      router.refresh()
    })

  return (
    <div className="space-y-5 pb-24">
      <PageHead
        eyebrow="02 — Країни"
        title="Країни"
        sub={<span className="num">{rows.length} на сайті · {rows.filter((r) => r.custom).length} додано в адмінці</span>}
      />
      {!hasDb && <Notice tone="warn">База даних не підключена — нові країни не збережуться. Форма й попередній перегляд працюють.</Notice>}
      {msg && (
        <Notice tone={msg.ok ? 'ok' : 'err'}>
          {msg.text}{' '}
          {msg.ok && msg.path && (
            <a href={msg.path} target="_blank" className="font-semibold underline">Відкрити {msg.path} ↗</a>
          )}
        </Notice>
      )}

      <Panel
        n="01"
        title={editing ? `Змінити: ${form.name}` : 'Додати країну'}
        hint={open ? undefined : 'Почніть вводити назву й виберіть країну — назви, «Робота в …», код, адреса сторінки й тексти для Google заповняться самі.'}
      >
        {!open && (
          <CountryPicker
            exclude={taken}
            initial={initialName}
            autoFocus={Boolean(initialName)}
            onPick={pick}
            onManual={(name) => {
              setForm({ ...EMPTY, ...guessCountry(name), seo: {} })
              setManual(true)
              setAutoTexts(true)
              setMsg(null)
            }}
          />
        )}

        {open && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-3 border-l-[3px] border-brand-600 bg-brand-50 px-3.5 py-3">
                <Code code={form.code} className="!h-8 !min-w-10 !text-[13px]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-bold">
                    {form.name || '…'}
                    {form.nameRu && <span className="font-normal text-muted"> · {form.nameRu}</span>}
                  </span>
                  <span className="num block text-[13px] text-brand-700">/vacancies/{form.slug || '…'}</span>
                </span>
              </div>

              <details open={Boolean(editing) || manual} className="border border-line">
                <summary className="cursor-pointer px-3.5 py-2.5 text-[15px] font-semibold">
                  Назви, код і адреса сторінки {manual && <span className="text-[13px] font-normal text-danger">— заповніть російською та код</span>}
                </summary>
                <div className="grid gap-4 border-t border-line p-3.5 sm:grid-cols-2">
                  <Field label="Назва українською *"><input className="field" value={form.name} onChange={(e) => setName('name', e.target.value)} placeholder="Іспанія" /></Field>
                  <Field label="Назва російською *"><input className="field" value={form.nameRu} onChange={(e) => setName('nameRu', e.target.value)} placeholder="Испания" /></Field>
                  <Field label="«Робота …» українською *" hint="Як у фразі «Робота в Іспанії», «Робота на Мальті».">
                    <input className="field" value={form.inName} onChange={(e) => setName('inName', e.target.value)} placeholder="в Іспанії" />
                  </Field>
                  <Field label="«Работа …» російською *"><input className="field" value={form.inNameRu} onChange={(e) => setName('inNameRu', e.target.value)} placeholder="в Испании" /></Field>
                  <Field label="Код країни *" hint="Дві латинські літери, як у доменах: es, no, pt.">
                    <input className="field num lowercase" maxLength={2} value={form.code} onChange={(e) => setName('code', e.target.value.toLowerCase().replace(/[^a-z]/g, ''))} placeholder="es" />
                  </Field>
                  <Field label="Адреса сторінки *" hint={editing ? 'Після зміни старе посилання на сторінку країни перестане працювати.' : 'Латиниця й дефіс.'}>
                    <div className="flex items-center gap-1"><span className="num shrink-0 text-[14px] text-muted">/vacancies/</span><input className="field num" value={form.slug} onChange={(e) => setName('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="spain" /></div>
                  </Field>
                </div>
              </details>

              <div className="border border-line">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3.5 py-2">
                  <span className="text-[15px] font-semibold">Тексти сторінки</span>
                  <div className="flex gap-1.5">
                    {(['uk', 'ru'] as const).map((l) => (
                      <button key={l} type="button" className="chip !min-h-9 !px-3 !text-[13.5px]" aria-pressed={lang === l} onClick={() => setLang(l)}>{l === 'uk' ? 'Українською' : 'Русский'}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 p-3.5">
                  <SeoInputs form={form} lang={lang} onChange={(k, v) => setSeo(lang, k, v)} />
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="btn-ghost !min-h-10 !text-[14px]" onClick={() => { setForm((f) => ({ ...f, seo: countryTexts(f) })); setAutoTexts(true) }}>Згенерувати тексти заново</button>
                    <span className="text-[13px] text-muted">{autoTexts ? 'Тексти згенеровані й оновлюються разом із назвами.' : 'Ви змінили тексти — вони збережуться як є.'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={save} disabled={busy || !form.name || !hasDb} className="btn-accent">{busy ? 'Зберігаємо…' : editing ? 'Зберегти' : 'Додати країну'}</button>
                <button type="button" className="btn-ghost" onClick={() => { reset(); setMsg(null) }}>{editing ? 'Скасувати' : 'Інша країна'}</button>
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Попередній перегляд · {lang === 'uk' ? 'UA' : 'RU'}</p>
              <CountryPreview form={form} lang={lang} saved={Boolean(editing)} />
              {!editing && <p className="mt-2 text-[13px] text-muted">Сторінка з’явиться за цією адресою одразу після збереження.</p>}
            </div>
          </div>
        )}
      </Panel>

      <Panel n="02" title="Країни на сайті" hint="Основні країни вбудовані в сайт (їхні адреси й тексти — з Tilda, не змінюються). Додані в адмінці можна змінити або видалити, якщо в них немає вакансій.">
        <ul className="-mx-4 -my-4 divide-y divide-line sm:-mx-5 sm:-my-5">
          {rows.map((c) => (
            <li key={c.code} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 sm:px-5">
              <Code code={c.code} />
              <span className="min-w-0 flex-1 basis-48">
                <span className="block font-semibold">
                  {c.name} <span className="font-normal text-muted">· {c.nameRu}</span>
                </span>
                <span className="num block text-[12.5px] text-muted">
                  {c.active} відкр.{c.hidden ? ` · ${c.hidden} закр.` : ''} {c.active ? '' : '· у фільтрі з’явиться з першою відкритою'}
                </span>
              </span>
              <a href={c.path} target="_blank" className="num py-2 text-[13px] text-brand-700 hover:underline">{c.path} ↗</a>
              {c.custom ? (
                <span className="flex gap-1.5">
                  <button
                    type="button"
                    className="btn-ghost !min-h-10 !px-3.5 !text-[14px]"
                    onClick={() => {
                      setForm(toInput(c))
                      setEditing(c.code)
                      setManual(false)
                      setAutoTexts(!c.seo?.uk && !c.seo?.ru)
                      setMsg(null)
                      scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    Змінити
                  </button>
                  <button type="button" disabled={busy} className="btn-ghost !min-h-10 !px-3.5 !text-[14px] !text-danger" onClick={() => setRemove(c)}>Видалити</button>
                </span>
              ) : (
                <Tag>основна</Tag>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      {remove && (
        <Confirm
          title={`Видалити країну «${remove.name}»?`}
          okLabel="Так, видалити"
          danger
          busy={busy}
          onCancel={() => setRemove(null)}
          onOk={() =>
            start(async () => {
              const c = remove
              setRemove(null)
              const r = await deleteCountry(c.code)
              setMsg(r.ok ? { ok: true, text: `${c.name} видалено.` } : { ok: false, text: r.error ?? 'Не вдалося видалити' })
              if (r.ok) router.refresh()
            })
          }
        >
          <p>Сторінка {remove.path} перестане працювати. Видалити можна лише країну без вакансій.</p>
        </Confirm>
      )}
    </div>
  )
}
