'use client'

import { useState, useTransition } from 'react'
import { Photos } from './PhotoUploader'
import { saveAbout } from '@/app/(admin)/admin/actions'
import type { About, TeamMember } from '@/lib/about-types'
import { Notice, Panel } from './ui'

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
      <div className="sticky top-[59px] z-20 -mx-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-cream/95 px-4 py-2.5 backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">04 — Компанія</p>
          <h1 className="mt-0.5 truncate text-[20px] leading-tight sm:text-[22px]">Команда, офіс, ліцензія</h1>
        </div>
        <a href="/about" target="_blank" className="btn-ghost !min-h-11 !px-3.5 !text-[14px]">Сторінка ↗</a>
        <button type="button" onClick={save} disabled={saving} className="btn-accent !min-h-11 !px-6">{saving ? 'Зберігаємо…' : 'Зберегти'}</button>
        {msg && <Notice tone={msg.ok ? 'ok' : 'err'} className="w-full">{msg.text}</Notice>}
      </div>

      <Panel n="01" title="Команда (менеджери)" hint="Фото — вертикальне, по пояс, на світлому фоні (як для документів, але з усмішкою). Порядок = порядок на сайті. Менеджер без фото не показується.">
        {a.team.map((m, i) => (
          <div key={m.id || i} className="grid gap-4 border border-line p-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-4">
            <Photos label="Фото" value={m.photo ? [m.photo] : []} onChange={(x) => setMember(i, { photo: x[0] ?? '' })} folder="team" single />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="label">Ім’я *</span><input className="field" value={m.name} onChange={(e) => setMember(i, { name: e.target.value })} placeholder="Анна" /></label>
              <label className="block"><span className="label">Посада *</span><input className="field" value={m.role} onChange={(e) => setMember(i, { role: e.target.value })} placeholder="Менеджер з працевлаштування в Польщі" /></label>
              <label className="block"><span className="label">Досвід</span><input className="field" value={m.since ?? ''} onChange={(e) => setMember(i, { since: e.target.value })} placeholder="У компанії з 2020 року" /></label>
              <label className="block"><span className="label">Telegram (посилання)</span><input className="field" value={m.telegram ?? ''} onChange={(e) => setMember(i, { telegram: e.target.value })} placeholder="https://t.me/username" /></label>
              <label className="block"><span className="label">Viber (посилання)</span><input className="field" value={m.viber ?? ''} onChange={(e) => setMember(i, { viber: e.target.value })} placeholder="viber://chat?number=%2B380..." /></label>
              <div className="flex items-end gap-2">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn-ghost !min-h-11 !px-3.5 disabled:opacity-30" aria-label="Вище">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === a.team.length - 1} className="btn-ghost !min-h-11 !px-3.5 disabled:opacity-30" aria-label="Нижче">↓</button>
                <button type="button" onClick={() => set('team', a.team.filter((_, k) => k !== i))} className="btn-ghost !min-h-11 !px-4 !text-danger">Видалити</button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="chip" onClick={() => set('team', [...a.team, { id: '', name: '', role: '', photo: '' }])}>+ Додати менеджера</button>
      </Panel>

      <Panel n="02" title="Офіс" hint="3–6 фото: вхід з вивіскою, зона прийому, менеджери за роботою, консультація з клієнтом. Перше фото — головне.">
        <Photos label="Фото офісу" value={a.officePhotos} onChange={(x) => set('officePhotos', x)} folder="office" />
        <label className="block"><span className="label">Текст про офіс</span><textarea className="field min-h-24" value={a.officeText} onChange={(e) => set('officeText', e.target.value)} /></label>
        <label className="block"><span className="label">Графік роботи</span><input className="field" value={a.hours} onChange={(e) => set('hours', e.target.value)} placeholder="Пн–Пт 9:00–18:00, Сб 10:00–15:00" /></label>
        <label className="block"><span className="label">Відео з офісу (посилання YouTube, необов’язково)</span><input className="field" value={a.video ?? ''} onChange={(e) => set('video', e.target.value)} placeholder="https://youtu.be/..." /></label>
      </Panel>

      <Panel n="03" title="Ліцензія, перелік і документи" hint="Ліцензія Мінсоцполітики № 223 від 15.02.2019 видана ТОВ «ЄВРОПА СЕРВІС УКРАЇНА» (ЄДРПОУ 42515343) — вона показується в блоці «Ліцензія та декларація», на головній і в футері. Скан ліцензії (за бажанням) замінить таблицю реквізитів. Дату включення до Переліку Мінекономіки вкажіть, коли звірите її в реєстрі data.gov.ua.">
        <Photos label="Скан документа" value={a.license.scan ? [a.license.scan] : []} onChange={(x) => set('license', { ...a.license, scan: x[0] ?? '' })} folder="license" single />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block"><span className="label">Номер</span><input className="field" value={a.license.number} onChange={(e) => set('license', { ...a.license, number: e.target.value })} /></label>
          <label className="block"><span className="label">Дата</span><input className="field" value={a.license.date} onChange={(e) => set('license', { ...a.license, date: e.target.value })} /></label>
          <label className="block"><span className="label">Хто видав</span><input className="field" value={a.license.issuer} onChange={(e) => set('license', { ...a.license, issuer: e.target.value })} /></label>
        </div>
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Запис у державному Переліку Мінекономіки</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block"><span className="label">Назва</span><input className="field" value={a.registry.name} onChange={(e) => set('registry', { ...a.registry, name: e.target.value })} /></label>
          <label className="block"><span className="label">Код ЄДРПОУ</span><input className="field" value={a.registry.code} onChange={(e) => set('registry', { ...a.registry, code: e.target.value })} /></label>
          <label className="block"><span className="label">Дата включення</span><input className="field" value={a.registry.included} onChange={(e) => set('registry', { ...a.registry, included: e.target.value })} /></label>
        </div>
      </Panel>
    </div>
  )
}
