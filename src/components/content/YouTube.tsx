'use client'

import { useState } from 'react'

/** Lite embed: a thumbnail until the visitor clicks — no 800 KB of YouTube JS on page load. Square corners, a square play plate. */
export function YouTube({
  id,
  title,
  lang = 'uk',
  vertical,
  start,
  end,
  cover,
}: {
  id: string
  title?: string
  lang?: 'uk' | 'ru'
  /** Shorts (9:16) */
  vertical?: boolean
  /** play only a part of the video, in seconds */
  start?: number
  end?: number
  /** our own cover instead of YouTube's thumbnail (when its auto frames show the wrong person): image + a caption on top */
  cover?: { img: string; title: string; sub?: string }
}) {
  const [play, setPlay] = useState(false)
  return (
    <div className={`relative overflow-hidden bg-ink ${vertical ? 'aspect-[9/16]' : 'my-6 aspect-video'}`}>
      {play ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${start ? `&start=${start}` : ''}${end ? `&end=${end}` : ''}`}
          title={title || (lang === 'uk' ? 'Відео' : 'Видео')}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 !m-0" aria-label={`${lang === 'uk' ? 'Відтворити відео' : 'Воспроизвести видео'}${title ? `: ${title}` : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover?.img ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className={`!m-0 size-full !rounded-none object-cover transition-opacity ${cover ? '' : 'opacity-85 group-hover:opacity-100'}`} />
          {cover && (
            <span className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 to-transparent px-4 pb-10 pt-3 text-left text-white sm:px-5 sm:pt-4">
              <span className="block font-display text-[19px] font-bold leading-tight sm:text-[24px]">{cover.title}</span>
              {cover.sub && <span className="block text-[13.5px] text-white/95 sm:text-[15px]">{cover.sub}</span>}
            </span>
          )}
          {/* with our own cover (a face in the middle) the play plate moves to the corner */}
          <span className={`absolute grid place-items-center bg-brand-600 text-white transition-colors group-hover:bg-brand-700 ${cover ? 'bottom-3 right-3 size-14 sm:bottom-4 sm:right-4' : `left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${vertical ? 'size-14' : 'size-16'}`}`}>
            <svg viewBox="0 0 24 24" className="ml-0.5 size-7" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span aria-hidden className="absolute bottom-0 left-0 bg-ink px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            {vertical ? 'Shorts' : 'YouTube'}
          </span>
        </button>
      )}
    </div>
  )
}
