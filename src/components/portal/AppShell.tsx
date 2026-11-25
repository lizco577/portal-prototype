import { Fragment, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  Bell,
  Box,
  Check,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  Globe,
  ListTodo,
  Moon,
  PanelLeft,
  MessageSquareText,
  Search,
  Workflow,
  X,
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChangesPanel } from '@/components/portal/ChangesPanel'
import type { Change } from '@/data/changes'
import { currentUserId, personById } from '@/data/people'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export type Crumb = { label: string; to?: string }
type SearchBinding = { value: string; onChange: (v: string) => void }

const TIMEZONES = ['MST', 'PST', 'CST', 'EST', 'UTC']

export function AppShell({
  crumbs,
  children,
  search,
  changes,
  annotations,
}: {
  crumbs: Crumb[]
  children: ReactNode
  search?: SearchBinding
  changes?: Change[]
  /** Prototype-only controls shown at the top of the What's changed panel */
  annotations?: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [tz, setTz] = useState('MST')
  const { toast, changesOpen, setChangesOpen } = useStore()
  const hasChanges = !!changes
  return (
    <div className="flex h-screen min-w-[800px] bg-white text-[#0a0a0a]">
      {!collapsed && <Sidebar />}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#e5e5e5] px-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setCollapsed((c) => !c)} className="rounded p-0.5 hover:bg-black/5" aria-label="Toggle sidebar">
                <PanelLeft className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{collapsed ? 'Show sidebar' : 'Hide sidebar'}</TooltipContent>
          </Tooltip>
          <div className="h-5 w-px bg-[#e5e5e5]" />
          <nav className="flex min-w-0 items-center gap-2 text-[13.5px]">
            {crumbs.map((c, i) => (
              <Fragment key={i}>
                {i > 0 && <ChevronRight className="size-3.5 text-[#737373]" />}
                {c.to ? (
                  <Link to={c.to} className="truncate text-[#525252] hover:text-[#0a0a0a]">
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate">{c.label}</span>
                )}
              </Fragment>
            ))}
          </nav>
          <div className="flex-1" />
          {/* Header search searches the same task list as the toolbar box */}
          <label className="flex h-9 w-[200px] items-center gap-2 rounded-lg border border-[#e5e5e5] px-[13px] focus-within:border-[#a3a3a3]">
            <Search className="size-3.5 text-[#a3a3a3]" />
            <input
              value={search?.value ?? ''}
              onChange={(e) => search?.onChange(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]"
            />
            {search?.value && (
              <button onClick={() => search.onChange('')} aria-label="Clear search">
                <X className="size-3.5 text-[#737373]" />
              </button>
            )}
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-medium hover:bg-black/5">
                <Globe className="size-[15px]" /> {tz}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel className="text-[11.5px] text-[#737373]">Show times in</DropdownMenuLabel>
              {TIMEZONES.map((z) => (
                <DropdownMenuItem key={z} className="text-[13px]" onSelect={() => setTz(z)}>
                  <span className="flex-1">{z}</span>
                  {z === tz && <Check className="size-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-md p-1.5 hover:bg-black/5" aria-label="Notifications">
                <Bell className="size-[15px]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[260px] p-4 text-[13px]">
              <div className="font-medium">Notifications</div>
              <div className="mt-1 text-[12.5px] text-[#737373]">You're all caught up. Review requests from teammates also show in My Tasks.</div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-md p-1.5 hover:bg-black/5" aria-label="Dark mode">
                <Moon className="size-[15px]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[220px] p-3 text-[12.5px] text-[#525252]">
              Dark mode isn't part of this prototype.
            </PopoverContent>
          </Popover>
          {hasChanges && (
            <>
              <div className="h-5 w-px bg-[#e5e5e5]" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setChangesOpen(!changesOpen)}
                    className="rounded p-0.5 hover:bg-black/5"
                    aria-label={changesOpen ? "Hide What's changed" : "Show What's changed"}
                    aria-pressed={changesOpen}
                  >
                    <MessageSquareText className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {changesOpen ? 'Hide' : 'Show'} What's changed · {changes!.length}
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </main>
      {/* What's changed: full-height column on the right, like the left nav. The page shrinks instead of being covered. */}
      {hasChanges && changesOpen && <ChangesPanel changes={changes!} top={annotations} />}
      {toast && (
        // Toasts: bottom-right corner, white with black text
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 bottom-5 z-[60] max-w-[360px] rounded-lg border border-[#e5e5e5] bg-white px-4 py-3 text-[13px] text-[#0a0a0a] shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

function Sidebar() {
  const me = personById(currentUserId)!
  const { pathname } = useLocation()
  const section = pathname.startsWith('/org')
    ? 'org'
    : pathname.startsWith('/claims')
      ? 'claims'
      : pathname.startsWith('/pipeline')
        ? 'pipeline'
        : pathname.startsWith('/rule-sets')
          ? 'rules'
          : 'tasks'
  return (
    <aside className="flex w-[245px] shrink-0 flex-col gap-6 border-r border-[#e5e5e5] bg-[#fafafa] px-2 py-[18px]">
      <div className="flex items-center gap-[10px] pl-2">
        <div className="flex size-[34px] items-center justify-center rounded-lg bg-[#171717] text-white">
          <Box className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-semibold">Elara Spatial</div>
          <div className="text-[11.5px] text-[#737373]">Admin</div>
        </div>
      </div>
      <NavGroup label="Admin">
        <NavItem icon={ListTodo} label="Tasks Queue" to="/" active={section === 'tasks'} />
        <NavItem icon={Activity} label="Claims" to="/claims" active={section === 'claims'} />
        <NavItem icon={Workflow} label="Pipeline" to="/pipeline" active={section === 'pipeline'} />
        <NavItem icon={FileText} label="Rule Sets" to="/rule-sets" active={section === 'rules'} />
      </NavGroup>
      <NavGroup label="Entity">
        <NavItem icon={Activity} label="Claims" to="/org/claims" active={section === 'org'} />
      </NavGroup>
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-[10px] rounded-md px-[6px] py-1 text-left hover:bg-black/[0.03]">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#f0f0f0] text-[13px] font-medium">{me.name[0]}</div>
            <div className="flex-1 leading-tight">
              <div className="text-[13.5px] font-medium">{me.email.split('@')[0]}</div>
              <div className="text-[11px] text-[#737373]">{me.email}</div>
            </div>
            <ChevronsUpDown className="size-4 text-[#737373]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-[228px]">
          <DropdownMenuLabel className="text-[12px] font-normal text-[#737373]">Signed in as {me.name} · Admin</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-[13px]">
            Sign out (not in prototype)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  )
}

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <div className="pb-[6px] pl-2 text-[11.5px] font-medium text-[#737373]">{label}</div>
      {children}
    </div>
  )
}

function NavItem({ icon: Icon, label, to, active }: { icon: typeof Box; label: string; to?: string; active?: boolean }) {
  const cls = cn(
    'flex items-center gap-[10px] rounded-md px-[10px] py-[7px] text-[13.5px] font-medium',
    active ? 'bg-[#efefef]' : 'text-[#262626] hover:bg-black/[0.03]',
  )
  if (to)
    return (
      <Link to={to} className={cls}>
        <Icon className="size-4" /> {label}
      </Link>
    )
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(cls, 'w-full text-left')}>
          <Icon className="size-4" /> {label}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-[220px] p-3 text-[12.5px] text-[#525252]">
        {label} isn't part of this prototype. The Tasks Queue is.
      </PopoverContent>
    </Popover>
  )
}
