import {
  AlarmClock,
  Box,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Clock,
  Eye,
  FileCheck,
  Hourglass,
  Image,
  RefreshCw,
  ScanLine,
  type LucideIcon,
} from 'lucide-react'
import type { TaskStatus, TaskType } from '@/data/tasks'
import { formatDuration, slaState, type SlaState } from '@/lib/sla'
import { cn } from '@/lib/utils'

// Colours copied from "Components · Portal UI" (Task type chip).
export const TASK_TYPE_STYLE: Record<TaskType, { bg: string; border: string; text: string; icon: LucideIcon; label: string }> = {
  Modelling: { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce', icon: Box, label: 'Modelling' },
  ImageQA: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: Image, label: 'ImageQA' },
  'Damage Labeling': { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', icon: ScanLine, label: 'Damage Labeling' },
  Remodel: { bg: '#fefce8', border: '#fde68a', text: '#a16207', icon: RefreshCw, label: 'Remodel' },
  QA: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', icon: FileCheck, label: 'QA' },
}

export function TaskTypeChip({ type, className }: { type: TaskType; className?: string }) {
  const s = TASK_TYPE_STYLE[type]
  const Icon = s.icon
  return (
    <span
      className={cn('inline-flex shrink-0 items-center gap-[5px] rounded-[6px] border py-[3px] pr-[9px] pl-[8px] text-[11.5px] font-medium whitespace-nowrap', className)}
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      <Icon className="size-3" strokeWidth={2} />
      {s.label}
    </span>
  )
}

// Colours copied from "Components · Portal UI" (Task status).
const STATUS_STYLE: Record<TaskStatus, { bg: string; border: string; text: string; icon: LucideIcon }> = {
  'Not started': { bg: '#f5f5f5', border: '#e5e5e5', text: '#525252', icon: CircleDashed },
  'In Progress': { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: Clock },
  'In review': { bg: '#ffffff', border: '#a3a3a3', text: '#262626', icon: Eye },
  Done: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', icon: CircleCheck },
}

export function TaskStatusChip({ status }: { status: TaskStatus }) {
  const s = STATUS_STYLE[status]
  const Icon = s.icon
  return (
    <span
      className="inline-flex shrink-0 items-center gap-[5px] rounded-[11px] border px-2 py-[3px] text-[11.5px] font-medium whitespace-nowrap"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      <Icon className="size-3" strokeWidth={2} />
      {status}
    </span>
  )
}

// SLA pill, style B from "SLA warning approaches", extended to four buckets.
// Every bucket has a word and an icon as well as a colour, so it never relies on colour alone.
export const SLA_STYLE: Record<Exclude<SlaState, 'none'>, { bg: string; text: string; word: string; hint: string; icon: LucideIcon }> = {
  overdue: { bg: '#b91c1c', text: '#ffffff', word: 'Overdue', hint: 'Past the SLA due time', icon: CircleAlert },
  critical: { bg: 'rgba(220,38,38,0.16)', text: '#b91c1c', word: 'Due soon', hint: 'Under 1 hour left', icon: AlarmClock },
  warning: { bg: 'rgba(234,179,8,0.22)', text: '#854d0e', word: 'Close', hint: '1 to 3 hours left', icon: Hourglass },
  ok: { bg: 'rgba(22,163,74,0.14)', text: '#15803d', word: 'On track', hint: 'More than 3 hours left', icon: Clock },
}

export function SlaPill({ mins }: { mins: number | null }) {
  const state = slaState(mins)
  if (state === 'none') return <span className="text-[12.5px] text-[#a3a3a3]">--</span>
  const s = SLA_STYLE[state]
  const Icon = s.icon
  return (
    <span
      className="inline-flex shrink-0 items-center gap-[5px] rounded-full px-2 py-[3px] text-[12px] whitespace-nowrap tabular-nums"
      style={{ background: s.bg, color: s.text }}
      title={`${s.hint}${mins != null && mins < 0 ? ` by ${formatDuration(mins)}` : ''}`}
    >
      <Icon className="size-3" strokeWidth={2.25} />
      <span className="font-semibold">{s.word}</span>
      <span className="opacity-60">·</span>
      <span className="font-medium">{formatDuration(mins!)}</span>
    </span>
  )
}
