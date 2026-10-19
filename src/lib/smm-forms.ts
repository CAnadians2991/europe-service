/**
 * The SMM forms (owner 2026-10-19): the SMM manager files leads from Facebook / TikTok comments by hand, choosing the
 * branch by the form — about ten a day each. They lived on the Wix site europeservice.net (no captcha, unlike Tilda's,
 * which kicked in after a few quick submissions); now at the same paths here. A lead reaches Bitrix exactly as the
 * Wix form filed it — Bitrix sorts it to the branch by the source and the form name:
 *   «Заявка з Facebook +380…», source 44 «Facebook lead ads» / «Заявка з TikTok +380…», source 50 «ES TikTok»,
 *   SOURCE_DESCRIPTION = the form name, «Цікавить країна» = the country.
 */
export interface SmmForm {
  path: string
  /** the name Bitrix knows the form by (the TikTok «ЦО» one was typed with a Cyrillic «с» — kept as is) */
  bitrixName: string
  branch: string
  channel: 'fb' | 'tt'
}

export const SMM_CHANNEL = {
  fb: { source: '44', title: 'Заявка з Facebook', label: 'Facebook' },
  tt: { source: '50', title: 'Заявка з TikTok', label: 'TikTok' },
} as const

const BRANCHES = [
  ['co', 'ЦО'],
  ['rivne', 'Рівне'],
  ['odesa', 'Одеса'],
  ['zhytomyr', 'Житомир'],
  ['kyiv', 'Київ'],
] as const

export const SMM_FORMS: SmmForm[] = [
  ...BRANCHES.map(([slug, branch]): SmmForm => ({ path: `/form-fb-${slug}`, bitrixName: `form-fb-${slug}`, branch, channel: 'fb' })),
  ...BRANCHES.map(([slug, branch]): SmmForm => ({ path: `/form-${slug}`, bitrixName: slug === 'co' ? 'form-сo' : `form-${slug}`, branch, channel: 'tt' })),
]
export const smmForm = (path: string) => SMM_FORMS.find((f) => f.path === path)

/** Bitrix lead field «Цікавить країна:» and its values (UF_CRM_1664801078539), in the Wix form's order */
export const SMM_COUNTRY_FIELD = 'UF_CRM_1664801078539'
export const SMM_COUNTRIES = [
  ['3093', 'Польща'],
  ['3094', 'Чехія'],
  ['3096', 'Німеччина'],
  ['4652', 'Греція'],
  ['3095', 'Словаччина'],
  ['3097', 'Нідерланди'],
  ['3098', 'Литва'],
  ['3099', 'Румунія'],
  ['5036', 'Угорщина'],
  ['5037', 'Італія'],
  ['3100', 'Інше'],
] as const
