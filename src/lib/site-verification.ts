import type { Metadata } from 'next'

const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

/**
 * Ownership tokens that third parties read from the page <head>.
 * - Meta (Business Manager → Brand safety → Domains): token copied from the old Tilda home page.
 * - Google Search Console: optional HTML-tag token via env; the recommended method is a DNS TXT record (docs/CUTOVER.md).
 */
export const siteVerification: Metadata['verification'] = {
  ...(google ? { google } : {}),
  other: { 'facebook-domain-verification': '5b2wepncom2wink91w60auc2jwjuis' },
}
