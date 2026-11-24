import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
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
  ListFilter,
  Search,
  SlidersHorizontal,
  User,
  type LucideIcon,
} from 'lucide-react'
import { AppShell } from '@/components/portal/AppShell'
import { AssigneeCell } from '@/components/portal/assignee'
import { SlaPill, TaskStatusChip, TaskTypeChip } from '@/components/portal/chips'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { currentUserId, personById } from '@/data/people'
import { TASK_TYPES, type Task, type TaskType } from '@/data/tasks'
import { isDueToday, minutesLeft, slaState } from '@/lib/sla'
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
type ColKey = (typeof COLUMNS)[number]['key']

export default function TaskQueue() {
  const { tasks, now, updateTask } = useStore()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all')
  const [slaAsc, setSlaAsc] = useState(true)
  const [hidden, setHidden] = useState<Set<ColKey>>(new Set())
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(0)

  const open = tasks.filter((t) => t.status !== 'Done')
  const counts = {
    mine: open.filter((t) => t.assigneeId === currentUserId).length,
    overdue: open.filter((t) => t.dueAt != null && t.dueAt < now).length,
    today: open.filter((t) => isDueToday(t.dueAt, now)).length,
    inProgress: open.filter((t) => t.status === 'In Progress').length,
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = tasks.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (!q) return true
      const who = personById(t.assigneeId)?.name ?? 'unassigned'
      return [t.type, t.roomType, t.roomId, t.org, t.status, who].join(' ').toLowerCase().includes(q)
    })
    const dir = slaAsc ? 1 : -1
    return list.sort((a, b) => {
      // Done tasks always sit at the bottom.
      if ((a.dueAt == null) !== (b.dueAt == null)) return a.dueAt == null ? 1 : -1
      if (a.dueAt == null || b.dueAt == null) return 0
      return (a.dueAt - b.dueAt) * dir
    })
  }, [tasks, query, typeFilter, slaAsc])

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const pageRows = rows.slice(safePage * pageSize, safePage * pageSize + pageSize)
  const show = (k: ColKey) => !hidden.has(k)

  return (
    <AppShell crumbs={[{ label: 'Tasks' }]}>
      <div className="flex flex-col gap-4 px-[17px] pt-4 pb-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-[18px]">
          <SummaryCard title="My Tasks" icon={User} value={counts.mine} hint="Assigned to you" />
          <SummaryCard title="Overdue" icon={CircleAlert} value={counts.overdue} hint="Past due date" danger />
          <SummaryCard title="Due Today" icon={CalendarClock} value={counts.today} hint="Must finish today to meet SLA" />
          <SummaryCard title="In Progress" icon={Clock} value={counts.inProgress} hint="Currently being worked on" />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-[10px]">
          <label className="flex h-9 w-[286px] items-center gap-2 rounded-lg border border-[#e5e5e5] px-[13px]">
            <Search className="size-3.5 text-[#a3a3a3]" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
              placeholder="Search tasks..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]"
            />
          </label>
          <ToolbarButton>
            <SlidersHorizontal className="size-3.5" /> Filters
          </ToolbarButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton>
                {typeFilter === 'all' ? 'All task types' : typeFilter} ·{' '}
                {typeFilter === 'all' ? tasks.length : tasks.filter((t) => t.type === typeFilter).length}
                <ChevronDown className="size-3.5" />
              </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
              <TypeItem label="All task types" count={tasks.length} selected={typeFilter === 'all'} onSelect={() => setTypeFilter('all')} />
              <DropdownMenuSeparator />
              {TASK_TYPES.map((t) => (
                <TypeItem
                  key={t}
                  label={t}
                  count={tasks.filter((x) => x.type === t).length}
                  selected={typeFilter === t}
                  onSelect={() => {
                    setTypeFilter(t)
                    setPage(0)
                  }}
                />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton>
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

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#e5e5e5]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-[12.5px] text-[#262626]">
              <thead>
                <tr className="h-11 border-b border-[#e5e5e5] bg-[#fafafa] text-left text-[#0a0a0a]">
                  {show('sla') && (
                    <Th className="w-[150px]">
                      <button className="flex items-center gap-1.5" onClick={() => setSlaAsc((v) => !v)}>
                        SLA {slaAsc ? <ArrowUp className="size-[13px]" /> : <ArrowDown className="size-[13px]" />}
                      </button>
                    </Th>
                  )}
                  {show('type') && <Th className="w-[170px]" filter>Task Type</Th>}
                  {show('room') && <Th className="w-[115px]" filter>Room Type</Th>}
                  {show('roomId') && <Th>Room ID</Th>}
                  {show('org') && <Th className="w-[135px]" filter>Organization</Th>}
                  {show('status') && <Th className="w-[135px]" filter>Status</Th>}
                  {show('assignee') && <Th className="w-[140px]" filter>Assigned to</Th>}
                  <Th className="w-[84px]" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((t) => (
                  <Row key={t.id} task={t} now={now} show={show} onAssign={(id) => updateTask(t.id, { assigneeId: id })} />
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="h-32 text-center text-[#737373]">
                      No tasks match.
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
                  <button className="flex items-center gap-1.5 rounded-[7px] border border-[#e5e5e5] py-1.5 pr-[10px] pl-3">
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
                      {n}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <span>
              {rows.length === 0 ? 0 : safePage * pageSize + 1} to {Math.min(rows.length, (safePage + 1) * pageSize)} of {rows.length}
            </span>
            <div className="flex items-center gap-3">
              <PageBtn disabled={safePage === 0} onClick={() => setPage(0)} icon={ChevronsLeft} />
              <PageBtn disabled={safePage === 0} onClick={() => setPage(safePage - 1)} icon={ChevronLeft} />
              <span>
                Page {safePage + 1} of {pages}
              </span>
              <PageBtn disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} icon={ChevronRight} />
              <PageBtn disabled={safePage >= pages - 1} onClick={() => setPage(pages - 1)} icon={ChevronsRight} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Row({
  task: t,
  now,
  show,
  onAssign,
}: {
  task: Task
  now: number
  show: (k: ColKey) => boolean
  onAssign: (id: string | null) => void
}) {
  const mins = minutesLeft(t.dueAt, now)
  const overdue = slaState(mins) === 'overdue'
  return (
    <tr className={cn('h-[42px] border-b border-[#f0f0f0] last:border-b-0', overdue ? 'bg-[#fef2f2] hover:bg-[#fde8e8]' : 'hover:bg-[#fafafa]')}>
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
          <AssigneeCell assigneeId={t.assigneeId} onChange={onAssign} />
        </td>
      )}
      <td className="pr-[14px] pl-[18px]">
        <div className="flex items-center gap-[14px] text-[#262626]">
          <button title="Open task" className="hover:text-black">
            <ExternalLink className="size-3.5" />
          </button>
          <button title="More">
            <Ellipsis className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function SummaryCard({ title, icon: Icon, value, hint, danger }: { title: string; icon: LucideIcon; value: number; hint: string; danger?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#e5e5e5] bg-white px-5 pt-5 pb-[18px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between text-[13.5px] font-medium">
        {title}
        <Icon className="size-4 text-[#525252]" />
      </div>
      <div className={cn('text-[24px] leading-none font-semibold', danger && 'text-[#dc2626]')}>{value}</div>
      <div className="text-[11.5px] text-[#737373]">{hint}</div>
    </div>
  )
}

function ToolbarButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="flex h-[35px] items-center gap-[7px] rounded-[7px] border border-[#e5e5e5] bg-white pr-[14px] pl-[13px] text-[12.5px] font-medium shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] hover:bg-[#fafafa]"
    >
      {children}
    </button>
  )
}

function TypeItem({ label, count, selected, onSelect }: { label: string; count: number; selected: boolean; onSelect: () => void }) {
  return (
    <DropdownMenuItem onSelect={onSelect} className={cn('text-[13px]', selected && 'bg-[#f5f5f5]')}>
      <span className="flex-1">{label}</span>
      <span className="text-[11.5px] text-[#a3a3a3]">{count}</span>
      <Check className={cn('size-3.5', !selected && 'invisible')} />
    </DropdownMenuItem>
  )
}

function Th({ children, className, filter }: { children?: React.ReactNode; className?: string; filter?: boolean }) {
  return (
    <th className={cn('px-[14px] font-medium whitespace-nowrap', className)}>
      {filter ? (
        <span className="flex items-center justify-between gap-2">
          {children}
          <ListFilter className="size-3.5 text-[#525252]" />
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

function PageBtn({ icon: Icon, disabled, onClick }: { icon: LucideIcon; disabled: boolean; onClick: () => void }) {
  return (
    <button disabled={disabled} onClick={onClick} className="disabled:text-[#d4d4d4]">
      <Icon className="size-4" />
    </button>
  )
}
