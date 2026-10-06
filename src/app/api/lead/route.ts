import { NextResponse, after, type NextRequest } from 'next/server'
import { z } from 'zod'
import { deliverLead, recentDuplicate, saveLead } from '@/lib/leads'
import { normalizePhone } from '@/lib/format'
import type { Lead } from '@/lib/types'

const Body = z.object({
  name: z.string().max(120).default(''),
  phone: z.string().min(5).max(40),
  form: z.string().max(80).default('unknown'),
  vacancyId: z.string().max(120).optional(),
  vacancyTitle: z.string().max(300).optional(),
  answers: z.record(z.string(), z.string().max(2000)).optional(),
  page: z.string().max(500).default('/'),
  attr: z.record(z.string(), z.string().max(500)).optional(),
  hp: z.string().nullish(),
  t: z.number().optional(),
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  // Bots: honeypot filled or submitted faster than a human could type → pretend success, store nothing
  if (body.hp || (body.t !== undefined && body.t < 1500)) return NextResponse.json({ ok: true, id })

  const phone = normalizePhone(body.phone)
  if (!phone) return NextResponse.json({ ok: false, error: 'phone' }, { status: 422 })

  const a = body.attr ?? {}
  const utm = Object.fromEntries(Object.entries(a).filter(([k]) => k.startsWith('utm_')))
  const lead: Lead = {
    id,
    createdAt: new Date().toISOString(),
    name: body.name.trim(),
    phone,
    form: body.form,
    vacancyId: body.vacancyId,
    vacancyTitle: body.vacancyTitle,
    answers: body.answers,
    page: body.page,
    referrer: a.referrer || req.headers.get('referer') || undefined,
    utm: { ...utm, ...(a.landing ? { landing: a.landing } : {}) },
    gclid: a.gclid,
    gbraid: a.gbraid,
    wbraid: a.wbraid,
    fbclid: a.fbclid,
    status: 'new',
  }

  try {
    const dup = await recentDuplicate(phone, body.vacancyId || null)
    if (dup) return NextResponse.json({ ok: true, id: dup, duplicate: true })
    await saveLead(lead)
  } catch (e) {
    // DB is down: still try to deliver so the lead is not lost
    console.error('[lead] save failed', e)
    const d = await deliverLead(lead)
    if (Object.values(d).includes('ok')) return NextResponse.json({ ok: true, id })
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }

  after(() => deliverLead(lead))
  return NextResponse.json({ ok: true, id })
}
