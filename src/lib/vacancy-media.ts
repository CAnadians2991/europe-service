import data from '@/data/vacancy-media.json'
import type { VideoCard } from './video-reviews'

/**
 * The agency's own media from its Drive attached to vacancies (scripts/media/attach_vacancy_media.py): video reviews and
 * housing tours, housing photos, a few own workplace photos — face-checked, our logo burned in. Keyed by the Ukrainian path.
 */
type Entry = {
  videos?: { src: string; cover: string; name?: string; dur?: string; uk?: string; ru?: string; kind?: 'review' | 'housing' }[]
  housing?: string[]
  work?: string[]
}
const MEDIA = data as Record<string, Entry>

export function vacancyMedia(path: string, lang: 'uk' | 'ru') {
  const e = MEDIA[path.replace(/^\/ru(?=\/)/, '')] ?? {}
  const videos: VideoCard[] = (e.videos ?? []).map((v) => ({
    key: v.src,
    src: v.src,
    yt: false,
    cover: v.cover,
    title: (lang === 'uk' ? v.uk : v.ru) || (v.kind === 'housing' ? (lang === 'uk' ? 'Огляд житла' : 'Обзор жилья') : lang === 'uk' ? 'Відгук працівника' : 'Отзыв работника'),
    name: v.name ?? '',
    place: '',
    dur: v.dur,
  }))
  return { videos, housing: e.housing ?? [], work: e.work ?? [] }
}
