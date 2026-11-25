export const TASK_TYPES = ['Damage Labeling', 'ImageQA', 'Modelling', 'Remodel', 'QA'] as const
export type TaskType = (typeof TASK_TYPES)[number]

export const TASK_STATUSES = ['Not started', 'In Progress', 'In review', 'Done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const ORGANIZATIONS = ['USAA', 'State Farm', 'Allstate', 'Liberty Mutual', 'hostalabs'] as const
export type Organization = (typeof ORGANIZATIONS)[number]

export type Task = {
  id: string
  type: TaskType
  roomType: string
  roomId: string
  claimId: string
  org: Organization
  status: TaskStatus
  /** absolute due time in ms, null when done */
  dueAt: number | null
  /** who the task is with now; for "In review" this is the reviewer */
  assigneeId: string | null
  /** set when a teammate sent the task to assigneeId for review */
  sentById: string | null
  claimedById: string | null
  claimOpened: string
  /** manual star: true/false overrides the entity priority, null follows it */
  star: boolean | null
}

// Small seeded generator so IDs stay the same on every load.
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}
const rand = seeded(42)
const hex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(rand() * 16).toString(16)).join('')
const uuid = () => `${hex(8)}-${hex(4)}-4${hex(3)}-${'89ab'[Math.floor(rand() * 4)]}${hex(3)}-${hex(12)}`

type Seed = [TaskType, string, Organization, TaskStatus, number | null, string | null, string, string?]

// [type, room, org, status, minutes until SLA (negative = overdue, null = done), assignee, claim opened, sent for review by]
const seeds: Seed[] = [
  ['Damage Labeling', 'hallway', 'USAA', 'Not started', -25, 'aatencio', 'Nov 21, 2026'],
  ['Remodel', 'kitchen', 'State Farm', 'Not started', 42, 'aatencio', 'Nov 20, 2026'],
  ['ImageQA', 'hallway', 'hostalabs', 'In Progress', 135, 'jaguda', 'Nov 22, 2026'],
  ['QA', 'dining', 'Allstate', 'Not started', 220, 'jcampos', 'Nov 19, 2026'],
  ['Modelling', 'living', 'USAA', 'Not started', 1560, null, 'Nov 23, 2026'],
  ['ImageQA', 'living', 'Liberty Mutual', 'Not started', 1740, null, 'Nov 23, 2026'],
  ['Damage Labeling', 'closet', 'State Farm', 'In review', 1860, 'aatencio', 'Nov 22, 2026', 'ecohen'],
  ['Modelling', 'bedroom', 'USAA', 'Not started', 2940, null, 'Nov 22, 2026'],
  ['Remodel', 'bathroom', 'Allstate', 'Not started', 3240, null, 'Nov 21, 2026'],
  ['QA', 'bathroom', 'hostalabs', 'Done', null, 'ecohen', 'Nov 18, 2026'],
  ['Damage Labeling', 'kitchen', 'Allstate', 'In Progress', -95, 'rpatel', 'Nov 20, 2026'],
  ['Modelling', 'basement', 'USAA', 'Not started', -310, 'lmoreno', 'Nov 19, 2026'],
  ['ImageQA', 'bedroom', 'State Farm', 'Not started', -12, null, 'Nov 21, 2026'],
  ['Damage Labeling', 'living', 'Liberty Mutual', 'In review', 18, 'jaguda', 'Nov 22, 2026', 'aatencio'],
  ['QA', 'kitchen', 'USAA', 'In review', 55, 'aatencio', 'Nov 21, 2026', 'jaguda'],
  ['Remodel', 'hallway', 'hostalabs', 'Not started', 75, null, 'Nov 22, 2026'],
  ['Modelling', 'kitchen', 'USAA', 'In Progress', 110, 'aatencio', 'Nov 20, 2026'],
  ['Damage Labeling', 'bathroom', 'State Farm', 'In Progress', 165, 'aatencio', 'Nov 23, 2026'],
  ['ImageQA', 'dining', 'Allstate', 'Not started', 190, null, 'Nov 23, 2026'],
  ['Modelling', 'garage', 'Liberty Mutual', 'In review', 260, 'lmoreno', 'Nov 22, 2026', 'rpatel'],
  ['Damage Labeling', 'bedroom', 'USAA', 'Not started', 330, 'ecohen', 'Nov 23, 2026'],
  ['QA', 'living', 'State Farm', 'Not started', 480, null, 'Nov 23, 2026'],
  ['Remodel', 'bedroom', 'USAA', 'In Progress', 620, 'rpatel', 'Nov 21, 2026'],
  ['ImageQA', 'kitchen', 'hostalabs', 'Not started', 900, null, 'Nov 24, 2026'],
  ['Modelling', 'dining', 'Allstate', 'Not started', 1320, null, 'Nov 24, 2026'],
  ['Damage Labeling', 'garage', 'Liberty Mutual', 'Not started', 2100, null, 'Nov 24, 2026'],
  ['ImageQA', 'bathroom', 'USAA', 'Done', null, 'bnguyen', 'Nov 17, 2026'],
  ['Modelling', 'hallway', 'State Farm', 'Done', null, 'lmoreno', 'Nov 16, 2026'],
  ['Remodel', 'living', 'Allstate', 'Not started', 4380, null, 'Nov 24, 2026'],
  ['Damage Labeling', 'dining', 'hostalabs', 'Done', null, 'aatencio', 'Nov 15, 2026'],
]

// A couple of fixed room IDs from the Figma frames, the rest generated.
const fixedRoomIds = [
  '661ad261-914d-4b3e-87b5-cff788d05983',
  'afeb60d6-dc28-47a5-9c02-55e490aaf2b9',
  '5c00c194-3f83-4a95-904c-20063a901cbf',
  '8c6a7645-a7bc-45e5-b92f-6d6a389ab7f5',
  '6eb70ce2-d0c1-40b8-a3a5-3dcf766cee69',
  '15ce2635-72b9-4c96-af13-e4267483fe5f',
  '7ab25ac5-3d59-4e86-92ea-b8d693a19b7e',
  '045e426d-42fd-4391-a97d-2870db1a0d3c',
  'aa2cf044-0f60-4235-bb91-dd598b2b7f6b',
  'eb29656e-e140-4bdc-bff0-462e465136ad',
]

export function buildTasks(now: number): Task[] {
  return seeds.map(([type, roomType, org, status, mins, assigneeId, claimOpened, sentById], i) => ({
    id: uuid(),
    type,
    roomType,
    roomId: fixedRoomIds[i] ?? uuid(),
    claimId: uuid(),
    org,
    status,
    dueAt: mins == null ? null : now + mins * 60000,
    assigneeId,
    sentById: sentById ?? null,
    claimedById: status === 'Not started' ? null : (sentById ?? assigneeId),
    claimOpened,
    star: null,
  }))
}
