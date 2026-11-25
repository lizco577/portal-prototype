import type { ReactNode } from 'react'
import { Copy, RefreshCw } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { personById } from '@/data/people'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/** F4: the note the claim specialist sent with the remodel request. Used on Final QA and Remodel tasks. */
export function RemodelNote({ note, byId = 'jcampos', when = 'Nov 21, 2026' }: { note: string; byId?: string; when?: string }) {
  const by = personById(byId)
  return (
    <div data-change="remodel-note" className="flex gap-3 rounded-[10px] border border-[#fde68a] bg-[#fefce8] px-4 py-3">
      <RefreshCw className="mt-0.5 size-4 shrink-0 text-[#a16207]" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-[#0a0a0a]">Sent back for a remodel</div>
        <div className="text-[11.5px] text-[#737373]">
          {by?.short ?? 'A claim specialist'} · {when}
        </div>
        <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[#262626]">“{note}”</p>
      </div>
    </div>
  )
}

/** Small "Remodeled" tag for the page header (F4). */
export function RemodeledTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#fde68a] bg-[#fefce8] px-2 py-[2px] text-[11.5px] font-medium text-[#a16207]">
      <RefreshCw className="size-3" /> Remodeled
    </span>
  )
}

/** Copy button that sits after an ID. */
export function CopyButton({ label, value }: { label: string; value: string }) {
  const { showToast } = useStore()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(value).catch(() => {})
            showToast(`${label} copied`)
          }}
          aria-label={`Copy ${label}`}
          className="rounded p-1 text-[#737373] hover:bg-black/5 hover:text-[#0a0a0a]"
        >
          <Copy className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Copy {label}</TooltipContent>
    </Tooltip>
  )
}

/** Underlined tab, the same look as Labels / Review on Damage Labeling. */
export function UnderlineTab({ active, onClick, children, dataChange }: { active: boolean; onClick: () => void; children: ReactNode; dataChange?: string }) {
  return (
    <button
      onClick={onClick}
      data-change={dataChange}
      className={cn('-mb-px flex items-center gap-[6px] border-b-2 pb-2 text-[13px]', active ? 'border-[#0a0a0a] font-semibold' : 'border-transparent text-[#737373] hover:text-[#0a0a0a]')}
    >
      {children}
    </button>
  )
}

/** Placeholder room photo: a wall, a floor, a door and a window, optionally with a damage patch. */
export function RoomPhoto({ tone, damage, className }: { tone: string; damage?: boolean; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-[6px] border border-[#e5e5e5] bg-white p-1', className)}>
      <div className="relative size-full overflow-hidden rounded-[3px]" style={{ background: tone }}>
        <div className="absolute inset-x-0 bottom-0 h-[28%] bg-black/10" />
        <div className="absolute top-[22%] right-[14%] h-[52%] w-[16%] rounded-[2px] bg-white/70" />
        <div className="absolute top-[20%] left-[16%] h-[26%] w-[24%] rounded-[2px] bg-[#e7eef5]/90" />
        {damage && <div className="absolute top-[30%] left-[38%] h-[30%] w-[30%] rounded-[45%] bg-[#3f3226]/80 blur-[1px]" />}
      </div>
    </div>
  )
}

export const PHOTO_TONES = ['#d8d2c7', '#c9cfd4', '#bfb6a8', '#d2d6d9', '#b9b1a4', '#cfc8bc', '#c4c9cc', '#b4aea5']

export const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1)
