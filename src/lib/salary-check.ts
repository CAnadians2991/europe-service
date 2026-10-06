import type { Vacancy } from './types'

/**
 * Polish statutory minimum for 2026 (Dz.U. 2025 poz. 1242): 4 806 zł/month, 31,40 zł/h gross.
 * Net thresholds are approximate (what the minimum leaves after ZUS/NFZ/PIT on a regular contract).
 * Update each September when the next year's minimum is published.
 */
export const PL_MIN = { year: 2026, monthGross: 4806, hourGross: 31.4, monthNet: 3600, hourNet: 22.5 }

/** Admin warning: the published rate is below the legal minimum — most likely left over from an older year */
export function belowMinimum(v: Pick<Vacancy, 'country' | 'salary'>): string | null {
  if (v.country !== 'pl') return null
  const s = v.salary
  if (s.currency !== 'PLN') return null
  const n = (x: unknown) => (x === null || x === undefined || x === '' ? null : Number(String(x).replace(',', '.')))
  const h = n(s.hourMin) ?? n(s.hourMax)
  const m = n(s.monthMin) ?? n(s.monthMax)
  const minH = s.net ? PL_MIN.hourNet : PL_MIN.hourGross
  const minM = s.net ? PL_MIN.monthNet : PL_MIN.monthGross
  const kind = s.net ? 'нетто' : 'брутто'
  if (h != null && !Number.isNaN(h) && h < minH) return `${String(h).replace('.', ',')} zł/год ${kind} — нижче мінімальної ставки ${PL_MIN.year} року`
  if (m != null && !Number.isNaN(m) && m < minM) return `${m} zł/міс ${kind} — нижче мінімальної зарплати ${PL_MIN.year} року`
  return null
}
