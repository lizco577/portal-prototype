import { currentUserId, people, personById } from '@/data/people'
import { ORGANIZATIONS, TASK_STATUSES, TASK_TYPES, type Task } from '@/data/tasks'
import { isDueToday } from '@/lib/sla'

export type CardKey = 'mine' | 'overdue' | 'today' | 'inProgress'
export const CARD_LABEL: Record<CardKey, string> = {
  mine: 'My Tasks',
  overdue: 'Overdue',
  today: 'Due Today',
  inProgress: 'In Progress',
}

export type ColKey = 'type' | 'room' | 'org' | 'status' | 'claimed' | 'assignee'
export const COL_LABEL: Record<ColKey, string> = {
  type: 'Task type',
  room: 'Room type',
  org: 'Organization',
  status: 'Status',
  claimed: 'Claimed by',
  assignee: 'Assigned to',
}
export const UNASSIGNED = '__none'

export type Filters = {
  card: CardKey | null
  query: string
  priority: boolean
  cols: Record<ColKey, string[]>
}

export const emptyCols = (): Record<ColKey, string[]> => ({ type: [], room: [], org: [], status: [], claimed: [], assignee: [] })

export function cardMatch(card: CardKey, t: Task, now: number) {
  const active = t.status !== 'Done'
  switch (card) {
    // Includes tasks a teammate sent me for review (they are assigned to me while in review).
    case 'mine':
      return active && t.assigneeId === currentUserId
    case 'overdue':
      return active && t.dueAt != null && t.dueAt < now
    case 'today':
      return active && isDueToday(t.dueAt, now)
    case 'inProgress':
      return t.status === 'In Progress'
  }
}

export function colValue(col: ColKey, t: Task): string {
  switch (col) {
    case 'type':
      return t.type
    case 'room':
      return t.roomType
    case 'org':
      return t.org
    case 'status':
      return t.status
    case 'claimed':
      return t.claimedById ?? UNASSIGNED
    case 'assignee':
      return t.assigneeId ?? UNASSIGNED
  }
}

function queryMatch(q: string, t: Task) {
  if (!q) return true
  const who = personById(t.assigneeId)?.name ?? 'unassigned'
  return [t.type, t.roomType, t.roomId, t.claimId, t.org, t.status, who].join(' ').toLowerCase().includes(q)
}

/**
 * Does the task pass every filter? `skip` leaves one filter out, which is how
 * each control's counts are worked out (faceted counts), so a number next to a
 * value is always how many rows you'd get by picking it.
 */
export function passes(t: Task, f: Filters, now: number, isPriority: (t: Task) => boolean, skip?: ColKey | 'card' | 'priority') {
  if (skip !== 'card' && f.card && !cardMatch(f.card, t, now)) return false
  if (skip !== 'priority' && f.priority && !isPriority(t)) return false
  if (!queryMatch(f.query.trim().toLowerCase(), t)) return false
  for (const col of Object.keys(f.cols) as ColKey[]) {
    if (col === skip) continue
    const sel = f.cols[col]
    if (sel.length && !sel.includes(colValue(col, t))) return false
  }
  return true
}

/** Every possible value for a column, in display order. */
export function colOptions(col: ColKey, tasks: Task[]): string[] {
  switch (col) {
    case 'type':
      return [...TASK_TYPES]
    case 'status':
      return [...TASK_STATUSES]
    case 'org':
      return [...ORGANIZATIONS]
    case 'room':
      return [...new Set(tasks.map((t) => t.roomType))].sort()
    case 'claimed':
    case 'assignee':
      return [...people.map((p) => p.id), UNASSIGNED]
  }
}

export function valueLabel(col: ColKey, v: string) {
  if (col === 'assignee') return v === UNASSIGNED ? 'Unassigned' : personById(v)?.name ?? v
  if (col === 'claimed') return v === UNASSIGNED ? 'Not claimed' : personById(v)?.name ?? v
  return v
}

export function facetCounts(col: ColKey, tasks: Task[], f: Filters, now: number, isPriority: (t: Task) => boolean) {
  const counts = new Map<string, number>()
  for (const t of tasks) {
    if (!passes(t, f, now, isPriority, col)) continue
    const v = colValue(col, t)
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return counts
}
