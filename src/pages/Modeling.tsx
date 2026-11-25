import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, CircleAlert, Download, Hand, Image as ImageIcon, Info, Upload, X } from 'lucide-react'
import { AppShell } from '@/components/portal/AppShell'
import { capitalize, CopyButton, PHOTO_TONES, RemodelNote, RoomPhoto, UnderlineTab } from '@/components/portal/taskBits'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MODELING_CHANGES } from '@/data/changes'
import { personById } from '@/data/people'
import { imageQaFor, type Task } from '@/data/tasks'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/**
 * Modeling task page for Modelling and Remodel tasks. Layout copied from today's remodel screen
 * ("RM1 · Remodel task detail"); Ryan's M3 adds the Point Cloud tab and Room ID + Claim ID.
 */
export default function Modeling() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { tasks, updateTask, claimTask, showToast } = useStore()
  const task = tasks.find((t) => t.id === id)
  const [tab, setTab] = useState<'info' | 'cloud'>('info')
  const [errorsOpen, setErrorsOpen] = useState(true)

  if (!task)
    return (
      <AppShell crumbs={[{ label: 'Tasks', to: '/' }]}>
        <div className="p-8 text-[13px] text-[#737373]">This task doesn't exist in the mock data.</div>
      </AppShell>
    )

  const remodel = task.type === 'Remodel'
  const slug = remodel ? 'remodeling' : 'modeling'
  const taskId = `${slug}-${task.id}`
  const claimer = personById(task.claimedById)
  const iqa = task.type === 'Modelling' ? imageQaFor(tasks, task) : null
  const iqaClaimer = personById(iqa?.claimedById)

  const claim = () => {
    const { alsoClaimed } = claimTask(task.id)
    showToast(alsoClaimed ? `Claimed ${task.type} · ${task.roomType}, and its Image QA` : `Claimed ${task.type} · ${task.roomType}`)
  }
  const unclaim = () => {
    updateTask(task.id, { claimedById: null, status: 'Not started' })
    showToast(`Released ${task.type} · ${task.roomType}`)
    navigate('/')
  }

  return (
    <AppShell
      changes={MODELING_CHANGES}
      crumbs={[
        { label: 'Tasks', to: '/' },
        { label: taskId, to: '/' },
        { label: remodel ? 'Remodeling' : 'Modeling' },
      ]}
    >
      <div className="relative flex min-h-full flex-col">
        <Stepper remodel={remodel} />
        <div className="flex flex-1 flex-col gap-6 px-[26px] pt-[46px] pb-6">
          {remodel && task.remodelNote && <RemodelNote note={task.remodelNote} />}

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-4">
            {/* Task Information / Point Cloud */}
            <div className="rounded-[10px] border border-[#e5e5e5] p-4">
              <div className="flex items-center gap-5 border-b border-[#e5e5e5]">
                <UnderlineTab active={tab === 'info'} onClick={() => setTab('info')}>
                  Task Information
                </UnderlineTab>
                <UnderlineTab active={tab === 'cloud'} onClick={() => setTab('cloud')}>
                  Point Cloud
                </UnderlineTab>
              </div>
              {tab === 'info' ? (
                <div className="pt-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-semibold">{task.org}</h2>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3.5 text-[#525252]" />
                      </TooltipTrigger>
                      <TooltipContent>Claim opened {task.claimOpened}</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <InfoField label="Task ID" value={taskId} />
                    {/* M3: Room ID and Claim ID right under Task ID */}
                    <div data-change="room-claim-ids" className="flex flex-col gap-3">
                      <InfoField label="Room ID" value={task.roomId} copy="Room ID" />
                      <InfoField label="Claim ID" value={task.claimId} copy="Claim ID" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                    <InfoField label="Room Name" value={`${capitalize(task.roomType)} 1`} />
                    <InfoField label="Room Type" value={task.roomType} />
                    <InfoField label="Room Description" value="Some other description here" />
                    <InfoField label="Status" value={task.status} />
                    <InfoField label="Task Type" value={remodel ? 'Remodel' : 'Model'} />
                    <InfoField label="Time Sent" value={`${task.claimOpened} 2:58:45 PM`} />
                    <InfoField label="Claimed at" value={claimer ? `${task.claimOpened} 3:40:44 PM` : '-'} />
                    <InfoField label="Claimed By" value={claimer ? claimer.email.replace(/^./, (c) => c.toUpperCase()) : '-'} />
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex h-[300px] items-center justify-center rounded-[6px] bg-black">
                  <svg viewBox="0 0 300 200" className="h-[60%]">
                    <polygon points="80,60 170,45 170,150 80,160" fill="#e9e2d3" />
                    <polygon points="170,45 225,62 225,140 170,150" fill="#cfc6b4" />
                    <polygon points="80,160 170,150 225,140 140,172" fill="#bdb5a5" />
                    <rect x="182" y="72" width="18" height="60" fill="#f4f1ea" />
                    <rect x="100" y="72" width="34" height="26" fill="#dde7ef" />
                  </svg>
                </div>
              )}
            </div>

            {/* Task Actions */}
            <div className="flex flex-col gap-4 rounded-[10px] border border-[#e5e5e5] p-4">
              <div>
                <h2 className="text-[16px] font-semibold">Task Actions</h2>
                <p className="text-[12.5px] text-[#737373]">Download instructions or upload your modeling work</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!claimer && (
                  <button
                    data-change="claim-modeling"
                    onClick={claim}
                    className="flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#171717] bg-white px-3 text-[12.5px] font-medium hover:bg-[#fafafa]"
                  >
                    <Hand className="size-3.5" /> Claim
                  </button>
                )}
                <ActionButton icon={Download} label="Instructions ZIP" />
                <ActionButton icon={ImageIcon} label="Download Images" />
                <ActionButton icon={Upload} label="Upload Modeling" dark />
              </div>
              {/* M2: the room's Image QA follows the modeling claim */}
              {iqa && claimer && (
                <div data-change="claim-modeling" className="flex items-center gap-2 rounded-[8px] bg-[#f5f5f5] px-3 py-2 text-[12.5px] text-[#525252]">
                  <Check className="size-3.5 text-[#15803d]" />
                  Image QA for this room is claimed by {iqaClaimer?.id === claimer.id ? 'you too' : (iqaClaimer?.short ?? 'nobody yet')}.
                </div>
              )}
              <div className="h-px bg-[#e5e5e5]" />
              <button onClick={() => setErrorsOpen((o) => !o)} className="flex items-center gap-2 text-left text-[13px] font-medium">
                Errors
                <span className="rounded-[5px] bg-[#f5f5f5] px-1.5 text-[11.5px] tabular-nums">{remodel ? 1 : 0}</span>
                <span className="flex-1" />
                {errorsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              {errorsOpen &&
                (remodel ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[12px] text-[#737373]">
                      <CircleAlert className="size-3.5 text-[#d97706]" /> Text Errors (1)
                    </div>
                    <div className="rounded-[6px] border border-[#fde68a] bg-[#fefce8] px-2.5 py-1.5 text-[12px] text-[#a16207]">
                      Remodel requested for the following reasons: {remodelReason(task)}
                    </div>
                  </div>
                ) : (
                  <div className="text-[12.5px] text-[#737373]">No errors.</div>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[15px] font-semibold">Damage Images</h2>
            <div className="flex flex-wrap gap-3">
              {PHOTO_TONES.slice(0, 4).map((tone, i) => (
                <RoomPhoto key={i} tone={tone} damage className="h-[150px] w-[170px]" />
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-[#e5e5e5] bg-white px-[26px] py-3">
          <button onClick={() => navigate('/')} className="h-[32px] rounded-[7px] border border-[#e5e5e5] px-3 text-[12.5px] font-medium hover:bg-[#fafafa]">
            Tasks Queue
          </button>
          <div className="flex-1" />
          {claimer && (
            <button onClick={unclaim} className="h-[32px] rounded-[7px] border border-[#e5e5e5] px-3 text-[12.5px] font-medium hover:bg-[#fafafa]">
              Unclaim
            </button>
          )}
        </div>
      </div>
    </AppShell>
  )
}

const remodelReason = (t: Task) => {
  const m = t.remodelNote?.match(/^(\w+ Error)/)
  return m ? m[1] : 'Door Error'
}

function InfoField({ label, value, copy }: { label: string; value: string; copy?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] text-[#737373]">{label}</div>
      <div className="flex items-center gap-1">
        <span className="truncate text-[13px] font-medium">{value}</span>
        {copy && <CopyButton label={copy} value={value} />}
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon, label, dark }: { icon: typeof Download; label: string; dark?: boolean }) {
  const { showToast } = useStore()
  return (
    <button
      onClick={() => showToast(`${label} isn't part of this prototype`)}
      className={cn(
        'flex h-[34px] items-center gap-1.5 rounded-[7px] px-3 text-[12.5px] font-medium',
        dark ? 'bg-[#171717] text-white hover:bg-[#262626]' : 'border border-[#e5e5e5] bg-white hover:bg-[#fafafa]',
      )}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  )
}

/** The room's progress through the pipeline, top right as in RM1 ("Image — Damage — Rework — Model — QA 3/5"). */
function Stepper({ remodel }: { remodel: boolean }) {
  const steps = remodel ? ['Image', 'Damage', 'Rework', 'Model', 'QA'] : ['Image', 'Damage', 'Model', 'QA']
  const current = remodel ? 2 : 2
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    <div className="absolute top-2 right-4 z-10 flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-2.5 py-1 text-[11.5px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
      {steps.map((s, i) => (
        <Step key={s} label={s} state={i < current ? 'done' : i === current ? 'current' : 'todo'} last={i === steps.length - 1} />
      ))}
      <span className="ml-1 text-[#737373] tabular-nums">
        {current + 1}/{steps.length}
      </span>
      <button onClick={() => setHidden(true)} aria-label="Hide progress" className="ml-0.5 rounded p-0.5 text-[#737373] hover:bg-black/5">
        <X className="size-3" />
      </button>
    </div>
  )
}

function Step({ label, state, last }: { label: string; state: 'done' | 'current' | 'todo'; last: boolean }): ReactNode {
  return (
    <>
      <span className={cn('flex items-center gap-1', state === 'done' && 'text-[#15803d]', state === 'current' && 'font-medium text-[#1d4ed8]', state === 'todo' && 'text-[#a3a3a3]')}>
        <span
          className={cn(
            'flex size-3.5 items-center justify-center rounded-full border',
            state === 'done' && 'border-[#15803d]',
            state === 'current' && 'border-[#1d4ed8] bg-[#dbeafe]',
            state === 'todo' && 'border-dashed border-[#a3a3a3]',
          )}
        >
          {state === 'done' && <Check className="size-2.5" strokeWidth={3} />}
        </span>
        {label}
      </span>
      {!last && <span className={cn('h-px w-3', state === 'done' ? 'bg-[#15803d]' : 'bg-[#d4d4d4]')} />}
    </>
  )
}
