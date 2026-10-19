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
