import { Fragment, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Bell,
  Box,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  Globe,
  ListTodo,
  Moon,
  PanelLeft,
  Search,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type Crumb = { label: string; to?: string }

export function AppShell({ crumbs, children }: { crumbs: Crumb[]; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex h-screen min-w-[1100px] bg-white text-[#0a0a0a]">
      {!collapsed && <Sidebar />}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#e5e5e5] px-5">
          <button onClick={() => setCollapsed((c) => !c)} className="rounded p-0.5 hover:bg-black/5" aria-label="Toggle sidebar">
            <PanelLeft className="size-4" />
          </button>
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
          <div className="flex h-9 w-[200px] items-center gap-2 rounded-lg border border-[#e5e5e5] px-[13px] text-[13px] text-[#a3a3a3]">
            <Search className="size-3.5" />
            Search
          </div>
          <div className="flex items-center gap-1.5 pl-2 text-[12.5px] font-medium">
            <Globe className="size-[15px]" /> MST
          </div>
          <Bell className="ml-3 size-[15px]" />
          <Moon className="ml-3 size-[15px]" />
        </header>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  )
}

function Sidebar() {
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
        <NavItem icon={ListTodo} label="Tasks Queue" to="/" active />
        <NavItem icon={Activity} label="Claims" />
        <NavItem icon={Workflow} label="Pipeline" />
        <NavItem icon={FileText} label="Rule Sets" />
      </NavGroup>
      <NavGroup label="Entity">
        <NavItem icon={Activity} label="Claims" />
      </NavGroup>
      <div className="flex-1" />
      <div className="flex items-center gap-[10px] px-[6px]">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#f0f0f0] text-[13px] font-medium">E</div>
        <div className="flex-1 leading-tight">
          <div className="text-[13.5px] font-medium">ecohen</div>
          <div className="text-[11px] text-[#737373]">ecohen@hosta.ai</div>
        </div>
        <ChevronsUpDown className="size-4 text-[#737373]" />
      </div>
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
  return to ? (
    <Link to={to} className={cls}>
      <Icon className="size-4" /> {label}
    </Link>
  ) : (
    <div className={cn(cls, 'cursor-default')}>
      <Icon className="size-4" /> {label}
    </div>
  )
}
