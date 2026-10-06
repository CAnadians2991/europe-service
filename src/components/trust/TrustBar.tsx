import Link from 'next/link'
import { IconPin, IconShield } from '@/components/ui/icons'

/** Thin strip above the header: the first thing a cautious candidate should see */
export function TrustBar({ lang = 'uk' }: { lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <div className="brand-band text-white">
      <div className="container-x flex h-11 items-center gap-4 text-[12.5px] font-medium">
        <span className="flex min-w-0 items-center gap-1.5">
          <IconShield className="size-4 shrink-0" />
          <span className="truncate">
            {uk ? (<><span className="min-[360px]:hidden">Ліцензія № 223</span><span className="hidden min-[360px]:inline">Ліцензоване агентство · № 223</span></>) : 'Лицензия № 223'}
            <span className="hidden sm:inline"> {uk ? 'від 15.02.2019 · ЄДРПОУ 42515343' : 'от 15.02.2019 · ЕГРПОУ 42515343'}</span>
          </span>
        </span>
        <span className="hidden items-center gap-1.5 md:flex">
          <IconPin className="size-4 shrink-0" /> {uk ? `Офіси: Київ, Львів, Рівне, Житомир, Одеса` : 'Офисы: Киев, Львов, Ровно, Житомир, Одесса'}
        </span>
        <Link href={uk ? '/about#perelik' : '/ru/about#perelik'} className="ml-auto flex h-11 shrink-0 items-center px-1 font-bold underline decoration-white/60 underline-offset-2 hover:decoration-white">
          {uk ? 'Перевірити' : 'Проверить'}
        </Link>
      </div>
    </div>
  )
}
