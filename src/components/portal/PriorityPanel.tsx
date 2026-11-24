import { Star } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ORGANIZATIONS, type Organization, type Task } from '@/data/tasks'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/** Priority settings: a lead marks whole customers as priority. Their tasks get a filled star. */
export function PriorityPanel({ tasks }: { tasks: Task[] }) {
  const { priorityOrgs, toggleOrgPriority } = useStore()
  const open = (org: Organization) => tasks.filter((t) => t.org === org && t.status !== 'Done').length
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-[35px] items-center gap-[7px] rounded-[7px] border bg-white pr-[14px] pl-[13px] text-[12.5px] font-medium shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] hover:bg-[#fafafa]',
            priorityOrgs.length ? 'border-[#a3a3a3]' : 'border-[#e5e5e5]',
          )}
        >
          <Star className="size-3.5" /> Priority settings
          {priorityOrgs.length > 0 && <span className="text-[#737373]">{priorityOrgs.length}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] gap-0 rounded-[10px] p-0 shadow-[0px_6px_16px_0px_rgba(0,0,0,0.1)]">
        <div className="border-b border-[#e5e5e5] px-4 pt-3.5 pb-3">
          <div className="text-[13.5px] font-semibold">Priority customers</div>
          <div className="mt-0.5 text-[12px] leading-snug text-[#737373]">
            Every task from a marked customer gets a filled star. Stars on single tasks stay as they are.
          </div>
        </div>
        <div className="flex flex-col p-[6px]">
          {ORGANIZATIONS.map((org) => {
            const on = priorityOrgs.includes(org)
            return (
              <button
                key={org}
                role="switch"
                aria-checked={on}
                onClick={() => toggleOrgPriority(org)}
                className={cn('flex items-center gap-[10px] rounded-md px-2 py-[7px] text-left hover:bg-[#f5f5f5]', on && 'bg-[#fffbeb]')}
              >
                <Star className={cn('size-4', on ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#a3a3a3]')} />
                <span className="flex-1 text-[13px] text-[#171717]">{org}</span>
                <span className="text-[11.5px] text-[#737373] tabular-nums">{open(org)} open</span>
                <span
                  className={cn(
                    'relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors',
                    on ? 'bg-[#171717]' : 'bg-[#d4d4d4]',
                  )}
                >
                  <span className={cn('absolute top-[2px] size-[14px] rounded-full bg-white transition-all', on ? 'left-[14px]' : 'left-[2px]')} />
                </span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
