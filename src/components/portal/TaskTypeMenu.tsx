import { Check } from 'lucide-react'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { TaskTypeChip } from '@/components/portal/chips'
import { TASK_TYPES, type TaskType } from '@/data/tasks'
import { cn } from '@/lib/utils'

/**
 * The one task type filter. Used by the toolbar dropdown, the Task Type column
 * header and the Filters menu, so all three behave the same and stay in sync.
 */
export function TaskTypeMenuItems({
  selected,
  counts,
  total,
  onSelect,
}: {
  selected: TaskType | null
  counts: Map<string, number>
  total: number
  onSelect: (t: TaskType | null) => void
}) {
  return (
    <>
      <Item active={selected === null} count={total} onSelect={() => onSelect(null)}>
        <span className="text-[13px]">All task types</span>
      </Item>
      <DropdownMenuSeparator />
      {TASK_TYPES.map((t) => (
        <Item key={t} active={selected === t} count={counts.get(t) ?? 0} onSelect={() => onSelect(t)}>
          <TaskTypeChip type={t} />
        </Item>
      ))}
    </>
  )
}

/**
 * Standard select row: label on the left, count right-aligned in grey, a check on the picked one.
 * Only the row under the mouse or keyboard gets the grey highlight.
 */
function Item({ active, count, onSelect, children }: { active: boolean; count: number; onSelect: () => void; children: React.ReactNode }) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="gap-2 py-[7px]">
      <span className="flex min-w-0 flex-1 items-center">{children}</span>
      <span className="text-[12px] text-[#a3a3a3] tabular-nums">{count}</span>
      <Check className={cn('size-3.5', !active && 'invisible')} />
    </DropdownMenuItem>
  )
}
