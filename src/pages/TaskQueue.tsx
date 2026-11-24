import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  Clock,
  Columns3,
  Ellipsis,
  ExternalLink,
  Hand,
  Hash,
  Search,
  SlidersHorizontal,
  User,
  UserRoundCheck,
  X,
  type LucideIcon,
} from 'lucide-react'
import { AppShell } from '@/components/portal/AppShell'
import { AssigneeCell } from '@/components/portal/assignee'
import { SlaPill, TaskStatusChip, TaskTypeChip } from '@/components/portal/chips'
import { ColumnFilter, FilterList } from '@/components/portal/FilterPicker'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { currentUserId, personById } from '@/data/people'
import { TASK_TYPES, type Task, type TaskType } from '@/data/tasks'
import {
  CARD_LABEL,
  cardMatch,
  COL_LABEL,
  colOptions,
  emptyCols,
  facetCounts,
  passes,
  valueLabel,
  type CardKey,
  type ColKey,
  type Filters,
} from '@/lib/filters'
import { minutesLeft, slaState } from '@/lib/sla'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const COLUMNS = [
  { key: 'sla', label: 'SLA' },
  { key: 'type', label: 'Task Type' },
  { key: 'room', label: 'Room Type' },
  { key: 'roomId', label: 'Room ID' },
  { key: 'org', label: 'Organization' },
  { key: 'status', label: 'Status' },
  { key: 'assignee', label: 'Assigned to' },
] as const
type ShowKey = (typeof COLUMNS)[number]['key']
const FILTER_COLS: ColKey[] = ['type', 'room', 'org', 'status', 'assignee']

const CARDS: { key: CardKey; icon: LucideIcon; hint: string; danger?: boolean }[] = [
  { key: 'mine', icon: User, hint: 'Assigned to you, including reviews' },
  { key: 'overdue', icon: CircleAlert, hint: 'Past due date', danger: true },
  { key: 'today', icon: CalendarClock, hint: 'Must finish today to meet SLA' },
  { key: 'inProgress', icon: Clock, hint: 'Currently being worked on' },
]

export default function TaskQueue() {
  const { tasks, now, updateTask } = useStore()
  const [filters, setFilters] = useState<Filters>({ card: null, query: '', cols: emptyCols() })
  const [slaAsc, setSlaAsc] = useState(true)
  const [hidden, setHidden] = useState<Set<ShowKey>>(new Set())
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(0)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  // Any filter change goes back to page 1.
  const update = (fn: (f: Filters) => Filters) => {
    setFilters(fn)
    setPage(0)
  }
  const setCol = (col: ColKey, values: string[]) => update((f) => ({ ...f, cols: { ...f.cols, [col]: values } }))
  const toggleCard = (card: CardKey) => {
    if (card === 'overdue') setSlaAsc(true) // overdue reads oldest first
    update((f) => ({ ...f, card: f.card === card ? null : card }))
  }
  const clearAll = () => update((f) => ({ ...f, card: null, cols: emptyCols() }))

  const rows = useMemo(() => {
    const dir = slaAsc ? 1 : -1
    return tasks
      .filter((t) => passes(t, filters, now))
      .sort((a, b) => {
        if ((a.dueAt == null) !== (b.dueAt == null)) return a.dueAt == null ? 1 : -1 // done at the bottom
        if (a.dueAt == null || b.dueAt == null) return 0
        return (a.dueAt - b.dueAt) * dir
      })
  }, [tasks, filters, now, slaAsc])

  // Faceted counts: each number is how many rows you'd see by picking that option.
  const facets = useMemo(
    () => Object.fromEntries(FILTER_COLS.map((c) => [c, facetCounts(c, tasks, filters, now)])) as Record<ColKey, Map<string, number>>,
    [tasks, filters, now],
  )
  const options = useMemo(
    () => Object.fromEntries(FILTER_COLS.map((c) => [c, colOptions(c, tasks)])) as Record<ColKey, string[]>,
    [tasks],
  )
  const cardCount = (card: CardKey) => tasks.filter((t) => passes(t, filters, now, 'card') && cardMatch(card, t, now)).length
  const typeTotal = [...facets.type.values()].reduce((a, b) => a + b, 0)
  const typeSel = filters.cols.type
  const activeColCount = FILTER_COLS.filter((c) => filters.cols[c].length).length

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const pageRows = rows.slice(safePage * pageSize, safePage * pageSize + pageSize)
  const show = (k: ShowKey) => !hidden.has(k)
  const filterProps = (col: ColKey) => ({
    col,
    options: options[col],
    counts: facets[col],
    selected: filters.cols[col],
    onChange: (v: string[]) => setCol(col, v),
  })

  const claim = (t: Task) => {
    updateTask(t.id, { claimedById: currentUserId, assigneeId: currentUserId, status: t.status === 'Not started' ? 'In Progress' : t.status })
    setToast(`Claimed ${t.type} · ${t.roomType}`)
  }
  const unclaim = (t: Task) => {
    updateTask(t.id, { claimedById: null, status: t.status === 'In Progress' ? 'Not started' : t.status })
    setToast(`Released ${t.type} · ${t.roomType}`)
  }
  // Reassigning a claimed task hands the claim over too; unassigning releases it.
  const reassign = (t: Task, id: string | null) => {
    const claimed = t.claimedById != null
    updateTask(t.id, {
      assigneeId: id,
      sentById: null,
      claimedById: claimed ? id : null,
      status: claimed && !id && t.status === 'In Progress' ? 'Not started' : t.status,
    })
    const who = personById(id)
    setToast(who ? `Assigned to ${who.name}` : 'Unassigned')
  }
  const copy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {})
    setToast(`${label} copied`)
  }

  const dropdownLabel =
    typeSel.length === 0
      ? `All task types · ${typeTotal}`
      : typeSel.length === 1
        ? `${typeSel[0]} · ${rows.length}`
        : `${typeSel.length} task types · ${rows.length}`

  return (
    <AppShell crumbs={[{ label: 'Tasks' }]} search={{ value: filters.query, onChange: (q) => update((f) => ({ ...f, query: q })) }}>
      <div className="flex flex-col gap-4 px-[17px] pt-4 pb-6">
        {/* Summary cards: click to filter, click again to clear */}
        <div className="grid grid-cols-4 gap-[18px]">
          {CARDS.map((c) => (
            <SummaryCard
              key={c.key}
              title={CARD_LABEL[c.key]}
              icon={c.icon}
              value={cardCount(c.key)}
              hint={c.hint}
              danger={c.danger}
              selected={filters.card === c.key}
              onClick={() => toggleCard(c.key)}
            />
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-[10px] [&>*]:shrink-0 [&>div]:shrink">
          <label className="flex h-9 w-[286px] items-center gap-2 rounded-lg border border-[#e5e5e5] px-[13px] focus-within:border-[#a3a3a3]">
            <Search className="size-3.5 text-[#a3a3a3]" />
            <input
              value={filters.query}
              onChange={(e) => update((f) => ({ ...f, query: e.target.value }))}
              placeholder="Search tasks..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]"
            />
            {filters.query && (
              <button onClick={() => update((f) => ({ ...f, query: '' }))} aria-label="Clear search">
                <X className="size-3.5 text-[#737373]" />
              </button>
            )}
          </label>

          {/* Filters: every column filter in one place */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton active={activeColCount > 0}>
                <SlidersHorizontal className="size-3.5" /> Filters
                {activeColCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-[#171717] px-1.5 text-[11px] leading-[18px] text-white">{activeColCount}</span>
                )}
              </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              {FILTER_COLS.map((c) => (
                <DropdownMenuSub key={c}>
                  <DropdownMenuSubTrigger className="text-[13px]">
                    <span className="flex-1">{COL_LABEL[c]}</span>
                    {filters.cols[c].length > 0 && <span className="text-[11.5px] text-[#737373]">{filters.cols[c].length}</span>}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-[420px] w-[260px] overflow-y-auto p-[6px]">
                    <FilterList {...filterProps(c)} />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
              {activeColCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-[13px]" onSelect={() => update((f) => ({ ...f, cols: emptyCols() }))}>
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Task type dropdown, single pick */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton>
                {dropdownLabel}
                <ChevronDown className="size-3.5" />
              </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px] p-[5px]">
              <TypeItem selected={typeSel.length === 0} count={typeTotal} onSelect={() => setCol('type', [])}>
                <span className="text-[13px]">All task types</span>
              </TypeItem>
              <DropdownMenuSeparator />
              {TASK_TYPES.map((t) => (
                <TypeItem key={t} selected={typeSel.length === 1 && typeSel[0] === t} count={facets.type.get(t) ?? 0} onSelect={() => setCol('type', [t])}>
                  <TaskTypeChip type={t} />
                </TypeItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active filter chips: one line that scrolls sideways, so the table never jumps while a picker is open */}
          <div className="flex min-w-0 items-center gap-[10px] overflow-x-auto [scrollbar-width:none]">
            {filters.card && <FilterChip label={CARD_LABEL[filters.card]} onRemove={() => update((f) => ({ ...f, card: null }))} />}
            {FILTER_COLS.filter((c) => filters.cols[c].length).map((c) => (
              <FilterChip
                key={c}
                label={`${COL_LABEL[c]}: ${options[c]
                  .filter((v) => filters.cols[c].includes(v))
                  .map((v) => valueLabel(c, v))
                  .join(', ')}`}
                onRemove={() => setCol(c, [])}
              />
            ))}
          </div>
          {(filters.card || activeColCount > 0) && (
            <button onClick={clearAll} className="h-[35px] px-1.5 text-[13px] whitespace-nowrap text-[#525252] hover:text-[#0a0a0a] hover:underline">
              Clear all
            </button>
          )}
          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton active={hidden.size > 0}>
                <Columns3 className="size-3.5" /> Columns
              </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              {COLUMNS.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={show(c.key)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(v) =>
                    setHidden((h) => {
                      const n = new Set(h)
                      if (v) n.delete(c.key)
                      else n.add(c.key)
                      return n
                    })
                  }
                  className="text-[13px]"
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Task type tabs, kept in sync with the Task type filter */}
        <div className="flex items-end gap-6 border-b border-[#e5e5e5]">
          <TypeTab label="All" count={typeTotal} active={typeSel.length === 0} onClick={() => setCol('type', [])} />
          {TASK_TYPES.map((t) => (
            <TypeTab
              key={t}
              label={t}
              count={facets.type.get(t) ?? 0}
              active={typeSel.length === 1 && typeSel[0] === t}
              onClick={() => setCol('type', [t])}
            />
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#e5e5e5]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-[12.5px] text-[#262626]">
              <thead>
                <tr className="h-11 border-b border-[#e5e5e5] bg-[#fafafa] text-left text-[#0a0a0a]">
                  {show('sla') && (
                    <Th className="w-[172px]">
                      <button className="flex items-center gap-1.5" onClick={() => setSlaAsc((v) => !v)} title="Sort by time left">
                        SLA {slaAsc ? <ArrowUp className="size-[13px]" /> : <ArrowDown className="size-[13px]" />}
                      </button>
                    </Th>
                  )}
                  {show('type') && (
                    <Th className="w-[170px]" filter={<ColumnFilter {...filterProps('type')} />}>
                      Task Type
                    </Th>
                  )}
                  {show('room') && (
                    <Th className="w-[125px]" filter={<ColumnFilter {...filterProps('room')} />}>
                      Room Type
                    </Th>
                  )}
                  {show('roomId') && <Th>Room ID</Th>}
                  {show('org') && (
                    <Th className="w-[132px]" filter={<ColumnFilter {...filterProps('org')} />}>
                      Organization
                    </Th>
                  )}
                  {show('status') && (
                    <Th className="w-[135px]" filter={<ColumnFilter {...filterProps('status')} />}>
                      Status
                    </Th>
                  )}
                  {show('assignee') && (
                    <Th className="w-[150px]" filter={<ColumnFilter {...filterProps('assignee')} />}>
                      Assigned to
                    </Th>
                  )}
                  <Th className="w-[138px]" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((t) => (
                  <Row
                    key={t.id}
                    task={t}
                    now={now}
                    show={show}
                    onAssign={(id) => reassign(t, id)}
                    onOpen={() => setDetailsId(t.id)}
                    onClaim={() => claim(t)}
                    onUnclaim={() => unclaim(t)}
                    onCopy={copy}
                  />
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="h-32 text-center text-[#737373]">
                      No tasks match these filters.{' '}
                      <button onClick={() => update(() => ({ card: null, query: '', cols: emptyCols() }))} className="underline">
                        Clear filters and search
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="flex h-11 items-center justify-end gap-7 border-t border-[#e5e5e5] px-4 text-[12.5px]">
            <div className="flex items-center gap-[10px]">
              Page Size:
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-[7px] border border-[#e5e5e5] py-1.5 pr-[10px] pl-3 hover:bg-[#fafafa]">
                    {pageSize} <ChevronDown className="size-[13px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[10, 20, 50].map((n) => (
                    <DropdownMenuItem
                      key={n}
                      onSelect={() => {
                        setPageSize(n)
                        setPage(0)
                      }}
                    >
                      <span className="flex-1">{n}</span>
                      {n === pageSize && <Check className="size-3.5" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <span data-testid="footer-range">
              {rows.length === 0 ? 0 : safePage * pageSize + 1} to {Math.min(rows.length, (safePage + 1) * pageSize)} of {rows.length}
            </span>
            <div className="flex items-center gap-3">
              <PageBtn label="First page" disabled={safePage === 0} onClick={() => setPage(0)} icon={ChevronsLeft} />
              <PageBtn label="Previous page" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} icon={ChevronLeft} />
              <span>
                Page {safePage + 1} of {pages}
              </span>
              <PageBtn label="Next page" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} icon={ChevronRight} />
              <PageBtn label="Last page" disabled={safePage >= pages - 1} onClick={() => setPage(pages - 1)} icon={ChevronsRight} />
            </div>
          </div>
        </div>
      </div>

      <TaskDetails task={tasks.find((t) => t.id === detailsId) ?? null} onClose={() => setDetailsId(null)} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#171717] px-4 py-2.5 text-[13px] text-white shadow-lg">{toast}</div>
      )}
    </AppShell>
  )
}

function Row({
  task: t,
  now,
  show,
  onAssign,
  onOpen,
  onClaim,
  onUnclaim,
  onCopy,
}: {
  task: Task
  now: number
  show: (k: ShowKey) => boolean
  onAssign: (id: string | null) => void
  onOpen: () => void
  onClaim: () => void
  onUnclaim: () => void
  onCopy: (label: string, value: string) => void
}) {
  const mins = minutesLeft(t.dueAt, now)
  const overdue = slaState(mins) === 'overdue'
  const claimedByMe = t.claimedById === currentUserId
  const claimer = personById(t.claimedById)
  return (
    <tr
      onDoubleClick={onOpen}
      className={cn('h-[42px] border-b border-[#f0f0f0] last:border-b-0', overdue ? 'bg-[#fef2f2] hover:bg-[#fde8e8]' : 'hover:bg-[#fafafa]')}
    >
      {show('sla') && (
        <Td>
          <SlaPill mins={mins} />
        </Td>
      )}
      {show('type') && (
        <Td>
          <TaskTypeChip type={t.type} />
        </Td>
      )}
      {show('room') && <Td>{t.roomType}</Td>}
      {show('roomId') && (
        <Td className="max-w-0">
          <span className="block truncate" title={t.roomId}>
            {t.roomId}
          </span>
        </Td>
      )}
      {show('org') && <Td>{t.org}</Td>}
      {show('status') && (
        <Td>
          <TaskStatusChip status={t.status} />
        </Td>
      )}
      {show('assignee') && (
        <td className="px-[10px]">
          <div className="flex items-center gap-1">
            <AssigneeCell assigneeId={t.assigneeId} onChange={onAssign} />
            {t.status === 'In review' && t.sentById && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="rounded-[5px] border border-[#a3a3a3] px-1.5 text-[10.5px] leading-[16px] font-medium text-[#262626]">Review</span>
                </TooltipTrigger>
                <TooltipContent>Sent for review by {personById(t.sentById)?.name}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </td>
      )}
      <td className="pr-[14px] pl-[10px]">
        <div className="flex items-center justify-end gap-[12px] text-[#262626]">
          {t.status !== 'Done' &&
            (t.claimedById == null ? (
              <button
                onClick={onClaim}
                onDoubleClick={(e) => e.stopPropagation()}
                className="flex h-[26px] items-center gap-1.5 rounded-[7px] border border-[#e5e5e5] bg-white px-2.5 text-[12px] font-medium shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-[#f5f5f5]"
              >
                <Hand className="size-3.5" /> Claim
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex h-[26px] items-center gap-1.5 px-1 text-[12px] text-[#737373]">
                    <UserRoundCheck className="size-3.5" /> {claimedByMe ? 'Yours' : 'Claimed'}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Claimed by {claimer?.name ?? 'someone'}</TooltipContent>
              </Tooltip>
            ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onOpen} className="rounded p-0.5 hover:bg-black/5" aria-label="Open task">
                <ExternalLink className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Open task</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded p-0.5 hover:bg-black/5" aria-label="More actions">
                <Ellipsis className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[190px]">
              <DropdownMenuItem className="text-[13px]" onSelect={onOpen}>
                Open task details
              </DropdownMenuItem>
              {t.status !== 'Done' && t.claimedById == null && (
                <DropdownMenuItem className="text-[13px]" onSelect={onClaim}>
                  Claim task
                </DropdownMenuItem>
              )}
              {claimedByMe && t.status !== 'Done' && (
                <DropdownMenuItem className="text-[13px]" onSelect={onUnclaim}>
                  Release claim
                </DropdownMenuItem>
              )}
              {t.assigneeId !== currentUserId && (
                <DropdownMenuItem className="text-[13px]" onSelect={() => onAssign(currentUserId)}>
                  Assign to me
                </DropdownMenuItem>
              )}
              {t.assigneeId && (
                <DropdownMenuItem className="text-[13px]" onSelect={() => onAssign(null)}>
                  Unassign
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[13px]" onSelect={() => onCopy('Room ID', t.roomId)}>
                Copy room ID
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px]" onSelect={() => onCopy('Claim ID', t.claimId)}>
                Copy claim ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}

/** Task details, laid out like the row hover card in "UI TQ1 · C2 · Overdue selected". */
function TaskDetails({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const assignee = personById(task?.assigneeId)
  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[380px] gap-0 p-0">
        {task && (
          <>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between pr-6">
                <TaskTypeChip type={task.type} />
                <TaskStatusChip status={task.status} />
              </div>
              <DialogHeader className="gap-0.5 text-left">
                <DialogTitle className="text-[14px] font-semibold">{task.roomType}</DialogTitle>
                <DialogDescription className="text-[11.5px] text-[#737373]">{task.roomId}</DialogDescription>
              </DialogHeader>
              <div className="h-px bg-[#e5e5e5]" />
              <Field icon={Hash} label="Claim ID" value={task.claimId} />
              <Field icon={Building2} label="Organization" value={task.org} />
              <Field icon={User} label="Assigned To" value={assignee ? `${assignee.name} · ${assignee.email}` : 'Unassigned'} />
              {task.sentById && <Field icon={UserRoundCheck} label="Sent for review by" value={personById(task.sentById)?.name ?? ''} />}
              <Field icon={CalendarDays} label="Claim Opened" value={task.claimOpened} />
            </div>
            <div className="rounded-b-xl border-t border-[#e5e5e5] bg-[#fafafa] px-4 py-2.5 text-[11.5px] text-[#737373]">
              Opening the task itself (draw screen) is built in round 4.
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-px size-[13px] text-[#737373]" />
      <div className="min-w-0">
        <div className="text-[11px] text-[#737373]">{label}</div>
        <div className="truncate text-[12.5px] text-[#0a0a0a]">{value}</div>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  icon: Icon,
  value,
  hint,
  danger,
  selected,
  onClick,
}: {
  title: string
  icon: LucideIcon
  value: number
  hint: string
  danger?: boolean
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex flex-col gap-3 rounded-xl px-5 pt-5 pb-[18px] text-left shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] transition-colors',
        // selected state from "UI TQ1 · C2 · Overdue selected": dark border + light fill
        selected ? 'bg-[#fafafa] outline-[1.5px] outline-[#171717] outline-solid' : 'border border-[#e5e5e5] bg-white hover:border-[#d4d4d4] hover:bg-[#fcfcfc]',
        selected && 'border border-transparent',
      )}
    >
      <div className="flex w-full items-center justify-between text-[13.5px] font-medium">
        {title}
        <Icon className="size-4 text-[#525252]" />
      </div>
      <div className={cn('text-[24px] leading-none font-semibold', danger && 'text-[#dc2626]')}>{value}</div>
      <div className="text-[11.5px] text-[#737373]">{hint}</div>
    </button>
  )
}

function ToolbarButton({ children, active, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        'flex h-[35px] items-center gap-[7px] rounded-[7px] border bg-white pr-[14px] pl-[13px] text-[12.5px] font-medium shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] hover:bg-[#fafafa]',
        active ? 'border-[#a3a3a3]' : 'border-[#e5e5e5]',
      )}
    >
      {children}
    </button>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex h-[35px] max-w-[300px] shrink-0 items-center gap-1.5 rounded-lg border border-[#e5e5e5] bg-[#f5f5f5] pr-2 pl-[10px] text-[13px] font-medium text-[#171717]">
      <span className="truncate">{label}</span>
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="rounded p-0.5 hover:bg-black/10">
        <X className="size-[13px]" />
      </button>
    </span>
  )
}

function TypeItem({ selected, count, onSelect, children }: { selected: boolean; count: number; onSelect: () => void; children: React.ReactNode }) {
  return (
    <DropdownMenuItem onSelect={onSelect} className={cn('py-[6px]', selected && 'bg-[#f5f5f5]')}>
      <span className="flex-1">{children}</span>
      <span className="text-[11.5px] text-[#a3a3a3] tabular-nums">{count}</span>
      <Check className={cn('size-3.5', !selected && 'invisible')} />
    </DropdownMenuItem>
  )
}

function TypeTab({ label, count, active, onClick }: { label: TaskType | 'All'; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        '-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-[13px]',
        active ? 'border-[#171717] font-medium text-[#0a0a0a]' : 'border-transparent text-[#737373] hover:text-[#262626]',
      )}
    >
      {label}
      <span className={cn('text-[11.5px] tabular-nums', active ? 'text-[#737373]' : 'text-[#a3a3a3]')}>{count}</span>
    </button>
  )
}

function Th({ children, className, filter }: { children?: React.ReactNode; className?: string; filter?: React.ReactNode }) {
  return (
    <th className={cn('px-[14px] font-medium whitespace-nowrap', className)}>
      {filter ? (
        <span className="flex items-center justify-between gap-2">
          {children}
          {filter}
        </span>
      ) : (
        children
      )}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-[14px] whitespace-nowrap', className)}>{children}</td>
}

function PageBtn({ icon: Icon, disabled, onClick, label }: { icon: LucideIcon; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button disabled={disabled} onClick={onClick} aria-label={label} className="disabled:text-[#d4d4d4]">
      <Icon className="size-4" />
    </button>
  )
}
