import Link from 'next/link'
import { SITE } from '@/lib/site'

/** Register strip above the header: the requisites a cautious candidate checks first */
export function TrustBar({ lang = 'uk' }: { lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <div className="border-b border-line bg-brand-50 text-ink-2">
      <div className="container-x flex h-9 items-center gap-5 font-mono text-[12px] tracking-[0.02em]">
        <Link href={uk ? '/about#perelik' : '/ru/about#perelik'} className="flex min-w-0 items-center gap-2 hover:text-brand-700">
          <span className="size-1.5 shrink-0 bg-brand-500" aria-hidden />
          <span className="truncate">
            {uk ? 'Ліцензія МСП № 223 від 15.02.2019' : 'Лицензия МСП № 223 от 15.02.2019'}
            <span className="hidden sm:inline"> · {uk ? 'ЄДРПОУ' : 'ЕГРПОУ'} {SITE.edrpou}</span>
          </span>
        </Link>
        <span className="hidden text-muted lg:inline">{uk ? 'Київ · Львів · Рівне · Житомир · Одеса' : 'Киев · Львов · Ровно · Житомир · Одесса'}</span>
      </div>
    </div>
  )
}
