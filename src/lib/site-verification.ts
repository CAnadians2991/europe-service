import type { Metadata } from 'next'

/**
 * Ownership tokens that third parties read from the page <head>.
 * - Google Search Console: the HTML-tag token of the Tilda home page (keeps the property verified after the move).
 */
const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'UCj7hEofAk4QehdGQUAUWxj_-9shcBTL9GL8_nAMI5s'

export const siteVerification: Metadata['verification'] = { google }
