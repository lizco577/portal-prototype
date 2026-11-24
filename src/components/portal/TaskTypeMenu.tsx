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
      <Item active={selected === null} onSelect={() => onSelect(null)}>
        <span className="flex-1">All task types</span>
        <span className="text-[#a3a3a3] tabular-nums">· {total}</span>
      </Item>
      <DropdownMenuSeparator />
      {TASK_TYPES.map((t) => (
        <Item key={t} active={selected === t} onSelect={() => onSelect(t)}>
          <span className="flex flex-1 items-center gap-2">
            <TaskTypeChip type={t} />
            <span className="text-[#a3a3a3] tabular-nums">· {counts.get(t) ?? 0}</span>
          </span>
        </Item>
      ))}
    </>
  )
}

function Item({ active, onSelect, children }: { active: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <DropdownMenuItem onSelect={onSelect} className={cn('gap-2 py-[7px] text-[13px]', active && 'bg-[#f5f5f5]')}>
      {children}
      <Check className={cn('size-3.5', !active && 'invisible')} />
    </DropdownMenuItem>
  )
}
