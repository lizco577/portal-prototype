import { useState, type ReactNode } from 'react'
import { Check, ListFilter, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar } from '@/components/portal/assignee'
import { TaskStatusChip, TaskTypeChip } from '@/components/portal/chips'
import { personById } from '@/data/people'
import type { TaskStatus, TaskType } from '@/data/tasks'
import { COL_LABEL, UNASSIGNED, valueLabel, type ColKey } from '@/lib/filters'
import { cn } from '@/lib/utils'

/** How each value is drawn in a picker: the same chips and avatars as the table. */
export function ValueView({ col, value }: { col: ColKey; value: string }) {
  if (col === 'type') return <TaskTypeChip type={value as TaskType} />
  if (col === 'status') return <TaskStatusChip status={value as TaskStatus} />
  if (col === 'assignee') {
    const p = value === UNASSIGNED ? null : personById(value)
    return (
      <span className="flex items-center gap-[10px]">
        <Avatar person={p} />
        <span className="text-[13px] text-[#171717]">{valueLabel(col, value)}</span>
      </span>
    )
  }
  return <span className="text-[13px] text-[#171717]">{value}</span>
}

type ListProps = {
  col: ColKey
  options: string[]
  counts: Map<string, number>
  selected: string[]
  onChange: (next: string[]) => void
}

/** The checkbox list itself, shared by the column header pickers. Styled like the "Assign to" picker. */
export function FilterList({ col, options, counts, selected, onChange }: ListProps) {
  const [q, setQ] = useState('')
  const searchable = col === 'room'
  const shown = searchable ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])
  const total = [...counts.values()].reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-[2px]">
      {searchable && (
        <div className="mb-1 flex items-center gap-2 rounded-md border border-[#e5e5e5] px-[10px] py-[7px]">
          <Search className="size-3.5 text-[#a3a3a3]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search room types…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]"
          />
        </div>
      )}
      {col === 'type' && (
        <>
          <Row checked={selected.length === 0} onClick={() => onChange([])} count={total}>
            <span className="text-[13px] text-[#171717]">All task types</span>
          </Row>
          <div className="my-[2px] h-px bg-[#e5e5e5]" />
        </>
      )}
      {col === 'assignee' && <div className="pt-1 pb-[2px] pl-2 text-[11.5px] font-medium text-[#737373]">People</div>}
      {shown.map((v) => (
        <Fragment key={v} divider={col === 'assignee' && v === UNASSIGNED}>
          <Row checked={selected.includes(v)} onClick={() => toggle(v)} count={counts.get(v) ?? 0}>
            <ValueView col={col} value={v} />
          </Row>
        </Fragment>
      ))}
      {shown.length === 0 && <div className="px-2 py-3 text-[12.5px] text-[#737373]">No room types match.</div>}
      {selected.length > 0 && (
        <>
          <div className="my-[2px] h-px bg-[#e5e5e5]" />
          <button onClick={() => onChange([])} className="rounded-md px-2 py-[6px] text-left text-[12.5px] text-[#525252] hover:bg-[#f5f5f5]">
            Clear {COL_LABEL[col].toLowerCase()} filter
          </button>
        </>
      )}
    </div>
  )
}

function Fragment({ children, divider }: { children: ReactNode; divider?: boolean }) {
  return (
    <>
      {divider && <div className="my-[2px] h-px bg-[#e5e5e5]" />}
      {children}
    </>
  )
}

function Row({ checked, onClick, count, children }: { checked: boolean; onClick: () => void; count: number; children: ReactNode }) {
  return (
    <button
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={onClick}
      className={cn('flex w-full items-center gap-[10px] rounded-md py-[6px] pr-[10px] pl-2 text-left hover:bg-[#f5f5f5]', checked && 'bg-[#f5f5f5]')}
    >
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
          checked ? 'border-[#171717] bg-[#171717] text-white' : 'border-[#d4d4d4] bg-white',
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      <span className={cn('text-[11.5px] tabular-nums', count ? 'text-[#737373]' : 'text-[#d4d4d4]')}>{count}</span>
    </button>
  )
}

/** Column header filter: the icon turns dark when the filter is on. */
export function ColumnFilter(props: ListProps) {
  const active = props.selected.length > 0
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`Filter ${COL_LABEL[props.col]}`}
          className={cn(
            'flex size-6 items-center justify-center rounded-md',
            active ? 'bg-[#171717] text-white' : 'text-[#a3a3a3] hover:bg-black/5 hover:text-[#525252]',
          )}
        >
          <ListFilter className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="max-h-[var(--radix-popover-content-available-height)] w-[260px] gap-0 overflow-y-auto rounded-[10px] p-[6px] shadow-[0px_6px_16px_0px_rgba(0,0,0,0.1)]"
      >
        <FilterList {...props} />
      </PopoverContent>
    </Popover>
  )
}
