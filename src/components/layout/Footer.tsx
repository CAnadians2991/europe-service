import Link from 'next/link'
import { COUNTRIES, SITE } from '@/lib/site'
import { IconPhone, IconPin } from '@/components/ui/icons'
import { QuizButton } from '@/components/lead/LeadModal'
import { SocialLinks } from './SocialLinks'
import type { CountryCode } from '@/lib/types'
import { localHref } from '@/lib/alt-routes'

export function Footer({ lang = 'uk', counts }: { lang?: 'uk' | 'ru'; counts: Partial<Record<CountryCode, number>> }) {
  const uk = lang === 'uk'
  const year = new Date().getFullYear()
  const col = 'text-[12px] font-semibold uppercase tracking-[0.18em] text-white/75'
  // 44px rows, full white: dimmed white on the violet end of the gradient fell to ~3:1
  const a = 'inline-flex min-h-11 items-center text-white underline-offset-2 transition hover:underline'
  return (
    <footer className="brand-band mt-auto pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0 text-white">
      <div className="container-x border-b border-white/10 py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={col}>{uk ? 'Готові в дорогу?' : 'Готовы в дорогу?'}</p>
            <p className="mt-3 max-w-xl font-display text-[28px] font-bold leading-[1.1] tracking-tight sm:text-[38px]">
              {uk ? 'Підберемо роботу за 1\u00a0хвилину — і маршрут до першого робочого дня' : 'Подберём работу за 1\u00a0минуту — и маршрут до первого рабочего дня'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <QuizButton id="footer" className="btn-accent !px-7 !py-4 !text-base">{uk ? 'Підібрати вакансію' : 'Подобрать вакансию'}</QuizButton>
            <a href={`tel:${SITE.phone}`} className="btn !px-6 !py-4 !text-base font-bold text-white ring-1 ring-inset ring-white/40 hover:bg-white/10">
              <IconPhone className="size-5" /> {SITE.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-white.png" alt="Europe Service" width={160} height={43} loading="lazy" className="h-10 w-auto" />
          <p className="mt-4 max-w-xs text-[15px] text-white/75">
            {uk ? 'Офіційне кадрове агентство з працевлаштування за кордоном.' : 'Официальное кадровое агентство по трудоустройству за границей.'}
          </p>
          <p className="mt-3 max-w-xs text-sm text-white/55">
            {uk ? SITE.license : SITE.licenseRu}. {uk ? 'ЄДРПОУ' : 'ЕГРПОУ'} {SITE.edrpou}.{' '}
            <Link href="/declaration" className="font-bold text-white underline underline-offset-2">
              {uk ? 'Декларація Мінекономіки' : 'Декларация Минэкономики'}
            </Link>
          </p>
          <p className={`${col} mt-6`}>{uk ? 'Ми в соцмережах' : 'Мы в соцсетях'}</p>
          <SocialLinks lang={lang} variant="dark" place="footer" className="mt-3 max-w-sm" />
        </div>

        <div>
          <p className={col}>{uk ? 'Напрямки' : 'Направления'}</p>
          <ul className="mt-4 space-y-0.5 text-[15px]">
            {COUNTRIES.filter((c) => counts[c.code]).map((c) => (
              <li key={c.code}>
                <Link href={localHref(c.path, lang)} className={a}>
                  {uk ? `Робота ${c.inName}` : `Работа ${c.inNameRu}`}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={col}>{uk ? 'Популярне' : 'Популярное'}</p>
          <ul className="mt-4 space-y-0.5 text-[15px]">
            {(uk
              ? [
                  ['/vacancies/all', 'Усі вакансії'],
                  ['/vacancies/varshava', 'Робота у Варшаві'],
                  ['/vacancies/vrotslav', 'Робота у Вроцлаві'],
                  ['/vacancies/storage', 'Робота на складах'],
                  ['/vacancies/married_couple', 'Робота для сімейних пар'],
                  ['/news', 'Новини та статті'],
                  ['/cooperation', 'Роботодавцям'],
                ]
              : [
                  ['/ru/vacancies/all', 'Все вакансии'],
                  ['/ru/vacancies/varshava', 'Работа в Варшаве'],
                  ['/ru/vacancies/vrotslav', 'Работа во Вроцлаве'],
                  ['/ru/vacancies/storage', 'Работа на складах'],
                  ['/ru/vacancies/married_couple', 'Работа для семейных пар'],
                  ['/ru/news', 'Новости и статьи'],
                ]
            ).map(([href, label]) => (
              <li key={href}>
                <Link href={href} className={a}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={col}>{uk ? 'Контакти' : 'Контакты'}</p>
          <ul className="mt-4 space-y-1 text-[15px]">
            <li>
              <a href={`tel:${SITE.phone}`} className="flex min-h-11 items-center gap-2 font-bold text-white underline-offset-2 hover:underline">
                <IconPhone className="size-5 text-brand-100" /> {SITE.phoneDisplay}
              </a>
            </li>
            <li className="flex gap-2 py-1.5 text-white/80">
              <IconPin className="mt-0.5 size-5 shrink-0 text-brand-100" /> {uk ? SITE.address.full : SITE.addressRu}
            </li>
            <li className="py-1 text-[14px] text-white/80">{uk ? 'Офіси: Київ, Львів, Рівне, Житомир, Одеса' : 'Офисы: Киев, Львов, Ровно, Житомир, Одесса'}</li>
            <li><a href={`mailto:${SITE.email}`} className={a}>{SITE.email}</a></li>
            <li><Link href={uk ? '/contacts' : '/ru/contacts'} className={a}>{uk ? 'Усі контакти' : 'Все контакты'}</Link></li>
            <li><Link href={uk ? '/poslugi' : '/ru/services'} className={a}>{uk ? 'Послуги та ціни' : 'Услуги и цены'}</Link></li>
            <li><Link href={uk ? '/vidguki' : '/ru/otzyvy'} className={a}>{uk ? 'Відгуки клієнтів' : 'Отзывы клиентов'}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <p>© {SITE.name} 2018–{year}. {uk ? 'Усі права захищені.' : 'Все права защищены.'}</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/privacy" className={a}>{uk ? 'Політика конфіденційності' : 'Политика конфиденциальности'}</Link>
            <Link href="/oferta" className={a}>{uk ? 'Договір оферти' : 'Договор оферты'}</Link>
            <Link href="/user_deal" className={a}>{uk ? 'Угода користувача' : 'Пользовательское соглашение'}</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
