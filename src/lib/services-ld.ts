import { SERVICES } from './content'
import { SITE } from './site'

/** «Послуги»: the packages with prices as schema.org offers — lets Google / AI answers quote «скільки коштує» */
export function servicesLd(lang: 'uk' | 'ru') {
  const path = lang === 'uk' ? '/poslugi' : '/ru/services'
  const items = SERVICES[lang].packages
    .map((p) => ({ p, uah: /^(\d[\d\s]*)\s*грн$/.exec(p.price ?? '')?.[1]?.replace(/\s/g, '') }))
    .filter((x) => x.uah)
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: lang === 'uk' ? 'Послуги з працевлаштування за кордоном' : 'Услуги по трудоустройству за границей',
    url: SITE.url + path,
    itemListElement: items.map(({ p, uah }) => ({
      '@type': 'Offer',
      price: uah,
      priceCurrency: 'UAH',
      url: SITE.url + path,
      seller: { '@id': `${SITE.url}/#org` },
      itemOffered: { '@type': 'Service', name: p.title, description: p.features.map((f) => f.replace(/\.$/, '')).join('; '), provider: { '@id': `${SITE.url}/#org` } },
    })),
  }
}
