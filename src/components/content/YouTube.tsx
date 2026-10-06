'use client'

import { useState } from 'react'

/** Lite embed: a thumbnail until the visitor clicks — no 800 KB of YouTube JS on page load */
export function YouTube({ id, title, lang = 'uk', vertical }: { id: string; title?: string; lang?: 'uk' | 'ru'; /** Shorts (9:16) */ vertical?: boolean }) {
  const [play, setPlay] = useState(false)
  return (
    <div className={`relative overflow-hidden bg-brand-600 ${vertical ? 'aspect-[9/16]' : 'my-6 aspect-video rounded-2xl'}`}>
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
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="!m-0 size-full !rounded-none object-cover opacity-80 transition group-hover:opacity-100" />
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent-600 text-white shadow-xl transition group-hover:bg-accent-700">
            <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}
