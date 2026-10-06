import Link from 'next/link'
import { IconShield } from '@/components/ui/icons'

/** Small reassurance line next to forms and prices */
export function LicenseBadge({ className = '', lang = 'uk', dark }: { className?: string; lang?: 'uk' | 'ru'; dark?: boolean }) {
  const uk = lang === 'uk'
  return (
    <p className={`flex items-center gap-2 text-[13px] ${dark ? 'text-white/90' : 'text-ink-2'} ${className}`}>
      <IconShield className={`size-4 shrink-0 ${dark ? 'text-white' : 'text-brand-600'}`} />
      <span>
        {uk ? 'Офіційне агентство: у державному Переліку Мінекономіки, ЄДРПОУ 42515343.' : 'Официальное агентство: в государственном Перечне Минэкономики, ЕГРПОУ 42515343.'}{' '}
        <Link href={uk ? '/about#perelik' : '/ru/about#perelik'} className={`font-semibold underline underline-offset-2 ${dark ? 'text-white' : 'text-brand-600'}`}>
          {uk ? 'Перевірити' : 'Проверить'}
        </Link>
      </span>
    </p>
  )
}
