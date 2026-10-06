import { PageHero } from './PageHero'
import { SITE } from '@/lib/site'
import { LazyIframe } from '@/components/ui/LazyIframe'
import { ChatButtons } from '@/components/lead/ChatButtons'
import { SocialLinks } from '@/components/layout/SocialLinks'
import { LeadForm } from '@/components/lead/LeadForm'
import { LicenseBadge } from '@/components/trust/LicenseBadge'
import { LicenseSection } from '@/components/trust/LicenseSection'
import { getAbout } from '@/lib/about'

const MAP = 'https://www.google.com/maps?q=' + encodeURIComponent('вул. Січових Стрільців, 77, Київ') + '&output=embed'

/** One line of the contacts sheet: a mono label on the left, the means of contact on the right */
function Line({ label, children, id }: { label: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="grid gap-2 border-b border-line py-5 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6">
      <dt id={id} className="font-mono text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted sm:pt-1.5">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

export async function ContactsPage({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const about = await getAbout()
  const hasChats = Boolean(SITE.chat.telegram || SITE.chat.viber)
  return (
    <>
      <PageHero
        title={uk ? 'Контакти' : 'Контакты'}
        text={uk ? 'Зв’яжіться з нами в будь-який зручний спосіб — відповімо на всі питання щодо роботи та документів.' : 'Свяжитесь с нами любым удобным способом — ответим на все вопросы о работе и документах.'}
        crumbs={[{ name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' }, { name: uk ? 'Контакти' : 'Контакты', path: uk ? '/contacts' : '/ru/contacts' }]}
      />

      <section className="container-x grid gap-12 py-14 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16" aria-label={uk ? 'Як зв’язатися' : 'Как связаться'}>
        <dl className="border-t-[3px] border-ink">
          <Line label={uk ? 'Гаряча лінія' : 'Горячая линия'}>
            <a href={`tel:${SITE.phone}`} className="num inline-flex min-h-11 items-center text-[28px] font-semibold leading-none tracking-[-0.01em] text-ink hover:text-brand-700 sm:text-[34px]">
              {SITE.phoneDisplay}
            </a>
            <p className="mt-1 text-[15px] text-muted">{uk ? 'Безкоштовно з усіх операторів України' : 'Бесплатно со всех операторов Украины'}</p>
          </Line>
          <Line label={uk ? 'Мобільні' : 'Мобильные'}>
            <ul className="flex flex-wrap gap-x-6">
              {SITE.phones.map((p) => (
                <li key={p.tel}>
                  <a href={`tel:${p.tel}`} className="num inline-flex min-h-11 items-center text-[18px] font-semibold text-ink hover:text-brand-700">
                    {p.display}
                  </a>
                </li>
              ))}
            </ul>
          </Line>
          {hasChats && (
            <Line label={uk ? 'Месенджери' : 'Мессенджеры'} id="chat-h">
              <p className="text-[16px] font-semibold text-ink">{uk ? 'Напишіть менеджеру' : 'Напишите менеджеру'}</p>
              <p className="mt-0.5 text-[15px] text-ink-2">{uk ? 'Viber і Telegram — найшвидший спосіб поставити запитання.' : 'Viber и Telegram — самый быстрый способ задать вопрос.'}</p>
              <ChatButtons place="contacts" lang={lang} className="mt-3 max-w-md" />
            </Line>
          )}
          <Line label="Email">
            <a href={`mailto:${SITE.email}`} className="num inline-flex min-h-11 items-center break-all text-[17px] font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">
              {SITE.email}
            </a>
          </Line>
          <Line label={uk ? 'Соцмережі' : 'Соцсети'} id="social-h">
            <p className="text-[15px] text-ink-2">{uk ? 'Нові вакансії щодня — у Telegram і Viber' : 'Новые вакансии каждый день — в Telegram и Viber'}</p>
            <SocialLinks lang={lang} place="contacts" className="mt-3" />
          </Line>
          <Line label={uk ? 'Головний офіс' : 'Главный офис'}>
            <p className="text-[16px] text-ink">
              {uk ? 'м. Київ, ' : 'г. Киев, '}
              {uk ? SITE.offices[0].address : SITE.offices[0].addressRu}
            </p>
            <a href="#offices-h" className="mt-1 inline-flex min-h-11 items-center text-[15px] font-semibold text-brand-700 underline underline-offset-[3px]">
              {uk ? 'Усі 5 офісів і карта' : 'Все 5 офисов и карта'} <span aria-hidden className="ml-1">↓</span>
            </a>
          </Line>
        </dl>

        <div className="border border-line bg-white lg:self-start">
          <div className="rule-grad" />
          <div className="p-6 sm:p-8">
            <p className="eyebrow">{uk ? 'Заявка' : 'Заявка'}</p>
            <h2 className="mt-3 text-[26px] sm:text-[30px]">{uk ? 'Залиште заявку' : 'Оставьте заявку'}</h2>
            <p className="mt-2 text-[16px] text-ink-2">{uk ? 'Менеджер зателефонує й відповість на всі запитання.' : 'Менеджер позвонит и ответит на все вопросы.'}</p>
            <div className="mt-6">
              <LeadForm form={uk ? 'contacts' : 'contacts-ru'} lang={lang} />
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <LicenseBadge lang={lang} className="!text-[15px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white" aria-labelledby="offices-h">
        <div className="container-x py-14 sm:py-16">
          <p className="eyebrow">{uk ? 'Офіси' : 'Офисы'}</p>
          <h2 id="offices-h" className="mt-3 scroll-mt-28 text-[26px] sm:text-[36px]">{uk ? 'Наші офіси' : 'Наши офисы'}</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
            <ul className="border-t-[3px] border-ink">
              {SITE.offices.map((o) => {
                const main = 'main' in o && o.main
                const route = 'map' in o ? o.map : undefined
                return (
                  <li key={o.city} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-line py-4">
                    <span className="font-display text-[19px] font-semibold tracking-[-0.01em]">
                      {uk ? o.city : o.cityRu}
                      {main && <span className="ml-2 bg-brand-600 px-1.5 py-0.5 align-middle font-mono text-[11px] font-semibold uppercase tracking-wide text-white">{uk ? 'головний' : 'главный'}</span>}
                    </span>
                    <a href={`tel:${o.phone}`} className="num inline-flex min-h-11 items-center text-[15px] font-semibold text-ink hover:text-brand-700">
                      {o.phoneDisplay}
                    </a>
                    {(uk ? o.address : o.addressRu) && <span className="col-span-2 text-[15px] text-ink-2">{uk ? o.address : o.addressRu}</span>}
                    {route && (
                      <a href={route} target="_blank" rel="noopener" className="col-span-2 inline-flex min-h-11 items-center justify-self-start font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-brand-700 hover:underline">
                        {uk ? 'Прокласти маршрут' : 'Проложить маршрут'} →
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="min-h-[360px] border border-line bg-surface">
              <LazyIframe title={uk ? 'Головний офіс на карті' : 'Главный офис на карте'} src={MAP} className="h-full min-h-[360px] w-full" />
            </div>
          </div>
        </div>
      </section>
      <LicenseSection about={about} lang={lang} compact />
    </>
  )
}
