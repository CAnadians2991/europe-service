import type { Metadata } from 'next'
import { CheckoutPage } from '@/components/shop/CheckoutPage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: { absolute: 'Оплата услуг — Europe Service' }, robots: { index: false, follow: true } }

export default function Page() {
  return <CheckoutPage lang="ru" />
}
