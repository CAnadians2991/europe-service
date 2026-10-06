import { Geologica, Onest } from 'next/font/google'

/**
 * Europe Service type system (2026-10: the owner found Unbounded + mono hard to read)
 * - Geologica: headlines and big numbers — clear geometric shapes, full Cyrillic incl. ї є ґ, not stretched
 * - Onest: everything else — a Cyrillic-first text face built for screens, tabular figures for salaries and phones
 */
export const display = Geologica({
  subsets: ['cyrillic', 'latin', 'latin-ext'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-display-face',
  fallback: ['Arial', 'sans-serif'],
})

export const sans = Onest({
  subsets: ['cyrillic', 'latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-text',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
})

export const fontVars = `${display.variable} ${sans.variable}`
