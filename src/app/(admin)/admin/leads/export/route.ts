import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth'
import { adminLeads } from '@/lib/admin-data'
import { formLabel } from '@/lib/leads'

export const dynamic = 'force-dynamic'

const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export async function GET() {
  if (!(await verifySession((await cookies()).get(ADMIN_COOKIE)?.value))) return new NextResponse('Unauthorized', { status: 401 })
  const leads = await adminLeads(5000)
  const head = ['Дата', 'Ім’я', 'Телефон', 'Форма', 'Вакансія', 'Відповіді', 'Сторінка', 'Статус', 'Нотатка', 'utm_source', 'utm_campaign', 'gclid', 'fbclid']
  const rows = leads.map((l) => [
    new Date(l.created_at).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' }),
    l.name, l.phone, formLabel(l.form), l.vacancy_title ?? '',
    Object.entries(l.answers ?? {}).map(([k, v]) => `${k}: ${v}`).join('; '),
    l.page ?? '', l.status, l.note ?? '', l.utm?.utm_source ?? '', l.utm?.utm_campaign ?? '', l.gclid ?? '', l.fbclid ?? '',
  ])
  const csv = '﻿' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="zayavky-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
