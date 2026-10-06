'use client'

import { useState } from 'react'

/** Lite embed: a thumbnail until the visitor clicks — no 800 KB of YouTube JS on page load. Square corners, a square play plate. */
export function YouTube({ id, title, lang = 'uk', vertical }: { id: string; title?: string; lang?: 'uk' | 'ru'; /** Shorts (9:16) */ vertical?: boolean }) {
  const [play, setPlay] = useState(false)
  return (
    <div className={`relative overflow-hidden bg-ink ${vertical ? 'aspect-[9/16]' : 'my-6 aspect-video'}`}>
      {play ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title || (lang === 'uk' ? 'Відео' : 'Видео')}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 !m-0" aria-label={`${lang === 'uk' ? 'Відтворити відео' : 'Воспроизвести видео'}${title ? `: ${title}` : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="!m-0 size-full !rounded-none object-cover opacity-85 transition-opacity group-hover:opacity-100" />
          <span className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center bg-brand-600 text-white transition-colors group-hover:bg-brand-700 ${vertical ? 'size-14' : 'size-16'}`}>
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
