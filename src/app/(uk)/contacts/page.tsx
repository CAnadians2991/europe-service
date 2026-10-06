import type { Metadata } from 'next'
import { organizationLd, pageMeta } from '@/lib/seo'
import { ContactsPage } from '@/components/content/ContactsPage'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = pageMeta({
  title: 'Контакти - europeservice.com.ua',
  absoluteTitle: true,
  description: 'Контакти Europe Service: 0 800 357 278 (безкоштовно), Viber і Telegram +380633339078. Офіси в Києві, Львові, Рівному, Житомирі та Одесі. Безкоштовна консультація.',
  path: '/contacts',
})

export default function Page() {
  return (
    <>
      {/* NAP (name, address, phone) of the office on the contacts page — the same entity as on the home page */}
      <JsonLd data={organizationLd('uk')} />
      <ContactsPage lang="uk" />
    </>
  )
}
