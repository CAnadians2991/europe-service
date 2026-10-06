import { Golos_Text, IBM_Plex_Mono, Unbounded } from 'next/font/google'

/**
 * Europe Service type system
 * - Unbounded: wide display grotesk for headlines and big numbers (Cyrillic incl. ї є ґ)
 * - Golos Text: Cyrillic-first text face — very legible on phones
 * - IBM Plex Mono: figures and requisites (salaries, licence, ЄДРПОУ, phones) — the «official register» voice
 */
export const display = Unbounded({
  subsets: ['cyrillic', 'latin', 'latin-ext'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display-face',
  fallback: ['Arial', 'sans-serif'],
})

export const sans = Golos_Text({
  subsets: ['cyrillic', 'latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-text',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
})

export const mono = IBM_Plex_Mono({
  subsets: ['cyrillic', 'latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-mono-face',
  preload: false,
  fallback: ['ui-monospace', 'Menlo', 'monospace'],
})

export const fontVars = `${display.variable} ${sans.variable} ${mono.variable}`
