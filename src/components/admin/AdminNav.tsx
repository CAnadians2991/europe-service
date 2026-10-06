import Link from 'next/link'
import { logout } from '@/app/(admin)/admin/actions'

type Section = 'vacancies' | 'leads' | 'about' | 'files' | 'countries'

const ITEMS: [Section, string, string][] = [
  ['vacancies', '/admin/vacancies', 'Вакансії'],
  ['countries', '/admin/countries', 'Країни'],
  ['leads', '/admin/leads', 'Заявки'],
  ['about', '/admin/about', 'Компанія'],
  ['files', '/admin/files', 'Файли'],
]

/** White bar with hairline, like the site header; the active section is underlined in green. Scrolls sideways on a phone. */
export function AdminNav({ active }: { active: Section }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="rule-grad" />
      <div className="mx-auto flex h-14 max-w-[1240px] items-stretch gap-1 px-3 sm:gap-2 sm:px-4">
        <Link href="/admin/vacancies" className="mr-1 flex shrink-0 items-center gap-2 sm:mr-3" aria-label="Адмінка Europe Service">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon-192.png" alt="" width={32} height={32} className="size-8" />
          <span className="hidden font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted lg:block">Адмінка</span>
        </Link>
        <nav aria-label="Розділи адмінки" className="flex min-w-0 flex-1 items-stretch overflow-x-auto scrollbar-none">
          {ITEMS.map(([key, href, label]) => {
            const on = key === active
            return (
              <Link
                key={key}
                href={href}
                aria-current={on ? 'page' : undefined}
                className={`relative flex shrink-0 items-center px-2.5 text-[15px] font-medium transition-colors sm:px-3.5 ${on ? 'text-ink' : 'text-muted hover:text-ink'} after:absolute after:inset-x-2.5 after:bottom-0 after:h-[3px] sm:after:inset-x-3.5 ${on ? 'after:bg-brand-600' : 'after:bg-transparent'}`}
              >
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <a href="/" target="_blank" className="hidden px-2.5 py-2 text-[14px] font-medium text-muted hover:text-ink sm:block">Сайт ↗</a>
          <form action={logout}>
            <button className="px-2.5 py-2 text-[14px] font-medium text-muted hover:text-danger">Вийти</button>
          </form>
        </div>
      </div>
    </header>
  )
}
