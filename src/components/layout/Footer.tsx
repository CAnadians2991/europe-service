import Link from 'next/link'
import { CATALOG_PATH, COUNTRIES, SITE } from '@/lib/site'
import { QuizButton } from '@/components/lead/LeadModal'
import { SocialLinks } from './SocialLinks'
import { LicenseStamp } from '@/components/trust/LicenseStamp'
import type { CountryCode } from '@/lib/types'
import { localHref } from '@/lib/alt-routes'
import { HOME } from '@/lib/content'

export function Footer({ lang = 'uk', counts }: { lang?: 'uk' | 'ru'; counts: Partial<Record<CountryCode, number>> }) {
  const uk = lang === 'uk'
  const year = new Date().getFullYear()
  const home = (uk ? HOME.uk : HOME.ru) ?? {}
  const cities = home.cities?.items ?? []
  const directions = home.audiences?.items ?? []
  const head = 'font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-white/60'
  const a = 'inline-flex min-h-11 items-center text-[15px] text-white/90 underline-offset-[3px] transition hover:text-white hover:underline'
  const popular: [string, string][] = uk
    ? [
        [CATALOG_PATH, 'Усі вакансії'],
        ['/vacancies/varshava', 'Робота у Варшаві'],
        ['/vacancies/vrotslav', 'Робота у Вроцлаві'],
        ['/vacancies/storage', 'Робота на складах'],
        ['/vacancies/married_couple', 'Робота для сімейних пар'],
        ['/countires', 'Корисне про країни'],
        ['/news', 'Новини та статті'],
      ]
    : [
        ['/ru' + CATALOG_PATH, 'Все вакансии'],
        ['/ru/vacancies/varshava', 'Работа в Варшаве'],
        ['/ru/vacancies/vrotslav', 'Работа во Вроцлаве'],
        ['/ru/vacancies/storage', 'Работа на складах'],
        ['/ru/vacancies/married_couple', 'Работа для семейных пар'],
        ['/ru/countires', 'Полезное о странах'],
        ['/ru/news', 'Новости и статьи'],
      ]
  const company: [string, string][] = uk
    ? [
        ['/about', 'Про нас'],
        ['/poslugi', 'Послуги та ціни'],
        ['/robocha-viza-v-polshchu', 'Робоча віза в Польщу'],
        ['/vidguki', 'Відгуки клієнтів'],
        ['/contacts', 'Контакти'],
        ['/spivpratsya', 'Співпраця для бізнесу'],
      ]
    : [
        ['/ru/about', 'О нас'],
        ['/ru/services', 'Услуги и цены'],
        ['/ru/rabochaya-viza-v-polshu', 'Рабочая виза в Польшу'],
        ['/ru/otzyvy', 'Отзывы клиентов'],
        ['/ru/contacts', 'Контакты'],
        ['/ru/sotrudnichestvo', 'Сотрудничество для бизнеса'],
      ]
  return (
    <footer className="mt-auto bg-night pb-[calc(76px+env(safe-area-inset-bottom))] text-white lg:pb-0">
      <div className="rule-grad" />
      <div className="container-x grid gap-8 border-b border-white/10 py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <p className="max-w-2xl font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[36px]">
          {uk ? 'Підберемо офіційну роботу в Європі — під ваш досвід і документи' : 'Подберём официальную работу в Европе — под ваш опыт и документы'}
        </p>
        <div className="flex flex-wrap gap-3">
          <QuizButton id="footer" className="btn-accent !px-7">
            {uk ? 'Підібрати вакансію' : 'Подобрать вакансию'}
          </QuizButton>
          <a href={`tel:${SITE.phone}`} className="btn num border-[1.5px] border-white/40 !px-6 text-white hover:border-white">
            {SITE.phoneDisplay}
          </a>
        </div>
      </div>

      {/* the Tilda home's city and direction links — kept site-wide for the internal links (owner removed them from the home body) */}
      {(cities.length > 0 || directions.length > 0) && (
        <div className="container-x grid gap-6 border-b border-white/10 py-8 lg:grid-cols-2">
          {cities.length > 0 && (
            <div>
              <h2 className={head}>{home.cities?.title ?? (uk ? 'Популярні міста' : 'Популярные города')}</h2>
              <ul className="mt-2 flex flex-wrap gap-x-4">
                {cities.map((c) => (
                  <li key={c.href}>
                    <Link href={c.href} className={a}>
                      {c.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {directions.length > 0 && (
            <div>
              <h2 className={head}>{uk ? 'Напрямки' : 'Направления'}</h2>
              <ul className="mt-2 flex flex-wrap gap-x-4">
                {directions.map((d) => (
                  <li key={d.href + d.title}>
                    <Link href={d.href} className={a}>
                      {d.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-white.png" alt="Europe Service" width={160} height={43} loading="lazy" className="h-10 w-auto" />
          <div className="mt-6 flex items-start gap-4">
            <LicenseStamp lang={lang} uid="footer" className="size-24 shrink-0 text-leaf" />
            <p className="font-mono text-[12.5px] leading-relaxed text-white/75">
              {uk ? 'ТОВ «ЄВРОПА СЕРВІС УКРАЇНА»' : 'ООО «ЕВРОПА СЕРВИС УКРАИНА»'}
              <br />
              {uk ? 'ЄДРПОУ' : 'ЕГРПОУ'} {SITE.edrpou}
              <br />
              {uk ? 'Ліцензія МСП № 223 від 15.02.2019 · у Переліку Мінекономіки' : 'Лицензия МСП № 223 от 15.02.2019 · в Перечне Минэкономики'}
              <br />
              <Link href={uk ? '/declaration' : '/ru/declaration'} className="text-white underline underline-offset-[3px]">
                {uk ? 'Декларація Мінекономіки' : 'Декларация Минэкономики'}
              </Link>
            </p>
          </div>
          <p className={`${head} mt-8`}>{uk ? 'Ми в соцмережах' : 'Мы в соцсетях'}</p>
          <SocialLinks lang={lang} variant="dark" place="footer" className="mt-3 max-w-sm" />
        </div>

        <div>
          <p className={head}>{uk ? 'Країни' : 'Страны'}</p>
          <ul className="mt-3">
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
          <p className={head}>{uk ? 'Популярне' : 'Популярное'}</p>
          <ul className="mt-3">
            {popular.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className={a}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className={`${head} mt-6`}>{uk ? 'Компанія' : 'Компания'}</p>
          <ul className="mt-3">
            {company.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className={a}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={head}>{uk ? 'Контакти' : 'Контакты'}</p>
          <ul className="mt-3 space-y-1">
            <li>
              <a href={`tel:${SITE.phone}`} className="num inline-flex min-h-11 items-center text-[17px] font-semibold text-white hover:underline">
                {SITE.phoneDisplay}
              </a>
              <p className="text-[13px] text-white/60">{uk ? 'безкоштовно з усіх операторів' : 'бесплатно со всех операторов'}</p>
            </li>
            {SITE.phones.map((p) => (
              <li key={p.tel}>
                <a href={`tel:${p.tel}`} className="num inline-flex min-h-11 items-center text-[15px] text-white/90 hover:underline">
                  {p.display}
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${SITE.email}`} className={a}>
                {SITE.email}
              </a>
            </li>
            <li className="pt-2 text-[14px] leading-relaxed text-white/70">
              {uk ? SITE.address.full : SITE.addressRu}
              <br />
              {uk ? 'Також: Львів, Рівне, Житомир, Одеса' : 'Также: Львов, Ровно, Житомир, Одесса'}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 font-mono text-[12.5px] text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {SITE.name} 2018–{year}
          </p>
          <p className="flex flex-wrap items-center gap-x-5">
            <Link href={uk ? '/privacy' : '/ru/privacy'} className="inline-flex min-h-11 items-center hover:text-white">
              {uk ? 'Політика конфіденційності' : 'Политика конфиденциальности'}
            </Link>
            <Link href={uk ? '/oferta' : '/ru/oferta'} className="inline-flex min-h-11 items-center hover:text-white">
              {uk ? 'Договір оферти' : 'Договор оферты'}
            </Link>
            <Link href={uk ? '/user_deal' : '/ru/user_deal'} className="inline-flex min-h-11 items-center hover:text-white">
              {uk ? 'Угода користувача' : 'Пользовательское соглашение'}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
