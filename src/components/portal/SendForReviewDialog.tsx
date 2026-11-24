import { useState } from 'react'
import { ChevronDown, Check, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar } from '@/components/portal/assignee'
import { currentUserId, people, personById } from '@/data/people'
import { cn } from '@/lib/utils'

/** "UI DL · L6 Send for review": pick a teammate and write a note. */
export function SendForReviewDialog({
  open,
  onOpenChange,
  onSend,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSend: (toId: string, note: string) => void
}) {
  const [toId, setToId] = useState<string>('jaguda')
  const [note, setNote] = useState('')
  const [pickOpen, setPickOpen] = useState(false)
  const to = personById(toId)
  const canSend = !!toId && note.trim().length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setNote('')
      }}
    >
      <DialogContent className="w-[480px] max-w-[calc(100vw-32px)] gap-4 rounded-[12px] px-[22px] py-5 shadow-[0px_16px_40px_0px_rgba(0,0,0,0.18)] sm:max-w-[480px]">
        <div className="flex flex-col gap-[3px] pr-6">
          <DialogTitle className="text-[16px] font-semibold">Send for review</DialogTitle>
          <DialogDescription className="text-[12.5px] text-[#737373]">Ask a teammate to take a look. It shows up in their My Tasks.</DialogDescription>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="text-[12.5px] font-medium text-[#262626]">Teammate</div>
          <Popover open={pickOpen} onOpenChange={setPickOpen}>
            <PopoverTrigger asChild>
              <button className="flex h-[38px] items-center gap-2 rounded-[8px] border border-[#e5e5e5] px-[10px] text-left">
                <Avatar person={to} size={22} />
                <span className="flex-1 text-[13px]">{to?.name ?? 'Pick a teammate'}</span>
                <ChevronDown className="size-3.5 text-[#737373]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] gap-0 p-[6px]">
              {people
                .filter((p) => p.id !== currentUserId)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setToId(p.id)
                      setPickOpen(false)
                    }}
                    className={cn('flex w-full items-center gap-[10px] rounded-md px-2 py-[6px] text-left hover:bg-[#f5f5f5]', p.id === toId && 'bg-[#f5f5f5]')}
                  >
                    <Avatar person={p} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px]">{p.name}</span>
                      <span className="block truncate text-[11.5px] text-[#737373]">{p.email}</span>
                    </span>
                    {p.id === toId && <Check className="size-3.5" />}
                  </button>
                ))}
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="review-note" className="text-[12.5px] font-medium text-[#262626]">
            Note
          </label>
          <textarea
            id="review-note"
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What should they look at?"
            className="h-[84px] resize-none rounded-[8px] border border-[#e5e5e5] px-[10px] py-[9px] text-[13px] leading-[1.45] outline-none placeholder:text-[#a3a3a3] focus:border-[#a3a3a3]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => onOpenChange(false)} className="h-9 rounded-[8px] border border-[#e5e5e5] px-[14px] text-[13px] font-medium hover:bg-[#fafafa]">
            Cancel
          </button>
          <button
            disabled={!canSend}
            onClick={() => {
              onSend(toId, note.trim())
              setNote('')
            }}
            className="flex h-9 items-center gap-1.5 rounded-[8px] bg-[#171717] px-[14px] text-[13px] font-medium text-white disabled:bg-[#e5e5e5] disabled:text-[#a3a3a3]"
          >
            <Send className="size-[13px]" /> Send for review
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
