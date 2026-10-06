import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { fontVars } from './fonts'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Сторінку не знайдено — Europe Service',
  description: 'Такої сторінки немає. Перегляньте актуальні вакансії Europe Service.',
}

export default function GlobalNotFound() {
  return (
    <html lang="uk" className={fontVars}>
      <body className="flex min-h-dvh flex-col">
        <header className="border-b border-line bg-white">
          <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[72px]">
            <Link href="/" className="flex h-11 items-center" aria-label="Europe Service — на головну">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.svg" alt="Europe Service" width={160} height={43} className="h-[34px] w-auto lg:h-[38px]" />
            </Link>
            <a href={`tel:${SITE.phone}`} className="num hidden h-11 items-center text-[15px] font-semibold text-ink hover:text-brand-700 sm:flex">
              {SITE.phoneDisplay}
            </a>
          </div>
        </header>
        <main className="relative flex flex-1 flex-col overflow-hidden bg-white">
          <span aria-hidden className="grad-text pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 select-none font-display text-[220px] font-bold leading-none tracking-[-0.06em] opacity-[0.16] lg:block">
            404
          </span>
          <div className="container-x relative flex flex-1 flex-col items-start justify-center py-16 sm:py-20">
            <p className="eyebrow">
              <span className="size-2 bg-leaf" aria-hidden />
              Помилка 404
            </p>
            <h1 className="mt-4 max-w-3xl text-[30px] sm:text-[48px]">Такої сторінки немає</h1>
            <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-ink-2">Можливо, вакансію вже закрито або посилання застаріло. Подивіться актуальні пропозиції — щодня додаємо нові.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/vacancies/aktualni_vakansii" className="btn-accent !px-7">
                Усі вакансії
              </Link>
              <Link href="/" className="btn-ghost !px-7">
                На головну
              </Link>
            </div>
            <a href={`tel:${SITE.phone}`} className="num mt-5 inline-flex min-h-11 items-center gap-2 text-[17px] font-semibold text-ink hover:text-brand-700">
              {SITE.phoneDisplay} <span className="font-sans text-[15px] font-normal text-muted">— безкоштовно з усіх операторів</span>
            </a>
          </div>
          <div className="rule-grad" />
        </main>
        <footer className="bg-night py-6 text-white">
          <p className="container-x font-mono text-[12.5px] leading-relaxed text-white/75">
            ТОВ «ЄВРОПА СЕРВІС УКРАЇНА» · ЄДРПОУ {SITE.edrpou} · Ліцензія МСП № 223 від 15.02.2019
          </p>
        </footer>
      </body>
    </html>
  )
}
