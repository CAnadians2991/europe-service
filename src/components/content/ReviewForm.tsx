'use client'

import { useId, useState } from 'react'
import { LeadForm } from '@/components/lead/LeadForm'
import { IconStar } from '@/components/ui/icons'

/** "Залишити відгук про роботу" (was in the Tilda footer). Goes to the admin/Telegram for moderation, not a conversion. */
export function ReviewForm({ lang = 'uk' }: { lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const id = useId()
  const [date, setDate] = useState('')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [vacancy, setVacancy] = useState('')
  return (
    <div className="space-y-4">
      <div>
        <p className="label">{uk ? 'Ваша оцінка' : 'Ваша оценка'}</p>
        <div className="flex gap-1" role="radiogroup" aria-label={uk ? 'Оцінка' : 'Оценка'}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={uk ? `${n} з 5` : `${n} из 5`} onClick={() => setRating(n)} className="rounded-lg p-1.5 text-sun-600 transition active:bg-sun-100">
              <IconStar className={`size-8 ${n <= rating ? '' : 'opacity-25'}`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-vac`} className="label">{uk ? 'Вакансія / місто (необов’язково)' : 'Вакансия / город (необязательно)'}</label>
        <input id={`${id}-vac`} className="field" value={vacancy} onChange={(e) => setVacancy(e.target.value)} placeholder={uk ? 'Напр.: склад InPost, Лодзь' : 'Напр.: склад InPost, Лодзь'} />
      </div>
      <div>
        <label htmlFor={`${id}-date`} className="label">{uk ? 'Дата заїзду (необов’язково)' : 'Дата заезда (необязательно)'}</label>
        <input id={`${id}-date`} type="month" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${id}-text`} className="label">{uk ? 'Відгук' : 'Отзыв'}</label>
        <textarea id={`${id}-text`} className="field min-h-28" value={text} onChange={(e) => setText(e.target.value)} placeholder={uk ? 'Як вам робота, житло, супровід менеджера?' : 'Как вам работа, жильё, сопровождение менеджера?'} />
      </div>
      <LeadForm
        form="review"
        conversion={false}
        nameField="required"
        askMessenger={false}
        compact
        lang={lang}
        submitLabel={uk ? 'Надіслати відгук' : 'Отправить отзыв'}
        answers={{ Оцінка: `${rating}/5`, Вакансія: vacancy, 'Дата заїзду': date, Відгук: text }}
        validate={() => (text.trim().length < 10 ? (uk ? 'Напишіть кілька слів про роботу' : 'Напишите пару слов о работе') : null)}
        successTitle={uk ? 'Дякуємо за відгук!' : 'Спасибо за отзыв!'}
        successText={uk ? 'Ми опублікуємо його після перевірки. Телефон потрібен лише для перевірки й ніде не показується.' : 'Мы опубликуем его после проверки. Телефон нужен только для проверки и нигде не показывается.'}
      />
    </div>
  )
}
