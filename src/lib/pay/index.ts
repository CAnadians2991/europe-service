import 'server-only'
import type { MethodId, MethodInfo } from '@/lib/shop'
import { monopay } from './monopay'
import { monoparts } from './monoparts'
import { privatparts } from './privatparts'
import type { Provider } from './types'

export const PROVIDERS: Record<Exclude<MethodId, 'manual'>, Provider> = { monopay, monoparts, privatparts }

/** What the cart may offer right now (keys in env); «manual» = the order is saved and a manager sends the payment */
export function methods(): MethodInfo[] {
  const list: MethodInfo[] = (['monopay', 'monoparts', 'privatparts'] as const).map((id) => {
    const p = PROVIDERS[id]
    return { id, enabled: p.enabled(), ...(p.parts ? p.parts() : {}) }
  })
  list.push({ id: 'manual', enabled: !list.some((m) => m.enabled && m.id === 'monopay') })
  return list
}
