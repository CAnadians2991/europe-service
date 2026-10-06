import Link from 'next/link'
import { Photo } from '@/components/ui/Photo'
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
            return <Photo key={i} base={b.src} alt={b.alt || ''} sizes="(max-width: 768px) 100vw, 760px" className="h-auto w-full" />
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
            return (
              <details key={i} className="group my-4 rounded-2xl bg-white ring-1 ring-line [&_*]:my-2">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {b.summary}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 transition group-open:rotate-45 group-open:bg-brand-600 group-open:text-white" aria-hidden>+</span>
                </summary>
                <div className="px-5 pb-4">
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
                <Link href={href} className="btn-primary !text-white !no-underline">
                  {b.text}
                </Link>
              </p>
            ) : (
              <p key={i}>
                <a href={href} target="_blank" rel="noopener" className="btn-primary !text-white !no-underline">
                  {b.text}
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
