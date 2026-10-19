import forms from '@/data/bitrix-forms.json'

/**
 * Tilda's «Форма реєстрації на вакансію» pages (/form_1 … /form_all) were Bitrix24 CRM web forms: managers send the link,
 * the candidate fills in the passport data, Bitrix creates a CONTACT (not a lead). The company's Bitrix server answers
 * HTTPS with Bitrix's self-signed certificate, so its own form script can't load in a visitor's browser — the site draws
 * the same form from Bitrix's definition (scripts/import/bitrix-forms.py) and the server hands the answers to Bitrix's
 * own form handler, so Bitrix does exactly what its form does. Passport data goes to Bitrix only: no copy on the site.
 */
export interface BxField {
  name: string
  type: 'page' | 'phone' | 'email' | 'name' | 'last-name' | 'string' | 'text' | 'list' | 'date' | 'double' | string
  label: string
  required?: boolean
  items?: { label: string; value: string }[]
}
export interface BxForm {
  id: string
  sec: string
  lang: string
  address: string
  title: string
  desc: string
  button: string
  dateFormat: string
  fields: BxField[]
}

export const BITRIX_FORMS = forms as Record<string, BxForm>

/** «inline/22/2xhng8» (as Tilda embedded it) → «22_2xhng8» */
export const bitrixFormKey = (embed: string) => embed.replace(/^inline\//, '').replace('/', '_')

/**
 * How a field is easiest to fill (owner 2026-10-19: «спрости кандидату, але не міняй суть») — the same Bitrix field
 * and value, only the input changes: names and the passport number in capital Latin, digits-only codes, taps instead of
 * typing where the answers are known.
 */
export type BxKind = 'latin' | 'passport' | 'digits' | 'decimal' | 'shoe' | 'options' | 'plain'
export function fieldKind(f: BxField): { kind: BxKind; max?: number; placeholder?: string; hint?: string; suffix?: string } {
  const l = f.label
  if (f.type === 'list') return { kind: 'options' }
  if (f.type === 'name' || f.type === 'last-name' || /англійськ/i.test(l))
    return { kind: 'latin', placeholder: f.type === 'last-name' || /прізвищ/i.test(l) ? 'SHEVCHENKO' : 'IVAN', hint: 'Можна писати українською — переведемо латиницею, як у паспорті' }
  if (/Серія, номер паспорта/i.test(l)) return { kind: 'passport', max: 12, placeholder: 'FX123456', hint: 'Латинські літери й цифри, без пробілів' }
  if (/PESEL/i.test(l)) return { kind: 'digits', max: 11, placeholder: '11 цифр', hint: 'Якщо вже є' }
  if (/Ідентифікаційний код/i.test(l)) return { kind: 'digits', max: 10, placeholder: '10 цифр' }
  if (/індекс/i.test(l)) return { kind: 'digits', max: 5, placeholder: '00000' }
  if (/^Вік/i.test(l)) return { kind: 'digits', max: 2 }
  if (/Зріст/i.test(l)) return { kind: 'digits', max: 3, suffix: 'см' }
  if (/Розмір взуття/i.test(l)) return { kind: 'shoe' }
  if (f.type === 'double' || /Талія|Вага/i.test(l)) return { kind: 'decimal', max: 5, suffix: /Вага/i.test(l) ? 'кг' : 'см' }
  return { kind: 'plain' }
}
export const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47']

/** a field's value as Bitrix should get it: the same rules the form applies while typing */
export function normalizeValue(f: BxField, v: string, latin: (s: string) => string, passport: (s: string) => string): string {
  const k = fieldKind(f)
  if (k.kind === 'latin') return latin(v).trim()
  if (k.kind === 'passport') return passport(v).slice(0, k.max)
  if (k.kind === 'digits') return v.replace(/\D/g, '').slice(0, k.max)
  if (k.kind === 'decimal') return v.replace(',', '.').replace(/[^\d.]/g, '').slice(0, k.max)
  return v
}

/** the blocks the form is split into; within a block Bitrix's own order stays */
export const BX_SECTIONS = [
  { id: 'contact', title: 'Контакти', re: /^(Телефон|Номер VIBER|E-mail|Польський номер)/i },
  { id: 'passport', title: 'Паспорт', re: /Ім'я \(англ|^Прізвище|Тип документа|Біометрич|Серія|Термін дії|Місце народження|Орган|Дата народження|^Вік|Ідентифікац|PESEL/i },
  { id: 'family', title: 'Адреса та родина', re: /Прописка|індекс|Цивільний|батька|матері|родича/i },
  { id: 'clothes', title: 'Робочий одяг', re: /Розмір|Зріст|Талія|Вага/i },
  { id: 'poland', title: 'Перебування в Польщі', re: /Польщ|EWL|Побиту|замовник|^Так\/Ні$/i },
] as const
export function sectionOf(f: BxField): string {
  if (f.type === 'phone' || f.type === 'email' || f.name === 'CONTACT_IM') return 'contact'
  return BX_SECTIONS.find((s) => s.re.test(f.label))?.id ?? 'other'
}
