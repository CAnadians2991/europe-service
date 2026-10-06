'use client'

import { setExtraCountries, type CountryInfo } from '@/lib/site'

/**
 * Puts the countries added in the admin into the browser's copy of COUNTRIES / COUNTRY (catalog filters, vacancy
 * editor…). Rendered before everything else in the layout, so the components after it already see them.
 */
export function CountriesInit({ list }: { list: CountryInfo[] }) {
  setExtraCountries(list)
  return null
}
