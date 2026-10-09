import { tildaLd } from '@/lib/seo'

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

/** Tilda's own JSON-LD blocks of an old address (kept next to ours, owner 2026-10) */
export function TildaLd({ path }: { path: string }) {
  return (
    <>
      {tildaLd(path).map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
    </>
  )
}
