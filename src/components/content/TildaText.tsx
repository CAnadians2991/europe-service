import { Blocks } from './Blocks'
import type { Block } from '@/lib/content'

/**
 * The text an old Tilda page had (its SEO copy, owner 2026-10: kept one-to-one) as a section of a redesigned page:
 * a label column and the text with its own headings. `skip` drops a leading heading the page already shows (its H1).
 */
export function TildaText({ label, blocks, skip }: { label: string; blocks: Block[]; skip?: string }) {
  const first = blocks[0] as { type: string; text?: string } | undefined
  const list = skip && first && /^h[23]$/.test(first.type) && first.text?.trim().toLowerCase() === skip.trim().toLowerCase() ? blocks.slice(1) : blocks
  if (!list.length) return null
  return (
    <section className="container-x grid gap-6 border-t border-line py-14 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8" aria-label={label}>
      <p className="eyebrow self-start lg:pt-1">{label}</p>
      <div className="max-w-3xl [&>.prose-pw>*:first-child]:mt-0">
        <Blocks blocks={list} />
      </div>
    </section>
  )
}
