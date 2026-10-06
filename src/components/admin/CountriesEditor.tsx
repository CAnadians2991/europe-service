'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteCountry, saveCountry, type CountryInput } from '@/app/(admin)/admin/actions'
import { guessCountry } from '@/lib/country-presets'
import { CountryPicker } from './CountryPicker'
import { countrySeo } from '@/lib/landing'
import { flagOf, type CountryInfo } from '@/lib/site'

export type CountryRow = CountryInfo & { active: number; hidden: number }

const EMPTY: CountryInput = { code: '', name: '', nameRu: '', inName: '', inNameRu: '', slug: '', seo: {} }

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

const input = (c: CountryRow): CountryInput => ({ code: c.code, name: c.name, nameRu: c.nameRu, inName: c.inName, inNameRu: c.inNameRu, slug: c.path.replace('/vacancies/', ''), seo: c.seo ?? {} })

export function CountriesEditor({ rows, initialName = '' }: { rows: CountryRow[]; initialName?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<CountryInput>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  // a country typed by hand (not from the list): its fields are shown open, the Russian forms and the code are needed
  const [manual, setManual] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, start] = useTransition()
  const set = <K extends keyof CountryInput>(k: K, v: CountryInput[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setSeo = (lang: 'uk' | 'ru', k: 'title' | 'description' | 'text', v: string) => setForm((f) => ({ ...f, seo: { ...f.seo, [lang]: { ...f.seo?.[lang], [k]: v } } }))

  const taken = new Set(rows.map((r) => r.code))
  // the template texts the page gets while the fields stay empty
  const draft: CountryInfo = { code: form.code || 'xx', name: form.name, nameRu: form.nameRu, inName: form.inName || 'в …', inNameRu: form.inNameRu || 'в …', path: '', flag: '' }
  const tpl = { uk: countrySeo(draft, 'uk'), ru: countrySeo(draft, 'ru') }

  const reset = () => {
    setForm(EMPTY)
    setEditing(null)
    setManual(false)
    setMsg(null)
  }

  const save = () =>
    start(async () => {
      const r = await saveCountry(form, editing ?? undefined)
      if (!r.ok) return setMsg({ ok: false, text: r.error ?? 'Не вдалося зберегти' })
      setMsg({ ok: true, text: `${editing ? 'Збережено' : `${form.name} додано`}. Її вже можна вибрати у вакансії. Сторінка ${form.slug ? `/vacancies/${form.slug}` : 'країни'} готова, а у фільтрі й меню сайту країна з’явиться з першою активною вакансією.` })
      setForm(EMPTY)
      setEditing(null)
      setManual(false)
      router.refresh()
    })

  const remove = (c: CountryRow) =>
    start(async () => {
      if (!confirm(`Видалити країну «${c.name}»?`)) return
      const r = await deleteCountry(c.code)
      setMsg(r.ok ? { ok: true, text: `${c.name} видалено.` } : { ok: false, text: r.error ?? 'Не вдалося видалити' })
      if (r.ok) router.refresh()
    })

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-xl font-bold">Країни</h1>
        <p className="mt-1 text-sm text-muted">Країна з’являється у фільтрах, меню й квізі сайту автоматично, щойно в ній є хоч одна активна вакансія.</p>
      </div>

      <Card title={editing ? `Змінити: ${form.name}` : 'Додати країну'} hint={editing || form.name ? undefined : 'Почніть вводити назву й виберіть країну — назви, «Робота в …», прапор і адреса сторінки заповняться самі.'}>
        {!editing && !form.name && (
          <CountryPicker
            exclude={taken}
            initial={initialName}
            autoFocus={Boolean(initialName)}
            onPick={(p) => { setForm({ ...EMPTY, ...p }); setManual(false); setMsg(null) }}
            onManual={(name) => { setForm({ ...EMPTY, ...guessCountry(name) }); setManual(true); setMsg(null) }}
          />
        )}

        {!editing && form.name && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand-50 p-4">
            <span className="text-4xl" aria-hidden>{form.code ? flagOf(form.code) : '🏳️'}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold">{form.name}{form.nameRu && <span className="font-normal text-muted"> · {form.nameRu}</span>}</span>
              <span className="block text-sm text-ink-2">«Робота {form.inName || '…'}» · «Работа {form.inNameRu || '…'}»</span>
              <span className="block font-mono text-sm text-brand-700">/vacancies/{form.slug || '…'}</span>
            </span>
          </div>
        )}

        {(editing || form.name) && (
          <details open={Boolean(editing) || manual} className="rounded-2xl border border-line p-4">
            <summary className="cursor-pointer font-semibold">{editing || manual ? 'Назви й адреса сторінки' : 'Змінити назви чи адресу'} {manual && <span className="text-sm font-normal text-danger">— заповніть російською та код країни</span>}</summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="label">Назва українською *</span><input className="field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Австрія" /></label>
                <label className="block"><span className="label">Назва російською *</span><input className="field" value={form.nameRu} onChange={(e) => set('nameRu', e.target.value)} placeholder="Австрия" /></label>
                <label className="block">
                  <span className="label">«Робота …» українською *</span>
                  <input className="field" value={form.inName} onChange={(e) => set('inName', e.target.value)} placeholder="в Австрії" />
                  <span className="mt-1 block text-xs text-muted">Як у фразі «Робота в Австрії», «Робота на Мальті».</span>
                </label>
                <label className="block">
                  <span className="label">«Работа …» російською *</span>
                  <input className="field" value={form.inNameRu} onChange={(e) => set('inNameRu', e.target.value)} placeholder="в Австрии" />
                </label>
                <label className="block">
                  <span className="label">Код країни *</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden>{flagOf(form.code)}</span>
                    <input className="field font-mono lowercase" maxLength={2} value={form.code} onChange={(e) => set('code', e.target.value.toLowerCase().replace(/[^a-z]/g, ''))} placeholder="at" />
                  </div>
                  <span className="mt-1 block text-xs text-muted">Дві латинські літери, як у доменах (at, es, lv). З нього й прапор.</span>
                </label>
                <label className="block">
                  <span className="label">Адреса сторінки країни *</span>
                  <div className="flex items-center gap-1 font-mono text-sm"><span className="text-muted">/vacancies/</span><input className="field font-mono" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="austria" /></div>
                  {editing && <span className="mt-1 block text-xs text-muted">Після зміни старе посилання на сторінку країни перестане працювати.</span>}
                </label>
              </div>

              <details className="rounded-2xl border border-line p-4">
                <summary className="cursor-pointer font-semibold">Тексти сторінки країни <span className="text-sm font-normal text-muted">(необов’язково — є готовий шаблон)</span></summary>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {(['uk', 'ru'] as const).map((lang) => (
                    <div key={lang} className="space-y-3">
                      <p className="text-sm font-bold">{lang === 'uk' ? 'Українською' : 'Російською'}</p>
                      <label className="block"><span className="label">Заголовок для Google</span><input className="field" value={form.seo?.[lang]?.title ?? ''} onChange={(e) => setSeo(lang, 'title', e.target.value)} placeholder={tpl[lang].title} /></label>
                      <label className="block"><span className="label">Опис для Google</span><textarea className="field min-h-20" value={form.seo?.[lang]?.description ?? ''} onChange={(e) => setSeo(lang, 'description', e.target.value)} placeholder={tpl[lang].description} /></label>
                      <label className="block"><span className="label">Текст під заголовком</span><textarea className="field min-h-20" value={form.seo?.[lang]?.text ?? ''} onChange={(e) => setSeo(lang, 'text', e.target.value)} placeholder={tpl[lang].text} /></label>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted">Порожні поля — сайт підставить сірий текст із шаблону.</p>
              </details>
            </div>
          </details>
        )}

        {msg && <p role={msg.ok ? 'status' : 'alert'} className={`rounded-xl px-3 py-2 text-sm font-semibold ${msg.ok ? 'bg-brand-100 text-brand-700' : 'bg-danger/10 text-danger'}`}>{msg.text}</p>}

        <div className="flex flex-wrap gap-2">
          {(editing || form.name) && (
            <button type="button" onClick={save} disabled={busy || !form.name} className="btn-accent !px-6">{busy ? 'Зберігаємо…' : editing ? 'Зберегти' : 'Додати країну'}</button>
          )}
          {(editing || form.name) && (
            <button type="button" className="btn-ghost" onClick={reset}>{editing ? 'Скасувати' : 'Інша країна'}</button>
          )}
        </div>
      </Card>

      <Card title="Країни на сайті" hint="Дев’ять основних країн вбудовані в сайт (у них свої тексти). Додані вами можна змінити або видалити, якщо в них немає вакансій.">
        <ul className="divide-y divide-line">
          {rows.map((c) => (
            <li key={c.code} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
              <span className="text-2xl" aria-hidden>{c.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{c.name} <span className="font-normal text-muted">· {c.nameRu}</span></span>
                <span className="block text-sm text-muted">
                  {c.active} активних{c.hidden ? `, ${c.hidden} прихованих` : ''} · {c.active ? 'є у фільтрі' : 'у фільтрі з’явиться з першою активною вакансією'}
                </span>
              </span>
              <a href={c.path} target="_blank" className="py-2 text-sm font-semibold text-brand-700 hover:underline">{c.path} ↗</a>
              {c.custom ? (
                <>
                  <button type="button" className="btn-ghost !px-4 !py-2 !text-sm" onClick={() => { setForm(input(c)); setEditing(c.code); setManual(false); setMsg(null); scrollTo({ top: 0, behavior: 'smooth' }) }}>Змінити</button>
                  <button type="button" disabled={busy} className="btn !bg-danger/10 !px-4 !py-2 !text-sm text-danger" onClick={() => remove(c)}>Видалити</button>
                </>
              ) : (
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">основна</span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
