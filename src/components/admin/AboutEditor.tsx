'use client'

import { useState, useTransition } from 'react'
import { Photos } from './PhotoUploader'
import { saveAbout } from '@/app/(admin)/admin/actions'
import type { About, TeamMember } from '@/lib/about-types'

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export function AboutEditor({ initial }: { initial: About }) {
  const [a, setA] = useState<About>(initial)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, start] = useTransition()
  const set = <K extends keyof About>(k: K, v: About[K]) => setA((p) => ({ ...p, [k]: v }))
  const setMember = (i: number, m: Partial<TeamMember>) => set('team', a.team.map((x, k) => (k === i ? { ...x, ...m } : x)))
  const move = (i: number, d: number) => {
    const t = [...a.team]
    const j = i + d
    if (j < 0 || j >= t.length) return
    ;[t[i], t[j]] = [t[j], t[i]]
    set('team', t)
  }

  const save = () =>
    start(async () => {
      const r = await saveAbout(a)
      setMsg(r.ok ? { ok: true, text: 'Збережено! Зміни вже на сайті.' } : { ok: false, text: r.error || 'Помилка' })
    })

  return (
    <div className="space-y-5 pb-24">
      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur">
        <h1 className="flex-1 text-lg font-bold sm:text-xl">Команда, офіс, ліцензія</h1>
        <a href="/about" target="_blank" className="btn-ghost !px-4 !py-2.5 !text-sm">Відкрити сторінку ↗</a>
        <button type="button" onClick={save} disabled={saving} className="btn-accent !px-6 !py-2.5">{saving ? 'Зберігаємо…' : 'Зберегти'}</button>
        {msg && <p className={`w-full rounded-xl px-3 py-2 text-sm font-semibold ${msg.ok ? 'bg-brand-100 text-brand-700' : 'bg-danger/10 text-danger'}`}>{msg.text}</p>}
      </div>

      <Card title="1. Команда (менеджери)" hint="Фото — вертикальне, по пояс, на світлому фоні (як для документів, але з усмішкою). Порядок = порядок на сайті. Менеджер без фото не показується.">
        {a.team.map((m, i) => (
          <div key={m.id || i} className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-[180px_1fr]">
            <Photos label="Фото" value={m.photo ? [m.photo] : []} onChange={(x) => setMember(i, { photo: x[0] ?? '' })} folder="team" single />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="label">Ім’я *</span><input className="field" value={m.name} onChange={(e) => setMember(i, { name: e.target.value })} placeholder="Анна" /></label>
              <label className="block"><span className="label">Посада *</span><input className="field" value={m.role} onChange={(e) => setMember(i, { role: e.target.value })} placeholder="Менеджер з працевлаштування в Польщі" /></label>
              <label className="block"><span className="label">Досвід</span><input className="field" value={m.since ?? ''} onChange={(e) => setMember(i, { since: e.target.value })} placeholder="У компанії з 2020 року" /></label>
              <label className="block"><span className="label">Telegram (посилання)</span><input className="field" value={m.telegram ?? ''} onChange={(e) => setMember(i, { telegram: e.target.value })} placeholder="https://t.me/username" /></label>
              <label className="block"><span className="label">Viber (посилання)</span><input className="field" value={m.viber ?? ''} onChange={(e) => setMember(i, { viber: e.target.value })} placeholder="viber://chat?number=%2B380..." /></label>
              <div className="flex items-end gap-2">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn-ghost !px-3 !py-2.5 disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === a.team.length - 1} className="btn-ghost !px-3 !py-2.5 disabled:opacity-30">↓</button>
                <button type="button" onClick={() => set('team', a.team.filter((_, k) => k !== i))} className="btn !bg-danger/10 !px-4 !py-2.5 text-danger">Видалити</button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="chip" onClick={() => set('team', [...a.team, { id: '', name: '', role: '', photo: '' }])}>+ Додати менеджера</button>
      </Card>

      <Card title="2. Офіс" hint="3–6 фото: вхід з вивіскою, зона прийому, менеджери за роботою, консультація з клієнтом. Перше фото — головне.">
        <Photos label="Фото офісу" value={a.officePhotos} onChange={(x) => set('officePhotos', x)} folder="office" />
        <label className="block"><span className="label">Текст про офіс</span><textarea className="field min-h-24" value={a.officeText} onChange={(e) => set('officeText', e.target.value)} /></label>
        <label className="block"><span className="label">Графік роботи</span><input className="field" value={a.hours} onChange={(e) => set('hours', e.target.value)} placeholder="Пн–Пт 9:00–18:00, Сб 10:00–15:00" /></label>
        <label className="block"><span className="label">Відео з офісу (посилання YouTube, необов’язково)</span><input className="field" value={a.video ?? ''} onChange={(e) => set('video', e.target.value)} placeholder="https://youtu.be/..." /></label>
      </Card>

      <Card title="3. Державний перелік і документи" hint="Головний доказ легальності — запис у Переліку Мінекономіки (заповнено нижче). Номер ліцензії вказуйте, ЛИШЕ якщо її видано саме на «ЄВРОПА СЕРВІС УКРАЇНА» (ЄДРПОУ 42515343) — чужу ліцензію показувати не можна: це порушення правил Google Ads і закону про рекламу. Скан (витяг з переліку, договір із закордонним партнером тощо) з’явиться в блоці «Офіційне агентство».">
        <Photos label="Скан документа" value={a.license.scan ? [a.license.scan] : []} onChange={(x) => set('license', { ...a.license, scan: x[0] ?? '' })} folder="license" single />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block"><span className="label">Номер</span><input className="field" value={a.license.number} onChange={(e) => set('license', { ...a.license, number: e.target.value })} /></label>
          <label className="block"><span className="label">Дата</span><input className="field" value={a.license.date} onChange={(e) => set('license', { ...a.license, date: e.target.value })} /></label>
          <label className="block"><span className="label">Хто видав</span><input className="field" value={a.license.issuer} onChange={(e) => set('license', { ...a.license, issuer: e.target.value })} /></label>
        </div>
        <p className="text-sm font-semibold">Запис у державному Переліку Мінекономіки</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block"><span className="label">Назва</span><input className="field" value={a.registry.name} onChange={(e) => set('registry', { ...a.registry, name: e.target.value })} /></label>
          <label className="block"><span className="label">Код ЄДРПОУ</span><input className="field" value={a.registry.code} onChange={(e) => set('registry', { ...a.registry, code: e.target.value })} /></label>
          <label className="block"><span className="label">Дата включення</span><input className="field" value={a.registry.included} onChange={(e) => set('registry', { ...a.registry, included: e.target.value })} /></label>
        </div>
      </Card>
    </div>
  )
}
