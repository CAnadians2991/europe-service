import 'server-only'
import FOCUS from '@/data/photo-focus.json'

/**
 * Where to keep the crop of a photo in a square / 4:3 card: the faces in it (OpenCV YuNet over every vacancy cover,
 * scripts/media/cover-focus.py, 15.10.2026 — 788 of 1 374 covers moved off the centre). Server-only: the map stays out of
 * the browser bundle, each card carries its own value. New covers: rerun the script and commit src/data/photo-focus.json.
 */
const MAP = FOCUS as Record<string, string>
export const focusOf = (base?: string): string | undefined => (base ? MAP[base] : undefined)
