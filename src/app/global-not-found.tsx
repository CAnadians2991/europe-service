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
        <header className="brand-band">
          <div className="container-x flex h-16 items-center">
            <Link href="/" className="flex h-11 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-a.svg" alt="Europe Service" width={177} height={39} className="h-8 w-auto" />
            </Link>
          </div>
        </header>
        <main className="container-x flex flex-1 flex-col items-start justify-center py-20">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-600">Помилка 404</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Такої сторінки немає</h1>
          <p className="mt-3 max-w-lg text-ink-2">Можливо, вакансію вже закрито або посилання застаріло. Подивіться актуальні пропозиції — щодня додаємо нові.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/vacancies/all" className="btn-primary">Усі вакансії</Link>
            <Link href="/" className="btn-ghost">На головну</Link>
          </div>
          <a href={`tel:${SITE.phone}`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-2">
            Або зателефонуйте: {SITE.phoneDisplay}
          </a>
        </main>
      </body>
    </html>
  )
}
