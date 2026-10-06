import type { Metadata } from 'next'
import { organizationLd, pageMeta } from '@/lib/seo'
import { ContactsPage } from '@/components/content/ContactsPage'
import { JsonLd } from '@/components/seo/JsonLd'

// title and description exactly as on Tilda (the page ranks with them)
export const metadata: Metadata = pageMeta({
  title: "Контакты компании Europe Service",
  absoluteTitle: true,
  description: "Контакты компании Europe Service ☎️ Проведем подробную консультацию ⭐ Зарплата до 40 тыс. грн/мес ➦ Жми❗",
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
