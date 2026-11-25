import { useState } from 'react'
import { Check, Search, UserPlus } from 'lucide-react'
import { currentUserId, initials, people, personById, type Person } from '@/data/people'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Initials in a circle. `outline` is the task list style: white with a grey border and dark initials.
 * With no person it's an empty dashed circle; `addIcon` puts the add-person icon in it.
 */
export function Avatar({
  person,
  size = 24,
  outline,
  addIcon = true,
}: {
  person: Person | null
  size?: number
  outline?: boolean
  addIcon?: boolean
}) {
  if (!person)
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-[#d4d4d4] bg-white text-[#a3a3a3]"
        style={{ width: size, height: size }}
      >
        {addIcon && <UserPlus className="size-3" />}
      </span>
    )
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', outline && 'border border-[#d4d4d4] bg-white text-[#404040]')}
      style={{ width: size, height: size, ...(outline ? {} : { background: person.color, color: person.text }) }}
    >
      {initials(person)}
    </span>
  )
}

/** "Claimed by" cell: initials only, full name on hover. Read-only. */
export function ClaimerCell({ claimedById }: { claimedById: string | null }) {
  const person = personById(claimedById)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex py-1 pl-1" tabIndex={0}>
          <Avatar person={person} outline addIcon={false} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{person ? `Claimed by ${person.name}` : 'Not claimed yet'}</TooltipContent>
    </Tooltip>
  )
}

/** "Assigned to" cell: initials in a white circle, full name on hover (like Jira), click to reassign. */
export function AssigneeCell({ assigneeId, onChange }: { assigneeId: string | null; onChange: (id: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const person = personById(assigneeId)
  const me = personById(currentUserId)!
  const list = people.filter(
    (p) => p.id !== currentUserId && (p.name + p.email).toLowerCase().includes(q.toLowerCase()),
  )
  const pick = (id: string | null) => {
    onChange(id)
    setOpen(false)
    setQ('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 rounded-md py-1 pr-2 pl-1 text-[12.5px] text-[#262626] hover:bg-black/[0.04]"
            >
              <Avatar person={person} outline />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{person ? person.name : 'Click to assign'}</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="max-h-[var(--radix-popover-content-available-height)] w-[260px] overflow-y-auto p-[7px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-[34px] items-center gap-2 rounded-md border border-[#e5e5e5] px-[11px]">
          <Search className="size-3.5 text-[#a3a3a3]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]"
          />
        </div>
        <Item onClick={() => pick(me.id)} selected={assigneeId === me.id}>
          <Avatar person={me} />
          <span className="text-[13px]">Assign to me</span>
        </Item>
        <div className="my-[2px] h-px bg-[#e5e5e5]" />
        <div className="px-2 pt-1 pb-[6px] text-[11.5px] font-medium text-[#737373]">People</div>
        {list.map((p) => (
          <Item key={p.id} onClick={() => pick(p.id)} selected={assigneeId === p.id}>
            <Avatar person={p} />
            <span className="min-w-0">
              <span className="block text-[13px] text-[#0a0a0a]">{p.name}</span>
              <span className="block truncate text-[11.5px] text-[#737373]">{p.email}</span>
            </span>
          </Item>
        ))}
        <div className="my-[2px] h-px bg-[#e5e5e5]" />
        <Item onClick={() => pick(null)} selected={assigneeId == null}>
          <Avatar person={null} />
          <span className="text-[13px]">Unassigned</span>
        </Item>
      </PopoverContent>
    </Popover>
  )
}

function Item({ children, selected, onClick }: { children: React.ReactNode; selected?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex w-full items-center gap-[10px] rounded-md px-2 py-[6px] text-left hover:bg-[#f5f5f5]', selected && 'bg-[#f5f5f5]')}
    >
      {children}
      <span className="flex-1" />
      {selected && <Check className="size-3.5" />}
    </button>
  )
}
