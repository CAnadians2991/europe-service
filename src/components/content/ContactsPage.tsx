import { PageHero } from './PageHero'
import { SITE } from '@/lib/site'
import { IconPhone, IconPin } from '@/components/ui/icons'
import { LazyIframe } from '@/components/ui/LazyIframe'
import { ChatButtons } from '@/components/lead/ChatButtons'
import { SocialLinks } from '@/components/layout/SocialLinks'
import { LeadForm } from '@/components/lead/LeadForm'
import { LicenseBadge } from '@/components/trust/LicenseBadge'
import { LicenseSection } from '@/components/trust/LicenseSection'
import { getAbout } from '@/lib/about'

const MAP = 'https://www.google.com/maps?q=' + encodeURIComponent('вул. Січових Стрільців, 77, Київ') + '&output=embed'

export async function ContactsPage({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const about = await getAbout()
  return (
    <>
      <PageHero
        title={uk ? 'Контакти' : 'Контакты'}
        text={uk ? 'Зв’яжіться з нами в будь-який зручний спосіб — відповімо на всі питання щодо роботи та документів.' : 'Свяжитесь с нами любым удобным способом — ответим на все вопросы о работе и документах.'}
        crumbs={[{ name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' }, { name: uk ? 'Контакти' : 'Контакты', path: uk ? '/contacts' : '/ru/contacts' }]}
      />
      <section className="container-x grid gap-8 py-12 lg:grid-cols-2">
        <div className="space-y-4">
          <a href={`tel:${SITE.phone}`} className="flex items-center gap-4 rounded-3xl border border-line bg-white p-6 hover:border-brand-300">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><IconPhone className="size-6" /></span>
            <span>
              <span className="block text-sm font-semibold text-muted">{uk ? 'Безкоштовно з усіх операторів України' : 'Бесплатно со всех операторов Украины'}</span>
              <span className="text-xl font-bold text-ink">{SITE.phoneDisplay}</span>
            </span>
          </a>
          <section className="rounded-3xl border border-line bg-white p-6" aria-labelledby="chat-h">
            <h2 id="chat-h" className="text-lg font-bold">{uk ? 'Напишіть менеджеру' : 'Напишите менеджеру'}</h2>
            <p className="mt-1 text-[15px] text-ink-2">{uk ? 'Viber і Telegram — найшвидший спосіб поставити запитання.' : 'Viber и Telegram — самый быстрый способ задать вопрос.'}</p>
            <ChatButtons place="contacts" lang={lang} className="mt-4" />
            <ul className="mt-4 space-y-1 text-[15px]">
              {SITE.phones.map((p) => (
                <li key={p.tel}>
                  <a href={`tel:${p.tel}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-ink hover:text-brand-700">
                    <IconPhone className="size-4 text-brand-600" /> {p.display}
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${SITE.email}`} className="inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-2">
                  {SITE.email}
                </a>
              </li>
            </ul>
          </section>
          <section className="rounded-3xl border border-line bg-white p-6" aria-labelledby="social-h">
            <h2 id="social-h" className="text-lg font-bold">{uk ? 'Ми в соцмережах' : 'Мы в соцсетях'}</h2>
            <p className="mt-1 text-[15px] text-ink-2">{uk ? 'Нові вакансії щодня — у Telegram і Viber' : 'Новые вакансии каждый день — в Telegram и Viber'}</p>
            <SocialLinks lang={lang} place="contacts" className="mt-4" />
          </section>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-lift)] ring-1 ring-line sm:p-8 lg:self-start">
          <h2 className="text-2xl font-bold">{uk ? 'Залиште заявку' : 'Оставьте заявку'}</h2>
          <p className="mt-2 text-ink-2">{uk ? 'Менеджер зателефонує й відповість на всі запитання.' : 'Менеджер позвонит и ответит на все вопросы.'}</p>
          <div className="mt-6">
            <LeadForm form={uk ? 'contacts' : 'contacts-ru'} lang={lang} />
          </div>
          <div className="mt-6 border-t border-line pt-4">
            <LicenseBadge lang={lang} />
          </div>
        </div>
      </section>

      <section className="container-x pb-12" aria-labelledby="offices-h">
        <h2 id="offices-h" className="text-[26px] sm:text-[32px]">{uk ? 'Наші офіси' : 'Наши офисы'}</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {SITE.offices.map((o) => (
              <li key={o.city} className={`rounded-3xl p-5 ring-1 ${'main' in o && o.main ? 'bg-brand-50 ring-brand-200' : 'bg-white ring-line'}`}>
                <p className="text-[18px] font-bold">
                  {uk ? o.city : o.cityRu}
                  {'main' in o && o.main && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide text-white">{uk ? 'головний' : 'главный'}</span>}
                </p>
                {(uk ? o.address : o.addressRu) && (
                  <p className="mt-1 flex gap-2 text-[15px] text-ink-2">
                    <IconPin className="mt-0.5 size-4 shrink-0 text-brand-600" /> {uk ? o.address : o.addressRu}
                  </p>
                )}
                <a href={`tel:${o.phone}`} className="mt-1 inline-flex min-h-11 items-center gap-2 font-semibold text-ink hover:text-brand-700">
                  <IconPhone className="size-4 text-brand-600" /> {o.phoneDisplay}
                </a>
              </li>
            ))}
          </ul>
          <div className="overflow-hidden rounded-3xl border border-line">
            <LazyIframe title={uk ? 'Головний офіс на карті' : 'Главный офис на карте'} src={MAP} className="h-full min-h-[360px] w-full" />
          </div>
        </div>
      </section>
      <LicenseSection about={about} lang={lang} compact />
    </>
  )
}
