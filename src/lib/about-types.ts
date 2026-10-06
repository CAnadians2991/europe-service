export interface TeamMember {
  id: string
  name: string
  role: string
  photo: string
  /** e.g. "з 2020 року в компанії" */
  since?: string
  about?: string
  /** direct chat links (optional) */
  telegram?: string
  viber?: string
}

export interface About {
  team: TeamMember[]
  officePhotos: string[]
  officeText: string
  hours: string
  /** optional YouTube id of an office / team video */
  video?: string
  license: {
    /** scan image base URL (uploaded in admin) */
    scan: string
    number: string
    date: string
    issuer: string
    activity: string
  }
  /** Official state list (Мінекономіки, постанова КМУ № 1118) — verifiable by anyone */
  registry: {
    name: string
    code: string
    included: string
    address: string
    url: string
  }
}

export const DEFAULT_ABOUT: About = {
  team: [],
  officePhotos: [],
  officeText:
    'Головний офіс Europe Service — у Києві, на Січових Стрільців, 77. Ще чотири офіси — у Львові, Рівному, Житомирі та Одесі. Кожного кандидата веде особистий менеджер: підбирає вакансію, допомагає з документами, бронює місце в роботодавця і тримає зв’язок до першого робочого дня й після нього.',
  hours: '',
  license: {
    scan: '',
    // Licence of ТОВ «ЄВРОПА СЕРВІС УКРАЇНА» (ЄДРПОУ 42515343) — this company
    number: '223',
    date: '15.02.2019',
    issuer: 'Міністерство соціальної політики України',
    activity: 'посередництво у працевлаштуванні за кордоном',
  },
  registry: {
    name: 'ТОВ «ЄВРОПА СЕРВІС УКРАЇНА»',
    code: '42515343',
    // date of inclusion into the Мінекономіки list — fill in /admin/about once checked in the registry
    included: '',
    address: 'м. Київ, вул. Січових Стрільців, 77, офіс 612',
    url: 'https://data.gov.ua/dataset/38b784d5-c2d3-4fec-a796-e437ce42273b',
  },
}
