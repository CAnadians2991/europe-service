'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteFile } from '@/app/(admin)/admin/actions'
import { FILE_ACCEPT, FILE_MAX_BYTES, FILE_MAX_MB, FILE_TYPES, FILES_PREFIX, fileExt, type AdminFile } from '@/lib/admin-files'
import { Confirm, Notice, PageHead, fmtDate } from './ui'

const size = (n: number) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} КБ` : `${(n / 1048576).toFixed(1).replace('.', ',')} МБ`)

const KIND: Record<string, [string, string]> = {
  pdf: ['PDF', 'bg-danger text-white'],
  doc: ['DOC', 'bg-sky-700 text-white'],
  docx: ['DOC', 'bg-sky-700 text-white'],
  xls: ['XLS', 'bg-brand-700 text-white'],
  xlsx: ['XLS', 'bg-brand-700 text-white'],
}

type Job = { name: string; pct: number; error?: string; done?: boolean }

/** POST to /admin/files/upload with progress (fetch has no upload progress) */
function sendFile(f: File, onPct: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/admin/files/upload')
    xhr.upload.onprogress = (e) => e.lengthComputable && onPct(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText)))
    xhr.onerror = () => reject(new Error('network'))
    const fd = new FormData()
    fd.append('file', f)
    xhr.send(fd)
  })
}

export function FilesManager({ files }: { files: AdminFile[] | null }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [copied, setCopied] = useState('')
  const [confirm, setConfirm] = useState<AdminFile | null>(null)
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()
  const busy = jobs.some((j) => !j.done && !j.error)

  async function send(list: FileList | null) {
    if (!list?.length) return
    const picked = [...list]
    setErr('')
    setJobs(picked.map((f) => ({ name: f.name, pct: 0 })))
    await Promise.all(
      picked.map(async (f, i) => {
        const patch = (p: Partial<Job>) => setJobs((js) => js.map((j, k) => (k === i ? { ...j, ...p } : j)))
        const type = FILE_TYPES[fileExt(f.name)]
        if (!type) return patch({ error: 'Такий тип файлу не підтримується. Можна: PDF, DOC/DOCX, XLS/XLSX, JPG, PNG, WebP.' })
        if (!f.size) return patch({ error: 'Файл порожній.' })
        if (f.size > FILE_MAX_BYTES) return patch({ error: `Завеликий файл (${size(f.size)}). Можна до ${FILE_MAX_MB} МБ — стисніть його або розділіть на частини.` })
        try {
          await sendFile(f, (pct) => patch({ pct }))
          patch({ done: true, pct: 100 })
        } catch (e) {
          console.error(e)
          patch({ error: 'Не вдалося завантажити. Перевірте інтернет і спробуйте ще раз; якщо не допоможе — оновіть сторінку (можливо, треба увійти знову).' })
        }
      }),
    )
    if (input.current) input.current.value = ''
    router.refresh()
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(url)
      setTimeout(() => setCopied((c) => (c === url ? '' : c)), 2500)
    } catch {
      window.prompt('Скопіюйте посилання:', url)
    }
  }

  const remove = (f: AdminFile) =>
    start(async () => {
      const r = await deleteFile(f.url)
      setConfirm(null)
      if (!r.ok) setErr(r.error || 'Не вдалося видалити файл')
      router.refresh()
    })

  const name = (f: AdminFile) => f.pathname.slice(FILES_PREFIX.length)
  /** without Blob's random suffix: dohovir-2026-jsuYdOiLmTQGBbhu….pdf → dohovir-2026.pdf */
  const short = (f: AdminFile) => name(f).replace(/-[A-Za-z0-9]{16,}(\.[a-z]+)$/, '$1')

  return (
    <div className={`space-y-4 ${pending ? 'opacity-80 transition' : ''}`}>
      <PageHead
        eyebrow="05 — Файли"
        title="Файли"
        sub={<>Зразки договорів, прайси, документи для статей і вакансій. PDF, DOC/DOCX, XLS/XLSX, JPG, PNG, WebP — до <span className="num">{FILE_MAX_MB}</span> МБ. Посилання відкривається для всіх, у кого воно є.</>}
        actions={
          <button type="button" className="btn-accent" disabled={busy || !files} onClick={() => input.current?.click()}>
            {busy ? 'Завантаження…' : '+ Завантажити файли'}
          </button>
        }
      />
      <input ref={input} type="file" multiple accept={FILE_ACCEPT} className="hidden" onChange={(e) => send(e.target.files)} />

      {!files && <Notice tone="err">Сховище файлів зараз недоступне (Netlify Blobs). Оновіть сторінку за хвилину.</Notice>}
      {err && <Notice tone="err">{err}</Notice>}

      {jobs.length > 0 && (
        <ul className="card divide-y divide-line">
          {jobs.map((j, i) => (
            <li key={i} className="px-4 py-3 text-[14px]">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-semibold">{j.name}</span>
                <span className={`num shrink-0 text-[13px] font-semibold ${j.error ? 'text-danger' : j.done ? 'text-brand-700' : 'text-muted'}`}>{j.error ? 'помилка' : j.done ? 'готово' : `${j.pct}%`}</span>
              </div>
              {j.error ? (
                <p className="mt-1 text-danger">{j.error}</p>
              ) : (
                <div className="mt-1.5 h-[3px] overflow-hidden bg-line">
                  <div className={`h-full transition-[width] ${j.done ? 'bg-brand-600' : 'bg-sky'}`} style={{ width: `${j.pct}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {files && (
        <ul className="card divide-y divide-line">
          {files.map((f) => {
            const [label, cls] = KIND[fileExt(f.pathname)] ?? ['IMG', 'bg-ink text-white']
            return (
              <li key={f.url} className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap sm:px-4">
                <span className={`num grid h-10 w-12 shrink-0 place-items-center text-[11px] font-semibold ${cls}`}>{label}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink" title={name(f)}>{short(f)}</span>
                  <span className="num block text-[12.5px] text-muted">{size(f.size)} · {fmtDate(f.uploadedAt, true)}</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className="btn-primary !min-h-10 !px-3.5 !text-[14px]" onClick={() => copy(f.url)}>
                    {copied === f.url ? 'Скопійовано' : 'Копіювати посилання'}
                  </button>
                  <a href={f.url} target="_blank" rel="noopener" className="btn-ghost !min-h-10 !px-3.5 !text-[14px]">Відкрити ↗</a>
                  <button type="button" className="btn-ghost !min-h-10 !px-3.5 !text-[14px] !text-danger" onClick={() => setConfirm(f)}>Видалити</button>
                </div>
              </li>
            )
          })}
          {!files.length && <li className="px-4 py-10 text-center text-muted">Файлів поки немає</li>}
        </ul>
      )}

      {confirm && (
        <Confirm title="Видалити файл?" okLabel="Так, видалити" danger busy={pending} onCancel={() => setConfirm(null)} onOk={() => remove(confirm)}>
          <p className="break-words">«{short(confirm)}» буде видалено назавжди. Посилання на нього (на сайті, у статтях, у повідомленнях) перестануть працювати.</p>
        </Confirm>
      )}
    </div>
  )
}
