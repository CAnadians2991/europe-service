'use client'

import { useLeadModal } from '@/components/lead/LeadModal'

export function QuickApply({ id, title, lang = 'uk', className = 'btn-ghost !px-4 !py-3 !text-[15px]', label, submitLabel, form = 'vacancy-card' }: { id: string; title: string; lang?: 'uk' | 'ru'; className?: string; label?: string; submitLabel?: string; form?: string }) {
  const open = useLeadModal()
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        open({
          form,
          vacancyId: id,
          vacancyTitle: title,
          title: lang === 'uk' ? 'Заявка на вакансію' : 'Заявка на вакансию',
          subtitle: lang === 'uk' ? 'Залиште номер — менеджер розповість деталі та перевірить наявність місць.' : 'Оставьте номер — менеджер расскажет детали и проверит наличие мест.',
          submitLabel: submitLabel ?? (lang === 'uk' ? 'Хочу на цю вакансію' : 'Хочу на эту вакансию'),
        })
      }
    >
      {label ?? (lang === 'uk' ? 'Заявка' : 'Заявка')}
    </button>
  )
}
