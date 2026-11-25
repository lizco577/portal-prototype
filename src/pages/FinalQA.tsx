import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowUpDown, Check, ChevronDown, Download, Eye, FileBox, Hourglass, Info, Plus, RefreshCw, Search, UserCheck, X } from 'lucide-react'
import { AppShell } from '@/components/portal/AppShell'
import { TaskStatusChip } from '@/components/portal/chips'
import { capitalize, PHOTO_TONES, RemodelNote, RemodeledTag, RoomPhoto, UnderlineTab } from '@/components/portal/taskBits'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FINAL_QA_CHANGES } from '@/data/changes'
import { currentUserId, personById } from '@/data/people'
import { RULES, sortRules, type Rule, type RuleSort } from '@/data/rules'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

type Role = 'modeler' | 'specialist'
type Tab = 'line-items' | 'images' | 'modelers'

const REVIEWER_ID = 'jaguda'

const SORTS: { key: RuleSort; label: string; hint: string }[] = [
  { key: 'az', label: 'A to Z', hint: 'Alphabetical' },
  { key: 'used', label: 'Most used', hint: 'Most added in the last 30 days first' },
]

type LineItemRow = { id: string; rule: Rule; qty: number; unit: string }
const START_ITEMS = ['wall-drywall-patch', 'wall-paint-walls-two-coats', 'room-prep-content-manipulation-average-room']

/**
 * Final QA task page. There's no screenshot of today's Final QA, so the layout follows Ryan's D9 mockups
 * (Modelers tab) in the style of our Image QA and Damage Labeling pages.
 */
export default function FinalQA() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { tasks, updateTask, showToast } = useStore()
  const task = tasks.find((t) => t.id === id)
  const [role, setRole] = useState<Role>('specialist')
  const [tab, setTab] = useState<Tab>('line-items')
  const [items, setItems] = useState<LineItemRow[]>(() =>
    START_ITEMS.map((rid, i) => ({ id: `li-${i}`, rule: RULES.find((r) => r.id === rid)!, qty: [32, 410, 1][i], unit: ['SF', 'SF', 'EA'][i] })),
  )
  const [addOpen, setAddOpen] = useState(false)
  const [remodelOpen, setRemodelOpen] = useState(false)

  if (!task)
    return (
      <AppShell crumbs={[{ label: 'Tasks', to: '/' }]}>
        <div className="p-8 text-[13px] text-[#737373]">This task doesn't exist in the mock data.</div>
      </AppShell>
    )

  const readyForReview = task.status === 'Ready for Review'
  const signedOff = readyForReview && task.reviewerSignedOff
  const reviewer = personById(REVIEWER_ID)!

  const approve = () => {
    updateTask(task.id, { status: 'Done', dueAt: null, claimedById: task.claimedById ?? currentUserId })
    showToast(`Approved ${task.roomType}`)
    navigate('/')
  }
  const setReady = (on: boolean) => {
    updateTask(task.id, { status: on ? 'Ready for Review' : 'In Progress', reviewerSignedOff: false })
    showToast(on ? 'Set to Ready for Review. A reviewer signs off before it can be approved.' : 'Back to In Progress')
  }
  const unclaim = () => {
    updateTask(task.id, { claimedById: null, status: 'Not started' })
    showToast(`Released ${task.type} · ${task.roomType}`)
    navigate('/')
  }

  return (
    <AppShell
      changes={FINAL_QA_CHANGES}
      annotations={<ReviewerSignOff taskId={task.id} />}
      crumbs={[
        { label: 'Tasks', to: '/' },
        { label: task.roomId, to: '/' },
        { label: 'Final-qa' },
      ]}
    >
      <div className="flex min-h-full flex-col gap-4 px-[17px] pt-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[16px] font-semibold">{capitalize(task.roomType)} · Final QA</h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-[#525252]" />
                </TooltipTrigger>
                <TooltipContent>
                  {task.org} · Claim {task.claimId.slice(0, 8)}
                </TooltipContent>
              </Tooltip>
              {task.remodelNote && <RemodeledTag />}
              <TaskStatusChip status={task.status} />
            </div>
            <p className="mt-1 text-[12.5px] text-[#737373]">
              {task.org} · Room {task.roomId}
            </p>
          </div>
          {/* Prototype control: compare what each role sees (D9) */}
          <div className="flex shrink-0 items-center gap-2" data-testid="viewing-as">
            <span className="text-[12px] text-[#737373]">Viewing as</span>
            <div className="flex rounded-[8px] bg-[#f5f5f5] p-[3px]">
              {(['modeler', 'specialist'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  aria-pressed={role === r}
                  className={cn('h-[26px] rounded-[6px] px-2.5 text-[12px] font-medium', role === r ? 'bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.1)]' : 'text-[#737373] hover:text-[#0a0a0a]')}
                >
                  {r === 'modeler' ? 'Modeler' : 'Claim specialist'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {task.remodelNote && <RemodelNote note={task.remodelNote} />}

        <div className="flex items-center gap-5 border-b border-[#e5e5e5]">
          <UnderlineTab active={tab === 'line-items'} onClick={() => setTab('line-items')}>
            Line Items <span className="font-normal text-[#a3a3a3] tabular-nums">{items.length}</span>
          </UnderlineTab>
          <UnderlineTab active={tab === 'images'} onClick={() => setTab('images')}>
            Images
          </UnderlineTab>
          <UnderlineTab active={tab === 'modelers'} onClick={() => setTab('modelers')} dataChange="modelers-tab">
            Modelers
          </UnderlineTab>
        </div>

        <div className="flex-1">
          {tab === 'line-items' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center">
                <div className="flex-1 text-[12.5px] text-[#737373]">Check the ESX line items against the photos, then fix or add what's missing.</div>
                <button
                  data-change="add-line-items"
                  onClick={() => setAddOpen(true)}
                  className="flex h-[32px] items-center gap-1.5 rounded-[7px] border border-[#e5e5e5] bg-white px-3 text-[12.5px] font-medium hover:bg-[#fafafa]"
                >
                  <Plus className="size-3.5" /> Add line items
                </button>
              </div>
              <div className="overflow-hidden rounded-[10px] border border-[#e5e5e5]">
                <table className="w-full text-[12.5px]">
                  <thead className="bg-[#fafafa] text-left text-[12px] text-[#737373]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Rule</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="w-[90px] px-3 py-2 text-right font-medium">Quantity</th>
                      <th className="w-[44px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-t border-[#f0f0f0]">
                        <td className="px-3 py-2.5 font-medium">{it.rule.name}</td>
                        <td className="px-3 py-2.5 text-[#525252]">{it.rule.category}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {it.qty} {it.unit}
                        </td>
                        <td className="pr-2 text-right">
                          <button
                            onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}
                            aria-label={`Remove ${it.rule.name}`}
                            className="rounded p-1 text-[#a3a3a3] hover:bg-black/5 hover:text-[#0a0a0a]"
                          >
                            <X className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'images' && (
            <div className="flex flex-col gap-2">
              <div className="text-[13.5px] font-semibold">Damage Images</div>
              <div className="flex flex-wrap gap-3">
                {PHOTO_TONES.slice(0, 6).map((tone, i) => (
                  <RoomPhoto key={i} tone={tone} damage className="h-[130px] w-[180px]" />
                ))}
              </div>
            </div>
          )}

          {tab === 'modelers' && (
            <div className="flex max-w-[720px] flex-col gap-3 rounded-[10px] border border-[#e5e5e5] p-4">
              <div>
                <div className="text-[14px] font-semibold">Modeling files</div>
                <div className="text-[12.5px] text-[#737373]">
                  {role === 'modeler'
                    ? 'Download what you need to fix the model, or send it back for a remodel.'
                    : 'Check the model and the ESX, or send the room back for a remodel.'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2" data-change="modeler-buttons" data-testid="modeler-buttons">
                {role === 'modeler' && (
                  <>
                    <FileButton icon={Download} label="Download Instructions" />
                    <FileButton icon={Download} label="Download Modeling Files" />
                  </>
                )}
                <FileButton icon={Eye} label="View FML" />
                <FileButton icon={FileBox} label="View ESX" />
                <button
                  onClick={() => setRemodelOpen(true)}
                  className="flex h-[32px] items-center gap-1.5 rounded-[7px] bg-[#171717] px-3 text-[12.5px] font-medium text-white hover:bg-[#262626]"
                >
                  <RefreshCw className="size-3.5" /> Request Remodeling
                </button>
              </div>
              {role === 'specialist' && (
                <div className="text-[11.5px] text-[#a3a3a3]">Download Instructions and Download Modeling Files are for modelers, so they're hidden here.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 -mx-[17px] flex items-center gap-2 border-t border-[#e5e5e5] bg-white px-[17px] py-3">
          <button onClick={unclaim} className="h-[32px] rounded-[7px] border border-[#e5e5e5] px-3 text-[12.5px] font-medium hover:bg-[#fafafa]">
            Unclaim
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2" data-change="ready-for-review">
            {readyForReview ? (
              <>
                {signedOff ? (
                  <span className="flex items-center gap-1.5 text-[12.5px] text-[#15803d]">
                    <Check className="size-3.5" /> Signed off by {reviewer.short}
                  </span>
                ) : (
                  <button onClick={() => setReady(false)} className="h-[32px] rounded-[7px] px-2 text-[12.5px] text-[#525252] hover:text-[#0a0a0a] hover:underline">
                    Cancel review
                  </button>
                )}
                {signedOff ? (
                  <button onClick={approve} className="flex h-[32px] items-center gap-1.5 rounded-[7px] bg-[#171717] px-3 text-[12.5px] font-medium text-white hover:bg-[#262626]">
                    <Check className="size-3.5" /> Approve
                  </button>
                ) : (
                  <span
                    data-testid="waiting-on-reviewer"
                    className="flex h-[32px] items-center gap-1.5 rounded-[7px] bg-[#f5f5f5] px-3 text-[12.5px] font-medium text-[#525252]"
                  >
                    <Hourglass className="size-3.5" /> Waiting on reviewer
                  </span>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setReady(true)}
                  className="flex h-[32px] items-center gap-1.5 rounded-[7px] border border-[#e5e5e5] bg-white px-3 text-[12.5px] font-medium hover:bg-[#fafafa]"
                >
                  <UserCheck className="size-3.5" /> Ready for Review
                </button>
                <button onClick={approve} className="flex h-[32px] items-center gap-1.5 rounded-[7px] bg-[#171717] px-3 text-[12.5px] font-medium text-white hover:bg-[#262626]">
                  <Check className="size-3.5" /> Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <AddLineItems
        open={addOpen}
        onOpenChange={setAddOpen}
        existing={items.map((i) => i.rule.id)}
        onAdd={(rules) => {
          setItems((xs) => [...xs, ...rules.map((r, i) => ({ id: `li-${Date.now()}-${i}`, rule: r, qty: 1, unit: 'EA' }))])
          showToast(`Added ${rules.length} line item${rules.length > 1 ? 's' : ''}`)
        }}
      />
      <RequestRemodel
        open={remodelOpen}
        onOpenChange={setRemodelOpen}
        onSend={() => {
          showToast('Remodel requested. The room goes back to modeling with your note.')
          navigate('/')
        }}
      />
    </AppShell>
  )
}

function FileButton({ icon: Icon, label }: { icon: typeof Download; label: string }) {
  const { showToast } = useStore()
  return (
    <button
      onClick={() => showToast(`${label} isn't part of this prototype`)}
      className="flex h-[32px] items-center gap-1.5 rounded-[7px] border border-[#e5e5e5] bg-white px-3 text-[12.5px] font-medium hover:bg-[#fafafa]"
    >
      <Icon className="size-3.5" /> {label}
    </button>
  )
}

/** F2: pick rules to add as line items. The list sorts A to Z or Most used. */
function AddLineItems({
  open,
  onOpenChange,
  existing,
  onAdd,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  existing: string[]
  onAdd: (rules: Rule[]) => void
}) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<RuleSort>('az')
  const [picked, setPicked] = useState<string[]>([])
  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return sortRules(RULES, sort).filter((r) => !query || `${r.name} ${r.category}`.toLowerCase().includes(query))
  }, [q, sort])
  const close = (o: boolean) => {
    onOpenChange(o)
    if (!o) {
      setQ('')
      setPicked([])
    }
  }
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[80vh] w-[520px] max-w-[calc(100vw-32px)] flex-col gap-0 p-0">
        <div className="px-[22px] pt-5 pb-3">
          <DialogTitle className="text-[15px] font-semibold">Add line items</DialogTitle>
          <DialogDescription className="text-[12.5px] text-[#737373]">Pick the rules to add. Each rule adds its line items to the ESX.</DialogDescription>
        </div>
        <div className="flex items-center gap-2 px-[22px] pb-3">
          <label className="flex h-[34px] flex-1 items-center gap-2 rounded-[8px] border border-[#e5e5e5] px-3 focus-within:border-[#a3a3a3]">
            <Search className="size-3.5 text-[#a3a3a3]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rules" className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]" />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-testid="rule-sort" className="flex h-[34px] items-center gap-1.5 rounded-[8px] border border-[#e5e5e5] px-3 text-[12.5px] font-medium hover:bg-[#fafafa]">
                <ArrowUpDown className="size-3.5" /> Order: {SORTS.find((s) => s.key === sort)!.label}
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px] p-[5px]">
              {SORTS.map((s) => (
                <DropdownMenuItem key={s.key} onSelect={() => setSort(s.key)} className={cn('items-start py-[7px]', s.key === sort && 'bg-[#f5f5f5]')}>
                  <span className="flex-1">
                    <span className="block text-[13px]">{s.label}</span>
                    <span className="block text-[11.5px] text-[#737373]">{s.hint}</span>
                  </span>
                  {s.key === sort && <Check className="mt-0.5 size-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#f0f0f0] px-[14px] py-2">
          {list.map((r) => {
            const added = existing.includes(r.id)
            const on = picked.includes(r.id)
            return (
              <button
                key={r.id}
                disabled={added}
                onClick={() => setPicked((p) => (on ? p.filter((x) => x !== r.id) : [...p, r.id]))}
                className="flex w-full items-center gap-[10px] rounded-md px-2 py-[7px] text-left text-[13px] hover:bg-[#f5f5f5] disabled:pointer-events-none disabled:opacity-50"
              >
                <span className={cn('flex size-4 shrink-0 items-center justify-center rounded-[4px] border', on || added ? 'border-[#171717] bg-[#171717] text-white' : 'border-[#d4d4d4]')}>
                  {(on || added) && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{r.name}</span>
                  <span className="block text-[11.5px] text-[#737373]">
                    {r.category}
                    {added ? ' · Already added' : ''}
                  </span>
                </span>
                <span className="shrink-0 text-[11.5px] text-[#a3a3a3] tabular-nums">Used {r.usage}×</span>
              </button>
            )
          })}
          {list.length === 0 && <div className="px-2 py-3 text-[12.5px] text-[#737373]">No rules match.</div>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#e5e5e5] px-[22px] py-3">
          <button onClick={() => close(false)} className="h-[32px] rounded-[7px] border border-[#e5e5e5] px-3 text-[12.5px] font-medium hover:bg-[#fafafa]">
            Cancel
          </button>
          <button
            disabled={!picked.length}
            onClick={() => {
              onAdd(RULES.filter((r) => picked.includes(r.id)))
              close(false)
            }}
            className="h-[32px] rounded-[7px] bg-[#171717] px-3 text-[12.5px] font-medium text-white hover:bg-[#262626] disabled:pointer-events-none disabled:bg-[#e5e5e5] disabled:text-[#a3a3a3]"
          >
            Add {picked.length || ''}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RequestRemodel({ open, onOpenChange, onSend }: { open: boolean; onOpenChange: (o: boolean) => void; onSend: () => void }) {
  const [note, setNote] = useState('')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[460px] max-w-[calc(100vw-32px)] gap-3 p-[22px]">
        <DialogTitle className="text-[15px] font-semibold">Request remodeling</DialogTitle>
        <DialogDescription className="text-[12.5px] text-[#737373]">
          Say what's wrong with the model. Your note shows to the modeler, and to whoever picks up Final QA when the room comes back.
        </DialogDescription>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. The door on the north wall is missing"
          className="h-[100px] resize-none rounded-[8px] border border-[#e5e5e5] p-3 text-[13px] outline-none placeholder:text-[#a3a3a3] focus:border-[#a3a3a3]"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => onOpenChange(false)} className="h-[32px] rounded-[7px] border border-[#e5e5e5] px-3 text-[12.5px] font-medium hover:bg-[#fafafa]">
            Cancel
          </button>
          <button
            disabled={!note.trim()}
            onClick={() => {
              onOpenChange(false)
              onSend()
            }}
            className="h-[32px] rounded-[7px] bg-[#171717] px-3 text-[12.5px] font-medium text-white hover:bg-[#262626] disabled:pointer-events-none disabled:bg-[#e5e5e5] disabled:text-[#a3a3a3]"
          >
            Send for remodel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Prototype control in the What's changed panel: a reviewer signs off a Ready for Review task (F5). */
function ReviewerSignOff({ taskId }: { taskId: string }) {
  const { tasks, updateTask, showToast } = useStore()
  const task = tasks.find((t) => t.id === taskId)
  if (!task) return null
  const waiting = task.status === 'Ready for Review' && !task.reviewerSignedOff
  return (
    <div className="flex flex-col gap-2 border-b border-[#e5e5e5] px-4 py-3">
      <div className="text-[12px] font-medium text-[#737373]">Reviewer</div>
      <button
        disabled={!waiting}
        onClick={() => {
          updateTask(taskId, { reviewerSignedOff: true })
          showToast(`${personById(REVIEWER_ID)!.short} signed off`)
        }}
        className="h-[30px] rounded-[7px] border border-[#e5e5e5] bg-white px-2 text-[12px] font-medium hover:bg-[#f5f5f5] disabled:pointer-events-none disabled:text-[#a3a3a3]"
      >
        {task.status !== 'Ready for Review' ? 'Set Ready for Review first' : task.reviewerSignedOff ? 'Signed off' : `Sign off as ${personById(REVIEWER_ID)!.short}`}
      </button>
    </div>
  )
}
