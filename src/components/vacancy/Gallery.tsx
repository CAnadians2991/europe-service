'use client'

import { useRef, useState } from 'react'
import { src, srcSet } from '@/components/ui/Photo'
import { IconClose } from '@/components/ui/icons'

/** One swipeable strip for all screen sizes (+ thumbnails on desktop) — the hero photo is downloaded once, in the right size */
export function Gallery({ photos, alt, priority, lang = 'uk' }: { photos: string[]; alt: string; priority?: boolean; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const [i, setI] = useState(0)
  const strip = useRef<HTMLDivElement>(null)
  const dlg = useRef<HTMLDialogElement>(null)
  if (!photos.length) return null

  const onScroll = () => {
    const el = strip.current
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth))
  }
  const go = (k: number) => {
    const el = strip.current
    if (el) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' })
    setI(k)
  }

  return (
    <div>
      <div className="relative -mx-4 sm:mx-0">
        <div ref={strip} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none sm:rounded-[24px]">
          {photos.map((p, k) => (
            <button key={p} type="button" onClick={() => dlg.current?.showModal()} className="w-full shrink-0 snap-center" aria-label={`${uk ? 'Збільшити фото' : 'Увеличить фото'} ${k + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src(p, 1200)}
                srcSet={srcSet(p)}
                sizes="(max-width: 640px) 100vw, 760px"
                alt={`${alt} — фото ${k + 1}`}
                width={1200}
                height={800}
                loading={k === 0 && priority ? 'eager' : 'lazy'}
                fetchPriority={k === 0 && priority ? 'high' : undefined}
                decoding="async"
                className="aspect-[4/3] w-full bg-brand-50 object-cover sm:aspect-[16/10]"
              />
            </button>
          ))}
        </div>
        {photos.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-brand-700 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
            {i + 1} / {photos.length}
          </span>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 hidden grid-cols-6 gap-2 sm:grid">
          {photos.slice(0, 12).map((p, k) => (
            <button key={p} type="button" onClick={() => go(k)} aria-label={`${uk ? 'Показати фото' : 'Показать фото'} ${k + 1}`} aria-current={k === i} className="overflow-hidden rounded-xl opacity-70 ring-2 ring-transparent transition hover:opacity-100 aria-[current=true]:opacity-100 aria-[current=true]:ring-brand-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(p, 480)} alt="" width={480} height={320} loading="lazy" className="aspect-[3/2] w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <dialog ref={dlg} aria-label={alt} className="m-auto max-h-[92dvh] w-[min(1100px,96vw)] bg-transparent p-0 backdrop:bg-black/50" onClick={() => dlg.current?.close()}>
        {/* the whole photo closes on tap; the ✕ just makes that obvious */}
        <button type="button" aria-label={uk ? 'Закрити' : 'Закрыть'} className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-black/60 text-white">
          <IconClose className="size-6" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(photos[i], 1200)} alt={alt} loading="lazy" decoding="async" className="mx-auto max-h-[86dvh] w-auto rounded-2xl object-contain" />
        <p className="mt-2 text-center text-sm text-white/80">{uk ? 'Натисніть, щоб закрити' : 'Нажмите, чтобы закрыть'}</p>
      </dialog>
    </div>
  )
}
