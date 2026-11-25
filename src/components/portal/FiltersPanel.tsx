import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TaskTypeChip } from '@/components/portal/chips'
import { FilterList } from '@/components/portal/FilterPicker'
import { TASK_TYPES, type TaskType } from '@/data/tasks'
import { COL_LABEL, type ColKey } from '@/lib/filters'
import { cn } from '@/lib/utils'

type ListProps = {
  col: ColKey
  options: string[]
  counts: Map<string, number>
  selected: string[]
  onChange: (next: string[]) => void
}

/**
 * Filters, in one panel that drills in place (like Linear or GitHub Projects): the first view lists
 * every filter; choosing one swaps the panel to its values, with a back link. Only one window is
 * ever open. Counts and chevrons share one right-hand column.
 */
export function FiltersPanel({
  priority,
  priorityCount,
  onPriority,
  typeSel,
  typeTotal,
  typeCounts,
  onType,
  pickerCols,
  listProps,
  activeCount,
  onClearAll,
}: {
  priority: boolean
  priorityCount: number
  onPriority: (on: boolean) => void
  typeSel: TaskType | null
  typeTotal: number
  typeCounts: Map<string, number>
  onType: (t: TaskType | null) => void
  pickerCols: ColKey[]
  listProps: (col: ColKey) => ListProps
  activeCount: number
  onClearAll: () => void
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'root' | 'type' | ColKey>('root')

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setView('root')
      }}
    >
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-[35px] shrink-0 items-center gap-[7px] rounded-[7px] border bg-white pr-[14px] pl-[13px] text-[12.5px] font-medium whitespace-nowrap hover:bg-[#fafafa]',
            activeCount > 0 ? 'border-[#a3a3a3]' : 'border-[#e5e5e5]',
          )}
        >
          <SlidersHorizontal className="size-3.5" /> Filters
          {activeCount > 0 && <span className="ml-0.5 rounded-full bg-[#171717] px-1.5 text-[11px] leading-[18px] text-white">{activeCount}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="max-h-[min(460px,var(--radix-popover-content-available-height))] w-[260px] gap-0 overflow-y-auto rounded-[10px] p-[6px] shadow-[0px_6px_16px_0px_rgba(0,0,0,0.1)]"
      >
        {view === 'root' ? (
          <div className="flex flex-col gap-[2px]">
            {/* Priority is on/off, so it's a checkbox here rather than a list */}
            <RootRow onClick={() => onPriority(!priority)} right={<Count n={priorityCount} />} chevron={false}>
              <Box checked={priority} />
              Priority
            </RootRow>
            <div className="my-[2px] h-px bg-[#e5e5e5]" />
            <RootRow onClick={() => setView('type')} right={typeSel ? <Count n={1} dark /> : null}>
              Task type
            </RootRow>
            {pickerCols.map((c) => {
              const n = listProps(c).selected.length
              return (
                <RootRow key={c} onClick={() => setView(c)} right={n ? <Count n={n} dark /> : null}>
                  {COL_LABEL[c]}
                </RootRow>
              )
            })}
            {activeCount > 0 && (
              <>
                <div className="my-[2px] h-px bg-[#e5e5e5]" />
                <button onClick={onClearAll} className="rounded-md px-2 py-[7px] text-left text-[13px] text-[#525252] hover:bg-[#f5f5f5]">
                  Clear all filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-[2px]">
            <button
              onClick={() => setView('root')}
              className="mb-1 flex items-center gap-1 rounded-md px-1.5 py-[6px] text-left text-[12.5px] font-medium text-[#525252] hover:bg-[#f5f5f5]"
            >
              <ChevronLeft className="size-4" />
              {view === 'type' ? 'Task type' : COL_LABEL[view]}
            </button>
            <div className="mb-1 h-px bg-[#e5e5e5]" />
            {view === 'type' ? (
              <>
                <TypeRow active={typeSel === null} count={typeTotal} onClick={() => onType(null)}>
                  <span className="text-[13px]">All task types</span>
                </TypeRow>
                <div className="my-[2px] h-px bg-[#e5e5e5]" />
                {TASK_TYPES.map((t) => (
                  <TypeRow key={t} active={typeSel === t} count={typeCounts.get(t) ?? 0} onClick={() => onType(t)}>
                    <TaskTypeChip type={t} />
                  </TypeRow>
                ))}
              </>
            ) : (
              <FilterList {...listProps(view)} />
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** A row in the first view. The right column holds the count, then the chevron, so they always line up. */
function RootRow({
  onClick,
  right,
  chevron = true,
  children,
}: {
  onClick: () => void
  right: React.ReactNode
  chevron?: boolean
  children: React.ReactNode
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-[10px] rounded-md py-[7px] pr-[6px] pl-2 text-left text-[13px] text-[#171717] hover:bg-[#f5f5f5]">
      <span className="flex min-w-0 flex-1 items-center gap-[10px]">{children}</span>
      <span className="flex items-center gap-1.5">
        {right}
        <ChevronRight className={cn('size-4 text-[#a3a3a3]', !chevron && 'invisible')} />
      </span>
    </button>
  )
}

function Count({ n, dark }: { n: number; dark?: boolean }) {
  return <span className={cn('text-[12px] tabular-nums', dark ? 'text-[#525252]' : 'text-[#a3a3a3]')}>{n}</span>
}

function Box({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
        checked ? 'border-[#171717] bg-[#171717] text-white' : 'border-[#d4d4d4] bg-white',
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  )
}

/** Task type is a single pick: label left, count right, check on the picked one. */
function TypeRow({ active, count, onClick, children }: { active: boolean; count: number; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-md py-[6px] pr-2 pl-2 text-left hover:bg-[#f5f5f5]">
      <span className="flex min-w-0 flex-1 items-center">{children}</span>
      <span className="text-[12px] text-[#a3a3a3] tabular-nums">{count}</span>
      <Check className={cn('size-3.5', !active && 'invisible')} />
    </button>
  )
}
