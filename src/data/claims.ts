import type { Organization, Task } from '@/data/tasks'

// Claims and Pipeline pages: copies of today's portal (CL1–CL5, PL1–PL2).
// Addresses and customer IDs are made up. The screenshots show real customers, which can't go on a public site.

export type Claim = {
  id: string
  customerId: string
  street: string
  cityLine: string
  org: string
  rooms: number
  adjuster: string
  received: string
  firstPhotos: string
  lastPhotos: string
  completed: string
  status: 'Processing' | 'Complete'
  roomTypes: string[]
}

const ORG_SLUG: Record<Organization, string> = {
  USAA: 'claimx|usaa',
  'State Farm': 'claimx|statefarm',
  Allstate: 'claimx|allstate',
  'Liberty Mutual': 'claimx|libertymutual',
  hostalabs: 'hostalabs',
}

const STREETS = [
  ['412 MAPLE HOLLOW DR', 'FAIRVIEW, VA, US, 23601'],
  ['88 BIRCHWOOD CT', 'STAFFORD, VA, US, 22554'],
  ['1907 QUARRY RIDGE RD', 'ELLICOTT CITY, MD, US, 21043'],
  ['5520 LANTERN GLEN AVE', 'PARKVILLE, MD, US, 21234'],
  ['27 OSPREY LN', 'BALTIMORE, MD, US, 21225'],
  ['640 CEDAR BLUFF RD', 'RANDOLPH, NJ, US, 07869'],
  ['3315 WILLOW BEND ST', 'AKRON, OH, US, 44304'],
  ['71 HARBOR VIEW TER', 'WOODBRIDGE, VA, US, 22193'],
  ['902 STONEGATE CIR', 'ASHBURN, VA, US, 20147'],
  ['14 FOXTAIL WAY', 'WARREN, MI, US, 48093'],
  ['230 ORCHARD PARK LN', 'KEYSER, WV, US, 26726'],
  ['1188 PRAIRIE WIND DR', 'LAWRENCE, KS, US, 66044'],
  ['56 SILVER CREEK RD', 'BOZEMAN, MT, US, 59715'],
  ['7402 JUNIPER SPRINGS', 'TUCSON, AZ, US, 85718'],
  ['19 BLUE HERON PL', 'SAVANNAH, GA, US, 31406'],
]

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

/** One claim per claim ID in the task list, so a task's claim always has a detail page. */
export function buildClaims(tasks: Task[]): Claim[] {
  const byClaim = new Map<string, Task[]>()
  for (const t of tasks) byClaim.set(t.claimId, [...(byClaim.get(t.claimId) ?? []), t])
  return [...byClaim.entries()].map(([id, ts], i) => {
    const h = hash(id)
    const [street, cityLine] = STREETS[i % STREETS.length]
    const day = 12 + (h % 12)
    const done = ts.every((t) => t.status === 'Done')
    return {
      id,
      customerId: `08${String(40000000 + (h % 9999999)).padStart(8, '0')}`,
      street,
      cityLine,
      org: ORG_SLUG[ts[0].org],
      rooms: new Set(ts.map((t) => t.roomId)).size,
      adjuster: ts[0].org === 'hostalabs' ? 'platform-test-automation' : '-',
      received: `11/${day}/2026 9:${String(10 + (h % 49)).padStart(2, '0')} AM`,
      firstPhotos: `11/${day}/2026 11:02 AM`,
      lastPhotos: `11/${day}/2026 11:47 AM`,
      completed: done ? `11/${day + 2}/2026 4:15 PM` : '-',
      status: done ? 'Complete' : 'Processing',
      roomTypes: [...new Set(ts.map((t) => t.roomType))],
    }
  })
}

export type PipelineRow = {
  roomId: string
  claimId: string
  customerId: string
  status: 'Processing' | 'Processed' | 'Failed'
  stage: 'Automation' | 'Image-QA' | 'Modelling' | 'Damage-Labeling' | 'QA'
}

const STAGE: Record<Task['type'], PipelineRow['stage']> = {
  ImageQA: 'Image-QA',
  Modelling: 'Modelling',
  Remodel: 'Modelling',
  'Damage Labeling': 'Damage-Labeling',
  QA: 'QA',
}

/** One row per room: where it is in the pipeline. */
export function buildPipeline(tasks: Task[], claims: Claim[]): PipelineRow[] {
  const seen = new Set<string>()
  const rows: PipelineRow[] = []
  for (const t of tasks) {
    if (seen.has(t.roomId)) continue
    seen.add(t.roomId)
    const claim = claims.find((c) => c.id === t.claimId)
    rows.push({
      roomId: t.roomId,
      claimId: t.claimId,
      customerId: claim?.customerId ?? '-',
      // a sideways room fails automation until the photos are rotated (Q2)
      status: t.sideways ? 'Failed' : t.status === 'Done' ? 'Processed' : 'Processing',
      stage: t.status === 'Done' ? 'QA' : STAGE[t.type],
    })
  }
  // A couple of rooms still in automation, as at the top of PL1.
  return [
    { ...rows[0], roomId: '5c00c194-3f83-4a95-904c-20063a901cbf', status: 'Processing', stage: 'Automation' },
    ...rows.filter((r) => r.roomId !== '5c00c194-3f83-4a95-904c-20063a901cbf'),
  ]
}
