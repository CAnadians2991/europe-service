import Link from 'next/link'
import { SERVICES, type Package } from '@/lib/content'
import { PageHero } from './PageHero'
import { Blocks } from './Blocks'
import { IconCheck } from '@/components/ui/icons'
import { CtaBand, Faq, HOME_FAQ, HOME_FAQ_RU } from '@/components/sections/Sections'
import { PayButton } from './PayButton'
import { LeadButton } from '@/components/lead/LeadModal'
import { LicenseBadge } from '@/components/trust/LicenseBadge'
import { JsonLd } from '@/components/seo/JsonLd'
import { servicesLd } from '@/lib/services-ld'

function PackageCard({ p, featured, lang }: { p: Package; featured?: boolean; lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <div className={`relative flex flex-col rounded-3xl p-6 sm:p-7 ${featured ? 'bg-brand-600 text-white shadow-[var(--shadow-lift)]' : 'bg-white ring-1 ring-line'}`}>
      {featured && <span className="absolute -top-3 left-6 rounded-full bg-accent-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">{uk ? 'Найпопулярніший' : 'Самый популярный'}</span>}
      <h3 className="text-xl font-bold leading-snug">{p.title}</h3>
      {p.price && (
        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-[32px] font-extrabold leading-none">{p.price}</span>
          {p.oldPrice && <span className={`text-lg line-through ${featured ? 'text-white/60' : 'text-muted'}`}>{p.oldPrice} грн</span>}
        </p>
      )}
      {p.note && <p className={`mt-2 text-sm ${featured ? 'text-white/80' : 'text-muted'}`}>{p.note}</p>}
      <ul className="mt-5 flex-1 space-y-2.5">
        {p.features.map((f) => (
          <li key={f} className={`flex gap-2.5 text-[15px] leading-snug ${featured ? 'text-white/90' : 'text-ink-2'}`}>
            <IconCheck className={`mt-0.5 size-4 shrink-0 ${featured ? 'text-white' : 'text-brand-600'}`} />
            {f.replace(/\.$/, '')}
          </li>
        ))}
      </ul>
      <div className="mt-6 grid gap-2">
        {p.payUrl && (
          <p className={`text-xs leading-snug ${featured ? 'text-white/80' : 'text-muted'}`}>
            {uk ? '* Натискаючи «Оплатити», ви погоджуєтесь з умовами ' : '* Нажимая «Оплатить», вы соглашаетесь с условиями '}
            <Link href="/user_deal" className={`underline underline-offset-2 ${featured ? 'text-white' : 'text-brand-700'}`}>
              {uk ? 'публічної оферти' : 'публичной оферты'}
            </Link>
            .
          </p>
        )}
        {p.payUrl ? (
          <PayButton href={p.payUrl} title={p.title} className={featured ? 'btn-white !py-3.5' : 'btn-primary !py-3.5'}>
            {uk ? 'Оплатити' : 'Оплатить'}
          </PayButton>
        ) : null}
        <LeadButton form={`service:${p.title}`} title={uk ? 'Консультація щодо послуги' : 'Консультация по услуге'} subtitle={p.title} className={featured ? 'btn !py-3 text-white ring-1 ring-inset ring-white/50 hover:!bg-white/10' : 'btn-ghost !py-3'}>
          {uk ? 'Спершу консультація' : 'Сначала консультация'}
        </LeadButton>
      </div>
    </div>
  )
}

export function ServicesPage({ lang }: { lang: 'uk' | 'ru' }) {
  const s = SERVICES[lang]
  const uk = lang === 'uk'
  const main = s.packages.slice(0, 3)
  const rest = s.packages.slice(3)
  return (
    <>
      <JsonLd data={servicesLd(lang)} />
      <PageHero
        title={uk ? 'Послуги та ціни' : 'Услуги и цены'}
        text={uk ? 'Вакансія для вас безкоштовна — ви оплачуєте лише послуги з оформлення та супроводу. Оберіть пакет або отримайте безкоштовну консультацію.' : 'Вакансия для вас бесплатна — вы оплачиваете только услуги по оформлению и сопровождению. Выберите пакет или получите бесплатную консультацию.'}
        crumbs={[{ name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' }, { name: uk ? 'Послуги' : 'Услуги', path: uk ? '/poslugi' : '/ru/services' }]}
      >
        <LicenseBadge lang={lang} dark className="mt-4 text-[14px]" />
      </PageHero>
      <section className="container-x py-12">
        <h2 className="text-[26px] font-bold">{main[0]?.group || (uk ? 'Пакети послуг з працевлаштування' : 'Пакеты услуг по трудоустройству')}</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {main.map((p, i) => <PackageCard key={p.title} p={p} featured={i === 1} lang={lang} />)}
        </div>
      </section>
      {rest.length > 0 && (
        <section className="bg-surface py-12">
          <div className="container-x">
            <h2 className="text-[26px] font-bold">{uk ? 'Оформлення в інші країни та додаткові послуги' : 'Оформление в другие страны и дополнительные услуги'}</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => <PackageCard key={p.title} p={p} lang={lang} />)}
            </div>
          </div>
        </section>
      )}
      {s.steps?.length > 0 && (
        <section className="container-x py-14">
          <h2 className="text-[26px] font-bold">{s.stepsTitle || (uk ? 'Етапи співпраці' : 'Этапы сотрудничества')}</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {s.steps.map((st, i) => (
              <li key={st.title} className="rounded-3xl border border-line bg-white p-6">
                <span className="grid size-10 place-items-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 text-lg font-bold">{st.title.replace(/^(Крок|Шаг)\s*\d+\.\s*/, '')}</h3>
                <div className="mt-2 text-[15px]">
                  {st.blocks?.length ? <Blocks blocks={st.blocks} /> : st.text && <p className="whitespace-pre-line text-ink-2">{st.text.replace(/✅/g, '• ')}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
      {s.extraSections?.length > 0 && (
        <section className="container-x grid gap-5 pb-6 md:grid-cols-2">
          {s.extraSections.map((x) => (
            <div key={x.title} className="rounded-3xl bg-surface p-6">
              <h2 className="text-lg font-bold">{x.title.charAt(0) + x.title.slice(1).toLowerCase()}</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] text-ink-2">{x.text}</p>
            </div>
          ))}
        </section>
      )}
      <Faq items={uk ? HOME_FAQ : HOME_FAQ_RU} lang={lang} />
      <CtaBand lang={lang} form={uk ? 'services-bottom' : 'services-bottom-ru'} title={uk ? 'Не знаєте, який пакет обрати?' : 'Не знаете, какой пакет выбрать?'} text={uk ? 'Залиште номер — менеджер порадить оптимальний варіант під вашу вакансію та документи.' : 'Оставьте номер — менеджер подскажет оптимальный вариант под вашу вакансию и документы.'} />
    </>
  )
}
