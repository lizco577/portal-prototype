// SLA buckets agreed in review:
// overdue = dark red + white text, under 1h = red, 1 to 3h = yellow, over 3h = green.
export type SlaState = 'overdue' | 'critical' | 'warning' | 'ok' | 'none'

export const SLA_ORDER: Record<SlaState, number> = {
  overdue: 0,
  critical: 1,
  warning: 2,
  ok: 3,
  none: 4,
}

export function minutesLeft(dueAt: number | null, now: number) {
  return dueAt == null ? null : Math.round((dueAt - now) / 60000)
}

export function slaState(mins: number | null): SlaState {
  if (mins == null) return 'none'
  if (mins < 0) return 'overdue'
  if (mins < 60) return 'critical'
  if (mins <= 180) return 'warning'
  return 'ok'
}

export function formatDuration(mins: number) {
  const m = Math.abs(mins)
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  const mm = m % 60
  if (d) return h ? `${d}d ${h}h` : `${d}d`
  if (h) return mm ? `${h}h ${mm}m` : `${h}h`
  return `${mm}m`
}

export function slaLabel(mins: number | null) {
  if (mins == null) return '--'
  if (mins < 0) return `${formatDuration(mins)} overdue`
  if (mins < 60) return `${formatDuration(mins)} left`
  return formatDuration(mins)
}

const MS_DAY_END = () => {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/** Due before the end of today, not already overdue. */
export function isDueToday(dueAt: number | null, now: number) {
  return dueAt != null && dueAt >= now && dueAt <= MS_DAY_END()
}
