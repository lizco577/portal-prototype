import {
  AlarmClock,
  Box,
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
import { slaLabel, slaState, type SlaState } from '@/lib/sla'
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
  Waiting: { bg: '#fafafa', border: '#e5e5e5', text: '#737373', icon: Hourglass },
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
export const SLA_STYLE: Record<Exclude<SlaState, 'none'>, { bg: string; text: string; label: string }> = {
  overdue: { bg: '#b91c1c', text: '#ffffff', label: 'Overdue' },
  critical: { bg: 'rgba(220,38,38,0.16)', text: '#b91c1c', label: 'Under 1 hour' },
  warning: { bg: 'rgba(234,179,8,0.22)', text: '#854d0e', label: '1 to 3 hours' },
  ok: { bg: 'rgba(22,163,74,0.14)', text: '#15803d', label: 'More than 3 hours' },
}

export function SlaPill({ mins }: { mins: number | null }) {
  const state = slaState(mins)
  if (state === 'none') return <span className="text-[12.5px] text-[#a3a3a3]">--</span>
  const s = SLA_STYLE[state]
  const Icon = state === 'overdue' || state === 'critical' ? AlarmClock : Clock
  return (
    <span
      className="inline-flex shrink-0 items-center gap-[5px] rounded-full px-2 py-[3px] text-[12px] font-semibold whitespace-nowrap tabular-nums"
      style={{ background: s.bg, color: s.text }}
      title={s.label}
    >
      <Icon className="size-3" strokeWidth={2.25} />
      {slaLabel(mins)}
    </span>
  )
}
