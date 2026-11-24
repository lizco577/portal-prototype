// Mock data for the Damage Labeling and Image QA task pages.

export type Point = [number, number] // 0..1 inside the photo

export type Label = {
  id: string
  n: number
  points: Point[]
  surface: string
  material: string
  damage: string
}

export type PhotoState = {
  id: string
  imageId: string
  tone: string // placeholder photo colour, like the redacted photos in Figma
  bars: string // colour of the redacted rows
  labels: Label[]
  done: boolean
  noDamage: boolean
}

export type Material = { id: string; name: string; usage: number }

export const SURFACES = ['Ceiling', 'Wall', 'Floor', 'Door', 'Window', 'Cabinet']
export const DAMAGE_TYPES = ['Saturated', 'Stained', 'Mold', 'Cracked', 'Hole', 'Peeling', 'Warped']

// From "UI DL · Settings · Damage labels". Usage numbers are hidden: only used for "Most used" order.
export const INITIAL_MATERIALS: Material[] = [
  { id: 'm1', name: 'Acoustic Ceiling Tiles', usage: 188 },
  { id: 'm2', name: 'Concrete', usage: 645 },
  { id: 'm3', name: 'Drywall - Heavy hand texture', usage: 214 },
  { id: 'm4', name: 'Drywall - Hung and Fire taped', usage: 122 },
  { id: 'm5', name: 'Drywall - Knockdown texture', usage: 908 },
  { id: 'm6', name: 'Drywall - Popcorn', usage: 356 },
  { id: 'm7', name: 'Drywall - Smooth Texture', usage: 1377 },
  { id: 'm8', name: 'Drywall - standard orange peel', usage: 2018 },
  { id: 'm9', name: 'Gypsum', usage: 431 },
  { id: 'm10', name: 'Tile', usage: 862 },
  { id: 'm11', name: 'Wood', usage: 1204 },
]

const TONES: [string, string][] = [
  ['#1e1e1e', 'rgba(255,255,255,0.9)'],
  ['#2b2b2b', 'rgba(255,255,255,0.85)'],
  ['#1e1e1e', 'rgba(255,255,255,0.9)'],
  ['#6b4e46', 'rgba(255,255,255,0.35)'],
  ['#232a33', 'rgba(255,255,255,0.8)'],
  ['#9a9a9a', 'rgba(255,255,255,0.35)'],
  ['#3a3530', 'rgba(255,255,255,0.6)'],
]

function hexFrom(seed: string, len: number) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  let out = ''
  while (out.length < len) {
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    out += (h >>> 0).toString(16)
  }
  return out.slice(0, len)
}
export const fakeUuid = (seed: string) => {
  const x = hexFrom(seed, 32)
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`
}

export function buildPhotos(taskId: string): PhotoState[] {
  return TONES.map(([tone, bars], i) => ({
    id: `${taskId}-p${i}`,
    imageId: fakeUuid(`${taskId}-img-${i}`),
    tone,
    bars,
    labels: [],
    done: false,
    noDamage: false,
  }))
}

// Image QA: camera views. Some were auto-passed by the model; confidence shows on hover only.
export type IqaPhoto = { id: string; tone: string; autoPassed: boolean; confidence: number; kind: 'camera' | 'overview' | 'damage' }

export function buildIqaPhotos(taskId: string): IqaPhoto[] {
  const conf = [99.8, 99.7, 97.2, 99.9, 98.4, 99.6, 99.65, 96.1]
  const tones = ['#d8d2c7', '#c9cfd4', '#bfb6a8', '#d2d6d9', '#b9b1a4', '#cfc8bc', '#c4c9cc', '#b4aea5']
  return conf.map((c, i) => ({
    id: fakeUuid(`${taskId}-iqa-${i}`),
    tone: tones[i],
    autoPassed: c >= 99.6,
    confidence: c,
    kind: i < 4 ? 'camera' : i < 7 ? 'overview' : 'damage',
  }))
}

export const REVIEW_REPLIES = [
  'Drywall, smooth texture. You can see the tape seams near the corner.',
  'Looks like ceiling tile to me. The grid lines show at the top left.',
]
