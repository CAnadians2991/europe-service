'use client'

import { useRef, useState } from 'react'
import { src } from '@/components/ui/Photo'
import { uploadImage } from '@/app/(admin)/admin/actions'

/** Server actions accept ≤ 4 MB (next.config.ts `bodySizeLimit`; Vercel caps a request at 4.5 MB) */
const MAX_BYTES = 3.8 * 1024 * 1024
const mb = (n: number) => (n / 1048576).toFixed(1).replace('.', ',')
const isHeic = (f: File) => /hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name)

function hasAlpha(px: Uint8ClampedArray) {
  for (let i = 3; i < px.length; i += 4) if (px[i] < 255) return true
  return false
}

/**
 * Downscale on the device before upload (phones make 5–10 MB photos). The browser applies EXIF rotation.
 * Transparent images (logos) stay PNG — JPEG would paint the background black.
 * Returns null when the browser can't decode the file (HEIC in Chrome/Firefox, not an image).
 */
async function shrink(file: File): Promise<Blob | null> {
  if (file.type === 'image/svg+xml') return file
  let bmp: ImageBitmap
  try {
    bmp = await createImageBitmap(file)
  } catch {
    return null
  }
  const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  const ctx = c.getContext('2d')!
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  const alpha = file.type !== 'image/jpeg' && hasAlpha(ctx.getImageData(0, 0, c.width, c.height).data)
  return new Promise((res) => c.toBlob((b) => res(b || file), alpha ? 'image/png' : 'image/jpeg', 0.86))
}

export function Photos({ label, hint, value, onChange, folder, single }: { label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; folder: string; single?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(0)
  const [err, setErr] = useState('')
  const move = (i: number, d: number) => {
    const a = [...value]
    const j = i + d
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    onChange(a)
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return
    setErr('')
    const list = single ? [files[0]] : [...files]
    setBusy(list.length)
    const added: string[] = []
    for (const f of list) {
      try {
        const blob = await shrink(f)
        if (!blob)
          setErr(
            isHeic(f)
              ? `«${f.name}» — формат HEIC (iPhone), цей браузер його не відкриває. Завантажте фото прямо з iPhone (там воно перетвориться на JPG) або збережіть його як JPG.`
              : `«${f.name}» — це не схоже на фото. Підходять JPG, PNG, WebP.`,
          )
        else if (blob.size > MAX_BYTES) setErr(`«${f.name}» завелике навіть після стиснення (${mb(blob.size)} МБ, можна до 3,8 МБ). Зменште фото й спробуйте ще раз.`)
        else {
          const fd = new FormData()
          fd.set('file', blob, f.name.replace(/\.\w+$/, blob.type === 'image/png' ? '.png' : '.jpg'))
          fd.set('folder', folder)
          const r = await uploadImage(fd)
          if (r.ok) added.push(r.base)
          else setErr(r.error)
        }
      } catch {
        setErr(`Не вдалося завантажити «${f.name}». Перевірте інтернет і спробуйте ще раз.`)
      }
      setBusy((b) => b - 1)
    }
    onChange(single ? added.slice(0, 1) : [...value, ...added])
    if (input.current) input.current.value = ''
  }
  return (
    <div>
      <span className="label">{label}</span>
      {hint && <p className="-mt-1 mb-2 text-[13px] text-muted">{hint}</p>}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {value.map((p, i) => (
          <div key={p} className="relative border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(p, 480)} alt="" loading="lazy" className={`aspect-[4/3] w-full ${single ? 'bg-white object-contain p-2' : 'object-cover'}`} />
            {!single && i === 0 && <span className="absolute left-0 top-0 bg-brand-600 px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-white">Головне</span>}
            {/* on the photo, not in the footer: on a phone the footer has room only for ← → ✕ */}
            {!single && i > 0 && (
              <button type="button" onClick={() => onChange([p, ...value.filter((x) => x !== p)])} className="absolute left-0 top-0 bg-white/95 px-2 py-1.5 text-[12px] font-semibold text-brand-700 hover:bg-white">
                Зробити головним
              </button>
            )}
            <div className="flex items-center justify-between gap-1 border-t border-line bg-white p-1">
              {!single && (
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-9 place-items-center text-sm hover:bg-surface disabled:opacity-30" aria-label="Лівіше">←</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="grid size-9 place-items-center text-sm hover:bg-surface disabled:opacity-30" aria-label="Правіше">→</button>
                </div>
              )}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== p))} className="ml-auto grid size-9 shrink-0 place-items-center text-danger hover:bg-danger/5" aria-label="Видалити фото">✕</button>
            </div>
          </div>
        ))}
        {(!single || value.length === 0) && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy > 0}
            className="grid aspect-[4/3] place-items-center border-[1.5px] border-dashed border-line-strong bg-white p-3 text-center text-[14px] font-semibold text-brand-700 hover:border-brand-600 hover:bg-brand-50 disabled:cursor-wait"
          >
            {busy ? `Завантаження… (${busy})` : single ? '+ Завантажити' : '+ Додати фото'}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple={!single} className="hidden" onChange={(e) => upload(e.target.files)} />
      {err && <p className="mt-2 border-l-[3px] border-danger bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">{err}</p>}
    </div>
  )
}
