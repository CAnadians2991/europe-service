import type { Vacancy } from './types'

export const SECTION_TEMPLATES = ['Обов’язки', 'Заробітна плата', 'Графік роботи', 'Проживання', 'Вимоги', 'Додаткові умови']

export function emptyVacancy(): Vacancy {
  const now = new Date().toISOString()
  return {
    id: '',
    path: '',
    active: true,
    hot: false,
    order: 0,
    country: 'pl',
    title: '',
    company: '',
    city: '',
    category: 'factory',
    genders: ['men', 'women', 'couples'],
    salary: { text: '', hourMin: null, hourMax: null, monthMin: null, monthMax: null, currency: 'PLN', net: true },
    schedule: '',
    contract: '',
    housing: '',
    housingFree: false,
    headline: '',
    intro: '',
    sections: SECTION_TEMPLATES.slice(0, 4).map((t) => ({ title: t, items: [] })),
    photos: [],
    housingPhotos: [],
    housingNote: '',
    logo: '',
    reviews: [],
    seoTitle: '',
    seoDescription: '',
    createdAt: now,
    updatedAt: now,
  }
}

