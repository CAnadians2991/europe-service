import { Breadcrumbs } from '@/components/vacancy/CatalogPage'

/**
 * Head of a content page — the same language as `CatalogHero`: a white sheet, mono crumbs, the display H1, a lead line,
 * the 3-px rule in the logo gradient at the bottom. `children` sit under the lead (figures, a licence line, buttons).
 */
export function PageHero({ title, text, crumbs, children }: { title: string; text?: string; crumbs: { name: string; path: string }[]; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-white">
      <div className="container-x relative pb-8 pt-2 sm:pb-10">
        <div className="text-ink-2">
          <Breadcrumbs items={crumbs} />
        </div>
        <h1 className="mt-2 max-w-4xl text-[27px] min-[380px]:text-[30px] sm:text-[44px]">{title}</h1>
        {text && <p className="mt-4 max-w-3xl text-[16.5px] leading-relaxed text-ink-2">{text}</p>}
        {children}
      </div>
      <div className="rule-grad" />
    </section>
  )
}
