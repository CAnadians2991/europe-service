import Link from 'next/link'
import { Photo } from '@/components/ui/Photo'
import { IconArrow } from '@/components/ui/icons'
import { YouTube } from './YouTube'
import type { Block } from '@/lib/content'

const fixHref = (h: string) => h.replace(/^https?:\/\/(www\.)?personalwork\.com\.ua/, '') || '/'

/** Renders text with `[label](href)` links (the only markup allowed in content JSON) */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  const rx = /\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = rx.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const href = fixHref(m[2])
    parts.push(
      href.startsWith('/') ? (
        <Link key={k++} href={href}>
          {m[1]}
        </Link>
      ) : (
        <a key={k++} href={href} target="_blank" rel="noopener">
          {m[1]}
        </a>
      ),
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

export function Blocks({ blocks, nested }: { blocks: Block[]; nested?: boolean }) {
  return (
    <div className={nested ? '' : 'prose-pw'}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h2':
            return <h2 key={i}>{b.text}</h2>
          case 'h3':
            return <h3 key={i}>{b.text}</h3>
          case 'p':
            return (
              <p key={i} className="whitespace-pre-line">
                <RichText text={b.text} />
              </p>
            )
          case 'ul':
          case 'ol': {
            const Tag = b.type
            return (
              <Tag key={i}>
                {b.items.map((t, k) => (
                  <li key={k}>
                    <RichText text={t} />
                  </li>
                ))}
              </Tag>
            )
          }
          case 'img':
            return <Photo key={i} base={b.src} alt={b.alt || ''} sizes="(max-width: 768px) 100vw, 760px" className="h-auto w-full !rounded-none bg-surface" />
          case 'quote':
            return (
              <blockquote key={i}>
                {b.speaker && <strong className="mb-1 block text-ink">{b.speaker}:</strong>}
                <span className="whitespace-pre-line">
                  <RichText text={b.text} />
                </span>
              </blockquote>
            )
          case 'details':
            // hairline accordion (as the FAQ): consecutive items share one rule
            return (
              <details key={i} className="group my-6 border-y border-line [&+details]:-mt-6 [&+details]:border-t-0">
                <summary className="flex min-h-14 cursor-pointer list-none items-start gap-4 py-4 text-[17px] font-semibold leading-snug text-ink [&::-webkit-details-marker]:hidden">
                  <span className="flex-1 pt-1">{b.summary}</span>
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center border border-line text-ink transition-colors group-open:border-brand-600 group-open:bg-brand-600 group-open:text-white">
                    <svg viewBox="0 0 24 24" className="size-4 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <div className="pb-5 pr-2 text-[16px] sm:pr-12 [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:border-t-0 [&_h2]:pt-0 [&_h2]:text-[19px] [&_h3]:mt-4 [&_ol]:my-2 [&_p]:my-2 [&_ul]:my-2 [&>div>*:first-child]:mt-0 [&>div>*:last-child]:mb-0">
                  <Blocks blocks={b.blocks} nested />
                </div>
              </details>
            )
          case 'video':
            return <YouTube key={i} id={b.youtube} title={b.title} />
          case 'button': {
            const href = fixHref(b.href)
            if (href.includes('tilda.cc') || href.startsWith('#')) return null
            return href.startsWith('/') ? (
              <p key={i}>
                <Link href={href} className="btn-accent !text-white !no-underline">
                  {b.text} <IconArrow className="size-4" />
                </Link>
              </p>
            ) : (
              <p key={i}>
                <a href={href} target="_blank" rel="noopener" className="btn-accent !text-white !no-underline">
                  {b.text} <IconArrow className="size-4" />
                </a>
              </p>
            )
          }
          default:
            return null
        }
      })}
    </div>
  )
}
