import Link from 'next/link'
import { SITE } from '@/lib/site'

/** Register strip above the header: the requisites a cautious candidate checks first */
export function TrustBar({ lang = 'uk' }: { lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <div className="bg-night text-white/80">
      <div className="container-x flex h-9 items-center gap-5 font-mono text-[12px] tracking-[0.02em]">
        <Link href={uk ? '/about#perelik' : '/ru/about#perelik'} className="flex min-w-0 items-center gap-2 hover:text-white">
          <span className="size-1.5 shrink-0 bg-leaf" aria-hidden />
          <span className="truncate">
            {uk ? 'Ліцензія МСП № 223 від 15.02.2019' : 'Лицензия МСП № 223 от 15.02.2019'}
            <span className="hidden sm:inline"> · {uk ? 'ЄДРПОУ' : 'ЕГРПОУ'} {SITE.edrpou}</span>
          </span>
        </Link>
        <span className="hidden text-white/60 lg:inline">{uk ? 'Київ · Львів · Рівне · Житомир · Одеса' : 'Киев · Львов · Ровно · Житомир · Одесса'}</span>
        <a href={`tel:${SITE.phone}`} className="ml-auto hidden shrink-0 items-center gap-2 hover:text-white md:flex">
          {SITE.phoneDisplay} <span className="text-white/55">{uk ? '— безкоштовно' : '— бесплатно'}</span>
        </a>
      </div>
    </div>
  )
}
