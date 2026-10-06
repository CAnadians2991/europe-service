import type { Metadata } from 'next'
import { organizationLd, pageMeta } from '@/lib/seo'
import { ContactsPage } from '@/components/content/ContactsPage'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = pageMeta({
  title: 'Контакты компании Europe Service',
  absoluteTitle: true,
  description: 'Контакты Europe Service: 0 800 357 278 (бесплатно), Viber и Telegram +380633339078. Офисы в Киеве, Львове, Ровно, Житомире и Одессе. Бесплатная консультация.',
  path: '/ru/contacts',
  lang: 'ru',
})

export default function Page() {
  return (
    <>
      {/* NAP (name, address, phone) of the office on the contacts page — the same entity as on the home page */}
      <JsonLd data={organizationLd('ru')} />
      <ContactsPage lang="ru" />
    </>
  )
}
