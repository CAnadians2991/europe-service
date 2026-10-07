import Link from 'next/link'
import { IconShield } from '@/components/ui/icons'

/** Small reassurance line next to forms and prices */
export function LicenseBadge({ className = '', lang = 'uk', dark }: { className?: string; lang?: 'uk' | 'ru'; dark?: boolean }) {
  const uk = lang === 'uk'
  return (
    <p className={`flex items-center gap-2 text-[13px] ${dark ? 'text-white/90' : 'text-ink-2'} ${className}`}>
      <IconShield className={`size-4 shrink-0 ${dark ? 'text-white' : 'text-brand-600'}`} />
      <span>
        {uk ? 'Ліцензоване агентство: ліцензія № 223 від 15.02.2019.' : 'Лицензированное агентство: лицензия № 223 от 15.02.2019.'}{' '}
        <Link href={uk ? '/about#perelik' : '/ru/about#perelik'} className={`font-semibold underline underline-offset-2 ${dark ? 'text-white' : 'text-brand-600'}`}>
          {uk ? 'Перевірити' : 'Проверить'}
        </Link>
      </span>
    </p>
  )
}
