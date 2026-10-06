import localFont from 'next/font/local'

/**
 * Display: Montserrat (the brand font of the logo and the original site), variable 500–800,
 * self-hosted and subset to Ukrainian/Russian Cyrillic + Latin (incl. Polish/Czech letters) — one ~53 KB file.
 * Rebuild: see scripts/fonts/README.md
 */
export const display = localFont({
  src: './_fonts/montserrat-ua.woff2',
  weight: '500 800',
  display: 'swap',
  variable: '--font-display-face',
  fallback: ['Arial', 'sans-serif'],
})

/**
 * Body: Onest — highly legible on phones. Self-hosted variable 400–700, same Cyrillic + Latin subset as Montserrat:
 * one ~31 KB file instead of three Google subsets (~68 KB) competing with the first photo on 4G.
 */
export const sans = localFont({
  src: './_fonts/onest-ua.woff2',
  weight: '400 700',
  display: 'swap',
  variable: '--font-onest',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
  preload: false,
})

export const fontVars = `${display.variable} ${sans.variable}`
