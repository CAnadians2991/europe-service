import { LoginForm } from '@/components/admin/LoginForm'

export const metadata = { title: 'Вхід' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-[var(--shadow-lift)] ring-1 ring-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="Europe Service" width={160} height={43} className="h-9 w-auto" />
        <h1 className="mt-6 text-2xl font-bold">Вхід в адмінку</h1>
        <p className="mt-1 text-sm text-muted">Керування вакансіями та заявками</p>
        <LoginForm next={next} />
      </div>
    </main>
  )
}
