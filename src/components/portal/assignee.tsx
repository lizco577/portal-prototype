import { useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { currentUserId, initials, people, personById, type Person } from '@/data/people'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Initials in a circle. `outline` is the task list style: white with a grey border and dark initials.
 * With no person it's an empty dashed circle; `addIcon` puts a plus in it.
 */
export function Avatar({
  person,
  size = 24,
  outline,
  addIcon = true,
  hoverable,
}: {
  person: Person | null
  size?: number
  outline?: boolean
  addIcon?: boolean
  /** inside a button with class "group": the border darkens on hover and focus, no background square */
  hoverable?: boolean
}) {
  if (!person)
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-[#d4d4d4] bg-white text-[#a3a3a3]',
          hoverable && 'transition-colors group-hover:border-[#737373] group-hover:text-[#525252] group-focus-visible:border-[#737373]',
        )}
        style={{ width: size, height: size }}
      >
        {addIcon && <Plus className="size-3" strokeWidth={2} />}
      </span>
    )
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', outline && 'border border-[#d4d4d4] bg-white text-[#404040]',
        hoverable && 'transition-colors group-hover:border-[#737373] group-focus-visible:border-[#737373]',
      )}
      style={{ width: size, height: size, ...(outline ? {} : { background: person.color, color: person.text }) }}
    >
      {initials(person)}
    </span>
  )
}

/** "Assigned to" cell: initials in a white circle, full name on hover (like Jira), click to reassign. */
export function AssigneeCell({ assigneeId, onChange }: { assigneeId: string | null; onChange: (id: string | null) => void }) {
  return (
    <PersonPicker
      value={assigneeId}
      onChange={onChange}
      meLabel="Assign to me"
      noneLabel="Unassigned"
      hint={(p) => (p ? p.name : 'Click to assign')}
    />
  )
}

/** "Claimed by" cell: same circle and picker as Assigned to. Picking someone claims the task for them. */
export function ClaimerCell({ claimedById, onChange }: { claimedById: string | null; onChange: (id: string | null) => void }) {
  return (
    <PersonPicker
      value={claimedById}
      onChange={onChange}
      meLabel="Claim it myself"
      noneLabel="Not claimed"
      hint={(p) => (p ? `Claimed by ${p.name}` : 'Click to claim')}
    />
  )
}

/** Initials circle that opens a people picker: search, me, everyone else, nobody. */
function PersonPicker({
  value,
  onChange,
  meLabel,
  noneLabel,
  hint,
}: {
  value: string | null
  onChange: (id: string | null) => void
  meLabel: string
  noneLabel: string
  hint: (p: Person | null) => string
}) {
  const assigneeId = value
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
              className="group flex items-center rounded-full py-1 pl-1 text-[12.5px] text-[#262626] outline-none"
            >
              <Avatar person={person} outline hoverable />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{hint(person)}</TooltipContent>
      </Tooltip>
      {/* Standard dropdown: opens right under the circle, lined up with its right edge so it stays over the table (above it only near the bottom of the screen),
          fixed height with the list scrolling under a sticky search box. */}
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={6}
        collisionPadding={12}
        className="flex max-h-[min(360px,var(--radix-popover-content-available-height))] w-[280px] flex-col gap-0 overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#e5e5e5] p-2">
          <div className="flex h-9 items-center gap-2 rounded-md border border-[#e5e5e5] px-3 focus-within:border-[#a3a3a3]">
            <Search className="size-4 text-[#a3a3a3]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people…"
              className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a3a3a3]"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-[6px]">
          <Item onClick={() => pick(me.id)} selected={assigneeId === me.id}>
            <Avatar person={me} outline />
            <span className="text-[13px]">{meLabel}</span>
          </Item>
          <div className="my-[4px] h-px bg-[#e5e5e5]" />
          <div className="px-2 pt-1 pb-[4px] text-[11.5px] font-medium text-[#737373]">People</div>
          {list.map((p) => (
            <Item key={p.id} onClick={() => pick(p.id)} selected={assigneeId === p.id}>
              <Avatar person={p} outline />
              <span className="min-w-0">
                <span className="block text-[13px] text-[#0a0a0a]">{p.name}</span>
                <span className="block truncate text-[11.5px] text-[#737373]">{p.email}</span>
              </span>
            </Item>
          ))}
          {list.length === 0 && <div className="px-2 py-2 text-[12.5px] text-[#737373]">No one matches.</div>}
          <div className="my-[4px] h-px bg-[#e5e5e5]" />
          <Item onClick={() => pick(null)} selected={assigneeId == null}>
            <Avatar person={null} addIcon={false} />
            <span className="text-[13px]">{noneLabel}</span>
          </Item>
        </div>
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
