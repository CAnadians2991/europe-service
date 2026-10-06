import 'server-only'
import { hasDb, sql } from './db'
import type { MethodId, PricedLine } from './shop'

export type OrderStatus = 'new' | 'pending' | 'paid' | 'failed' | 'canceled' | 'manual'

export interface Order {
  id: string
  createdAt: string
  status: OrderStatus
  method: MethodId
  amount: number
  parts: number | null
  items: PricedLine[]
  customer: { name: string; phone: string; email?: string; comment?: string }
  lang: 'uk' | 'ru'
  providerRef: string | null
}

type Row = { id: string; created_at: string; status: OrderStatus; method: MethodId; amount: number; parts: number | null; items: PricedLine[]; customer: Order['customer']; lang: 'uk' | 'ru'; provider_ref: string | null }
const toOrder = (r: Row): Order => ({ id: r.id, createdAt: r.created_at, status: r.status, method: r.method, amount: r.amount, parts: r.parts, items: r.items, customer: r.customer, lang: r.lang, providerRef: r.provider_ref })

/** Short, readable order number for the client and the bank: ES-6A1F2C */
export const newOrderId = () => 'ES-' + crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()

export async function createOrder(o: Omit<Order, 'createdAt' | 'providerRef'> & { page?: string; attr?: Record<string, string> }) {
  if (!hasDb) return
  await sql`insert into orders (id, status, method, amount, parts, items, customer, lang, page, attr)
    values (${o.id}, ${o.status}, ${o.method}, ${o.amount}, ${o.parts}, ${JSON.stringify(o.items)}::jsonb, ${JSON.stringify(o.customer)}::jsonb, ${o.lang}, ${o.page ?? null}, ${JSON.stringify(o.attr ?? {})}::jsonb)`
}

export async function setOrder(id: string, patch: { status?: OrderStatus; providerRef?: string; data?: unknown }) {
  if (!hasDb) return
  await sql`update orders set
      status = coalesce(${patch.status ?? null}, status),
      provider_ref = coalesce(${patch.providerRef ?? null}, provider_ref),
      provider_data = coalesce(${patch.data === undefined ? null : JSON.stringify(patch.data)}::jsonb, provider_data),
      updated_at = now()
    where id = ${id}`
}

/** A paid order never goes back to pending/failed because of a late or repeated webhook */
export async function settleOrder(id: string, status: OrderStatus, data: unknown) {
  if (!hasDb) return
  await sql`update orders set status = ${status}, provider_data = ${JSON.stringify(data)}::jsonb, updated_at = now()
    where id = ${id} and (status <> 'paid' or ${status} = 'canceled')`
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!hasDb || !/^ES-[0-9A-F]{8}$/.test(id)) return null
  const rows = (await sql`select id, created_at, status, method, amount, parts, items, customer, lang, provider_ref from orders where id = ${id}`) as Row[]
  return rows[0] ? toOrder(rows[0]) : null
}

export async function orderByRef(ref: string): Promise<Order | null> {
  if (!hasDb) return null
  const rows = (await sql`select id, created_at, status, method, amount, parts, items, customer, lang, provider_ref from orders where provider_ref = ${ref} limit 1`) as Row[]
  return rows[0] ? toOrder(rows[0]) : null
}

export async function listOrders(limit = 200): Promise<(Order & { updatedAt: string })[]> {
  if (!hasDb) return []
  const rows = (await sql`select id, created_at, updated_at, status, method, amount, parts, items, customer, lang, provider_ref from orders order by created_at desc limit ${limit}`) as (Row & { updated_at: string })[]
  return rows.map((r) => ({ ...toOrder(r), updatedAt: r.updated_at }))
}
