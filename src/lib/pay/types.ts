import type { MethodId, PricedLine } from '@/lib/shop'

export interface OrderForPay {
  id: string
  amount: number // kopecks
  lines: PricedLine[]
  customer: { name: string; phone: string; email?: string }
  lang: 'uk' | 'ru'
  parts?: number
}

/** What the cart does next: open the bank's page, or wait for the client to confirm in the bank app */
export type StartResult =
  | { kind: 'redirect'; url: string; ref: string; data?: unknown }
  | { kind: 'app'; ref: string; data?: unknown; message: string }

export interface Provider {
  id: MethodId
  /** keys present in the environment */
  enabled(): boolean
  /** allowed numbers of payments and minimum sum (kopecks) — installment providers only */
  parts?(): { parts: number[]; min: number }
  start(o: OrderForPay, urls: { result: string; webhook: string }): Promise<StartResult>
}

export class PayError extends Error {
  constructor(
    message: string,
    public detail?: unknown,
  ) {
    super(message)
  }
}

export function numList(s: string | undefined, fallback: number[]) {
  const l = (s ?? '')
    .split(/[,\s]+/)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 1)
    .sort((a, b) => a - b)
  return l.length ? l : fallback
}
