import { Breadcrumbs } from '@/components/vacancy/CatalogPage'

export function PageHero({ title, text, crumbs, children }: { title: string; text?: string; crumbs: { name: string; path: string }[]; children?: React.ReactNode }) {
  return (
    <section className="brand-band text-white">
      <div className="container-x pb-10 pt-3 sm:pb-12">
        <div className="text-white">
          <Breadcrumbs items={crumbs} />
        </div>
        <h1 className="mt-1 text-[26px] font-extrabold leading-tight min-[360px]:text-[30px] sm:text-[42px]">{title}</h1>
        {text && <p className="mt-3 max-w-2xl text-[16px] text-white/85">{text}</p>}
        {children}
      </div>
    </section>
  )
}
