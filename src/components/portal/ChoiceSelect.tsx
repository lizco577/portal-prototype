import { useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/** A small select used for the labeling questions. `footer` sits under the list (e.g. Manage materials). */
export function ChoiceSelect({
  value,
  options,
  placeholder = 'Select…',
  onChange,
  footer,
}: {
  value: string
  options: string[]
  placeholder?: string
  onChange: (v: string) => void
  footer?: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-[34px] w-full items-center gap-2 rounded-[7px] border bg-white px-[10px] text-left text-[12.5px]',
            open ? 'border-[#a3a3a3]' : 'border-[#e5e5e5]',
          )}
        >
          <span className={cn('flex-1 truncate', value ? 'text-[#0a0a0a]' : 'text-[#a3a3a3]')}>{value || placeholder}</span>
          <ChevronDown className="size-3.5 text-[#737373]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="flex max-h-[min(380px,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] flex-col gap-0 rounded-[8px] p-0 shadow-[0px_6px_16px_0px_rgba(0,0,0,0.1)]"
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-1">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => {
                onChange(o)
                setOpen(false)
              }}
              className={cn('flex w-full items-center gap-2 rounded-[5px] px-2 py-[6px] text-left text-[12.5px] hover:bg-[#f5f5f5]', o === value && 'bg-[#f5f5f5]')}
            >
              <span className="flex-1">{o}</span>
              {o === value && <Check className="size-3.5" />}
            </button>
          ))}
          {options.length === 0 && <div className="px-2 py-2 text-[12.5px] text-[#737373]">No options</div>}
        </div>
        {footer && <div className="border-t border-[#e5e5e5] p-1">{footer(() => setOpen(false))}</div>}
      </PopoverContent>
    </Popover>
  )
}
