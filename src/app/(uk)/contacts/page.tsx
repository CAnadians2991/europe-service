import type { Metadata } from 'next'
import { organizationLd, pageMeta } from '@/lib/seo'
import { ContactsPage } from '@/components/content/ContactsPage'
import { JsonLd, TildaLd } from '@/components/seo/JsonLd'

// title and description exactly as on Tilda (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "Контакти - europeservice.com.ua",
  absoluteTitle: true,
  description: "Контакти ✅ Без посередників ⚡ Нові вакансії Польща 2026 ✈️ Допоможемо з візою і виїздом ✅ Від прямих роботодавців",
  path: '/contacts',
})

export default function Page() {
  return (
    <>
      {/* NAP (name, address, phone) of the office on the contacts page — the same entity as on the home page */}
      <JsonLd data={organizationLd('uk')} />
      <TildaLd path="/contacts" />
      <ContactsPage lang="uk" />
    </>
  )
}
