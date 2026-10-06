import Link from 'next/link'
import { logout } from '@/app/(admin)/admin/actions'

export function AdminNav({ active }: { active: 'vacancies' | 'leads' | 'about' | 'files' | 'countries' }) {
  const item = (href: string, label: string, on: boolean) => (
    <Link href={href} className={`shrink-0 rounded-full px-3 py-2 text-[14px] font-semibold sm:px-4 sm:text-[15px] ${on ? 'bg-white text-brand-700' : 'text-white/90 hover:bg-white/15'}`}>{label}</Link>
  )
  return (
    <header className="brand-band sticky top-0 z-30 text-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-1 overflow-x-auto px-3 scrollbar-none sm:gap-2 sm:px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/icon-192.png" alt="" width={36} height={36} className="mr-1 size-8 shrink-0 rounded-xl sm:mr-2 sm:size-9" />
        {item('/admin/vacancies', 'Вакансії', active === 'vacancies')}
        {item('/admin/leads', 'Заявки', active === 'leads')}
        {item('/admin/countries', 'Країни', active === 'countries')}
        {item('/admin/about', 'Компанія', active === 'about')}
        {item('/admin/files', 'Файли', active === 'files')}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <a href="/" target="_blank" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/15 sm:block">Відкрити сайт ↗</a>
          <form action={logout}>
            <button className="rounded-full px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/15">Вийти</button>
          </form>
        </div>
      </div>
    </header>
  )
}
