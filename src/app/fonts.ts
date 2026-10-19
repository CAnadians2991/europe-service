import { Wix_Madefor_Display, Wix_Madefor_Text } from 'next/font/google'

/**
 * Europe Service type system (owner 2026-10-19: the new design's faces on the live site)
 * - Wix Madefor Display: headlines and big numbers
 * - Wix Madefor Text: everything else — full Cyrillic (ї є ґ), tabular figures for salaries and phones
 */
export const display = Wix_Madefor_Display({
  subsets: ['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-display-face',
  fallback: ['Arial', 'sans-serif'],
})

export const sans = Wix_Madefor_Text({
  subsets: ['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-text',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
})

export const fontVars = `${display.variable} ${sans.variable}`
