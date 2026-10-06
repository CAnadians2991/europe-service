import { LoginForm } from '@/components/admin/LoginForm'

export const metadata = { title: 'Вхід' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4 py-10">
      <div className="w-full max-w-[400px] border border-line bg-white">
        <div className="rule-grad" />
        <div className="p-6 sm:p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt="Europe Service" width={160} height={43} className="h-9 w-auto" />
          <p className="eyebrow mt-8">Адмінка сайту</p>
          <h1 className="mt-2 text-[26px] leading-tight">Вхід</h1>
          <p className="mt-2 text-[15px] text-muted">Вакансії, країни, заявки та файли europeservice.com.ua</p>
          <LoginForm next={next} />
        </div>
        <p className="num border-t border-line px-6 py-3 text-[12px] text-muted sm:px-8">Вхід пам’ятається 30 днів</p>
      </div>
    </main>
  )
}
