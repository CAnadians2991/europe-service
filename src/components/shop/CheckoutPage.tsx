import { PRODUCTS } from '@/lib/shop'
import { methods } from '@/lib/pay'
import { Breadcrumbs } from '@/components/vacancy/CatalogPage'
import { Checkout } from './Checkout'

/** /oplata — the cart: what is being paid, who pays, how (methods switch on with the bank keys in env) */
export function CheckoutPage({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const products = PRODUCTS.map(({ id, title, titleRu, price, note, noteRu, features, featuresRu, multiple, href, hrefRu }) => ({ id, title, titleRu, price, note, noteRu, features, featuresRu, multiple, href, hrefRu }))
  return (
    <div className="container-x py-4 sm:py-8">
      <div className="text-ink-2">
        <Breadcrumbs
          items={[
            { name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' },
            { name: uk ? 'Послуги' : 'Услуги', path: uk ? '/poslugi' : '/ru/services' },
            { name: uk ? 'Оплата' : 'Оплата', path: uk ? '/oplata' : '/ru/oplata' },
          ]}
        />
      </div>
      <h1 className="mb-3 mt-1 text-[22px] leading-tight sm:mb-5 sm:text-[30px]">{uk ? 'Оплата послуг' : 'Оплата услуг'}</h1>
      <Checkout products={products} methods={methods()} lang={lang} ofertaHref={uk ? '/oferta' : '/ru/oferta'} />
    </div>
  )
}
