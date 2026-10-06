import { PRODUCTS } from '@/lib/shop'
import { methods } from '@/lib/pay'
import { PageHero } from '@/components/content/PageHero'
import { Checkout } from './Checkout'

/** /oplata — the cart: what is being paid, who pays, how (methods switch on with the bank keys in env) */
export function CheckoutPage({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const products = PRODUCTS.map(({ id, title, titleRu, price, note, noteRu, multiple, href, hrefRu }) => ({ id, title, titleRu, price, note, noteRu, multiple, href, hrefRu }))
  return (
    <>
      <PageHero
        title={uk ? 'Оплата послуг' : 'Оплата услуг'}
        text={uk ? 'Перевірте замовлення, вкажіть дані платника й оберіть зручний спосіб оплати — карткою або частинами.' : 'Проверьте заказ, укажите данные плательщика и выберите удобный способ оплаты — картой или частями.'}
        crumbs={[
          { name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' },
          { name: uk ? 'Послуги' : 'Услуги', path: uk ? '/poslugi' : '/ru/services' },
          { name: uk ? 'Оплата' : 'Оплата', path: uk ? '/oplata' : '/ru/oplata' },
        ]}
      />
      <div className="container-x py-10 sm:py-14">
        <Checkout products={products} methods={methods()} lang={lang} ofertaHref={uk ? '/oferta' : '/ru/oferta'} />
      </div>
    </>
  )
}
