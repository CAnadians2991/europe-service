'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteFile } from '@/app/(admin)/admin/actions'
import { FILE_ACCEPT, FILE_MAX_BYTES, FILE_MAX_MB, FILE_TYPES, FILES_PREFIX, fileExt, type AdminFile } from '@/lib/admin-files'

const size = (n: number) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} КБ` : `${(n / 1048576).toFixed(1).replace('.', ',')} МБ`)

const KIND: Record<string, [string, string]> = {
  pdf: ['PDF', 'bg-danger/10 text-danger'],
  doc: ['DOC', 'bg-brand-100 text-brand-800'],
  docx: ['DOC', 'bg-brand-100 text-brand-800'],
  xls: ['XLS', 'bg-ok/12 text-ok'],
  xlsx: ['XLS', 'bg-ok/12 text-ok'],
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
    <div className={pending ? 'opacity-80 transition' : ''}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold">Файли</h1>
          <p className="text-sm text-muted">
            Зразки договорів, прайси, документи для статей і вакансій. PDF, DOC/DOCX, XLS/XLSX, JPG, PNG, WebP — до {FILE_MAX_MB} МБ. Посилання на файл відкривається для всіх, у кого воно є.
          </p>
        </div>
        <button type="button" className="btn-accent !py-3.5" disabled={busy || !files} onClick={() => input.current?.click()}>
          {busy ? 'Завантаження…' : '+ Завантажити файли'}
        </button>
        <input ref={input} type="file" multiple accept={FILE_ACCEPT} className="hidden" onChange={(e) => send(e.target.files)} />
      </div>

      {!files && <p className="mt-4 rounded-2xl bg-danger/10 p-4 text-sm font-semibold text-danger">Сховище файлів зараз недоступне (Netlify Blobs). Оновіть сторінку за хвилину.</p>}
      {err && <p className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm font-semibold text-danger">{err}</p>}

      {jobs.length > 0 && (
        <ul className="mt-4 space-y-3 rounded-3xl bg-white p-4 ring-1 ring-line">
          {jobs.map((j, i) => (
            <li key={i} className="text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-semibold">{j.name}</span>
                <span className={`shrink-0 font-semibold ${j.error ? 'text-danger' : j.done ? 'text-ok' : 'text-muted'}`}>{j.error ? 'Помилка' : j.done ? 'Готово ✓' : `${j.pct}%`}</span>
              </div>
              {j.error ? (
                <p className="mt-1 text-danger">{j.error}</p>
              ) : (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className={`h-full rounded-full transition-[width] ${j.done ? 'bg-ok' : 'bg-brand-600'}`} style={{ width: `${j.pct}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {files && (
        <ul className="mt-5 space-y-2.5">
          {files.map((f) => {
            const [label, cls] = KIND[fileExt(f.pathname)] ?? ['ФОТО', 'bg-sun-100 text-ink']
            return (
              <li key={f.url} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line sm:flex-nowrap">
                <span className={`grid h-12 w-14 shrink-0 place-items-center rounded-xl text-xs font-bold ${cls}`}>{label}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink" title={name(f)}>{short(f)}</span>
                  <span className="block text-sm text-muted">
                    {size(f.size)} · {new Date(f.uploadedAt).toLocaleString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-primary !px-4 !py-2.5 !text-sm" onClick={() => copy(f.url)}>
                    {copied === f.url ? 'Скопійовано ✓' : 'Копіювати посилання'}
                  </button>
                  <a href={f.url} target="_blank" rel="noopener" className="btn-ghost !px-4 !py-2.5 !text-sm">Відкрити ↗</a>
                  <button type="button" className="btn !bg-danger/10 !px-4 !py-2.5 !text-sm text-danger" onClick={() => setConfirm(f)}>Видалити</button>
                </div>
              </li>
            )
          })}
          {!files.length && <li className="rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-line">Файлів поки немає</li>}
        </ul>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-lg font-bold">Видалити файл?</p>
            <p className="mt-2 break-words text-ink-2">«{short(confirm)}» буде видалено назавжди. Посилання на нього (на сайті, у статтях, у повідомленнях) перестануть працювати.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setConfirm(null)}>Скасувати</button>
              <button type="button" className="btn-accent" disabled={pending} onClick={() => remove(confirm)}>Так, видалити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
