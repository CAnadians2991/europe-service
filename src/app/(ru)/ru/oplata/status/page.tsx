import type { Metadata } from 'next'
import { OrderStatus } from '@/components/shop/OrderStatus'

export const metadata: Metadata = { title: { absolute: 'Статус оплаты — Europe Service' }, robots: { index: false, follow: false } }

export default function Page() {
  return (
    <div className="container-x py-12 sm:py-16">
      <OrderStatus lang="ru" />
    </div>
  )
}
