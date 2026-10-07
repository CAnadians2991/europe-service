'use client'

import { useRef, useState } from 'react'
import type { VideoCard } from '@/lib/video-reviews'

/**
 * YouTube-style video reviews: the client's frame as the cover, a yellow «ВІДГУК» tag, a big title, the name and the length.
 * Tap → the video plays in a dialog right on the page (no autoplay on the page, nothing loads until tapped).
 */
export function VideoCards({ items, lang, layout = 'grid' }: { items: VideoCard[]; lang: 'uk' | 'ru'; layout?: 'grid' | 'row' }) {
  const uk = lang === 'uk'
  const dlg = useRef<HTMLDialogElement>(null)
  const [cur, setCur] = useState<VideoCard | null>(null)
  const open = (v: VideoCard) => {
    setCur(v)
    dlg.current?.showModal()
  }
  const close = () => {
    dlg.current?.close()
    setCur(null)
  }
  return (
    <>
      <ul className={layout === 'row' ? '-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4'}>
        {items.map((v) => (
          <li key={v.key} className={layout === 'row' ? 'w-[62%] shrink-0 snap-start sm:w-auto' : ''}>
            <button type="button" onClick={() => open(v)} className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-ink text-left" aria-label={`${uk ? 'Дивитися відгук' : 'Смотреть отзыв'}: ${v.name} — ${v.title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.cover} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.15)_0%,transparent_30%,transparent_45%,rgb(0_0_0/0.82)_100%)]" />
              <span className="absolute left-2.5 top-2.5 rounded-md bg-[#FFD400] px-2 py-0.5 text-[11.5px] font-extrabold uppercase tracking-wide text-black sm:text-[12.5px]">{uk ? 'Відгук' : 'Отзыв'}</span>
              <span className="absolute left-1/2 top-[44%] grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600/95 text-white shadow-[0_8px_24px_rgb(0_0_0/0.35)] transition group-hover:scale-110 sm:size-14" aria-hidden>
                <svg viewBox="0 0 24 24" className="ml-0.5 size-6" fill="currentColor">
                  <path d="M8 5.5v13l11-6.5z" />
                </svg>
              </span>
              <span className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-3.5">
                <span className="block font-display text-[17px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em] [text-shadow:0_2px_8px_rgb(0_0_0/0.6)] sm:text-[20px]">{v.title}</span>
                <span className="mt-1.5 flex items-center justify-between gap-2 text-[12.5px] text-white/90 sm:text-[13.5px]">
                  <span className="min-w-0 truncate font-semibold">{[v.name, v.place].filter(Boolean).join(' · ')}</span>
                  {v.dur && <span className="num shrink-0 rounded bg-black/75 px-1.5 py-0.5 text-[11.5px] font-semibold">{v.dur}</span>}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dlg} onClose={() => setCur(null)} onClick={(e) => e.target === dlg.current && close()} className="m-auto max-h-[92dvh] w-[min(92vw,440px)] overflow-visible bg-transparent p-0 backdrop:bg-black/80">
        {cur && (
          <div className="relative">
            <button type="button" onClick={close} aria-label={uk ? 'Закрити' : 'Закрыть'} className="absolute -top-12 right-0 grid size-11 place-items-center rounded-full bg-white/15 text-[24px] leading-none text-white hover:bg-white/25">
              ×
            </button>
            {cur.yt ? (
              <iframe className="aspect-[9/16] max-h-[85dvh] w-full rounded-2xl bg-black" src={`https://www.youtube-nocookie.com/embed/${cur.src}?autoplay=1&rel=0`} title={cur.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : (
              <video src={cur.src} poster={cur.cover} controls autoPlay playsInline className="aspect-[9/16] max-h-[85dvh] w-full rounded-2xl bg-black object-contain" />
            )}
            <p className="mt-3 text-center text-[15px] font-semibold text-white">
              {cur.title} {cur.name && <span className="font-normal text-white/80">— {cur.name}</span>}
            </p>
          </div>
        )}
      </dialog>
    </>
  )
}
