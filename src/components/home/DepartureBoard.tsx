import Link from 'next/link'
import { COUNTRY } from '@/lib/site'
import { plural, salaryCompact, salaryMain, vacancyCity } from '@/lib/format'
import type { Vacancy } from '@/lib/types'
import { BoardClock } from './BoardClock'
import { IconArrow } from '@/components/ui/icons'


/** Station-style departure board with real hot vacancies. Plain links/text — fully crawlable and accessible. */
export function DepartureBoard({ items, total, lang = 'uk' }: { items: Vacancy[]; total: number; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <div className="board rounded-[26px] p-3 sm:p-4">
      <div className="flex items-center justify-between px-2 pb-3 pt-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/60">
          {uk ? 'Відправлення' : 'Отправление'} <span className="text-white/50">· Departures</span>
        </p>
        <BoardClock />
      </div>
      <div className="hidden grid-cols-[52px_minmax(0,1.25fr)_minmax(0,0.95fr)_70px] gap-2 px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 sm:grid">
        <span>{uk ? 'Напр.' : 'Напр.'}</span>
        <span>{uk ? 'Вакансія' : 'Вакансия'}</span>
        <span>{uk ? 'Оплата' : 'Оплата'}</span>
        <span className="text-right">{uk ? 'Статус' : 'Статус'}</span>
      </div>
      <ol className="space-y-1.5">
        {items.map((v, i) => (
          <li key={v.id} className="animate-board origin-top" style={{ animationDelay: `${150 + i * 110}ms` }}>
            <Link
              href={v.path}
              className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-white/[0.04] sm:grid-cols-[52px_minmax(0,1.25fr)_minmax(0,0.95fr)_70px]"
            >
              <span className="board-cell text-center text-[15px]">{v.country.toUpperCase()}</span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold text-white">{v.company || v.title}</span>
                <span className="block truncate text-[12px] text-white/50">
                  {vacancyCity(v) || COUNTRY[v.country].name} · <span className="text-brand-100 sm:text-white/50">{salaryMain(v.salary)}</span>
                </span>
              </span>
              <span className="board-cell hidden truncate text-center text-[13px] sm:block">{salaryCompact(v.salary)}</span>
              <span className="hidden items-center justify-end gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#4ade80] sm:flex">
                <span className="size-1.5 rounded-full bg-[#4ade80] animate-[blink_1.6s_ease-in-out_infinite]" /> {uk ? 'Набір' : 'Набор'}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <Link href={uk ? '/vacancies/aktualni_vakansii' : '/ru/vacancies/aktualni_vakansii'} className="mt-3 flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10">
        {uk ? `Усі ${total} ${plural(total, ['вакансія', 'вакансії', 'вакансій'])} на табло` : `Все ${total} ${plural(total, ['вакансия', 'вакансии', 'вакансий'])} на табло`} <IconArrow className="size-4 text-brand-100" />
      </Link>
    </div>
  )
}
