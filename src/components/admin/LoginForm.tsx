'use client'

import { useActionState } from 'react'
import { login } from '@/app/(admin)/admin/actions'

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, null)
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next || '/admin/vacancies'} />
      <label className="block">
        <span className="label">Пароль</span>
        <input name="password" type="password" autoComplete="current-password" required autoFocus className="field" />
      </label>
      {state?.error && <p role="alert" className="border-l-[3px] border-danger bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'Перевіряємо…' : 'Увійти'}</button>
    </form>
  )
}
