import { useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, Check, Info, ListChecks, X } from 'lucide-react'
import { AppShell } from '@/components/portal/AppShell'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { buildIqaPhotos, type IqaPhoto } from '@/data/labeling'
import { currentUserId } from '@/data/people'
import { IMAGE_QA_CHANGES } from '@/data/changes'
import { useStore } from '@/lib/store'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const ROOM_ISSUES = ['Sideways photos', 'Missing walls in the point cloud', 'Blurry photos', 'Wrong room']

/** Image QA task page, laid out like the production screens (IQ1, IQ2). Auto-pass lives here, not in the list. */
export default function ImageQA() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { tasks, updateTask, showToast } = useStore()
  const task = tasks.find((t) => t.id === id)
  const [issues, setIssues] = useState<string[]>([])
  if (!task)
    return (
      <AppShell crumbs={[{ label: 'Tasks', to: '/' }]}>
        <div className="p-8 text-[13px] text-[#737373]">This task doesn't exist in the mock data.</div>
      </AppShell>
    )

  const photos = buildIqaPhotos(task.id)
  const firstAutoId = photos.find((p) => p.autoPassed)?.id
  const camera = photos.filter((p) => p.kind === 'camera')
  const overview = photos.filter((p) => p.kind === 'overview')
  const damage = photos.filter((p) => p.kind === 'damage')
  const title = `${task.roomType[0].toUpperCase()}${task.roomType.slice(1)} with damages`

  const finish = (approved: boolean) => {
    updateTask(task.id, { status: 'Done', dueAt: null, claimedById: currentUserId })
    showToast(approved ? `Approved ${task.roomType}` : `Rejected ${task.roomType}`)
    navigate('/')
  }
  const unclaim = () => {
    updateTask(task.id, { claimedById: null, status: 'Not started' })
    showToast(`Released ${task.type} · ${task.roomType}`)
    navigate('/')
  }

  return (
    <AppShell
      changes={IMAGE_QA_CHANGES}
      crumbs={[
        { label: 'Tasks', to: '/' },
        { label: task.roomId, to: '/' },
        { label: 'Image-qa' },
      ]}
    >
      <div className="flex flex-col gap-4 px-[17px] pt-5 pb-0">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-semibold">{title}</h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-[#525252]" />
                </TooltipTrigger>
                <TooltipContent>
                  {task.org} · Room {task.roomId.slice(0, 8)}
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="mt-1 text-[12.5px] text-[#737373]">
              Start by dragging images in order as they would be seen around the room, then mark if there are any room issues.
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex h-[35px] items-center gap-[7px] rounded-[7px] border border-[#e5e5e5] bg-white px-[13px] text-[12.5px] font-medium shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] hover:bg-[#fafafa]">
                <ListChecks className="size-3.5" /> Mark room issues {issues.length > 0 && <span className="text-[#737373]">{issues.length}</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[260px] gap-0 p-[6px]">
              {ROOM_ISSUES.map((i) => {
                const on = issues.includes(i)
                return (
                  <button
                    key={i}
                    onClick={() => setIssues((s) => (on ? s.filter((x) => x !== i) : [...s, i]))}
                    className="flex w-full items-center gap-[10px] rounded-md px-2 py-[7px] text-left text-[13px] hover:bg-[#f5f5f5]"
                  >
                    <span className={cn('flex size-4 items-center justify-center rounded-[4px] border', on ? 'border-[#171717] bg-[#171717] text-white' : 'border-[#d4d4d4]')}>
                      {on && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    {i}
                  </button>
                )
              })}
            </PopoverContent>
          </Popover>
        </div>

        {/* Point cloud + camera views */}
        <div className="flex gap-4 rounded-[10px] bg-[#f5f5f5] p-3">
          <div className="flex h-[400px] flex-1 items-center justify-center rounded-[4px] bg-black">
            <PointCloud />
          </div>
          <div className="flex w-[200px] flex-col gap-2.5">
            <div className="text-[14px] font-semibold">Camera Views</div>
            <div className="flex max-h-[370px] flex-col gap-2.5 overflow-y-auto pr-1">
              {camera.map((p) => (
                <Photo key={p.id} photo={p} className="h-[110px] w-full" caption first={p.id === firstAutoId} />
              ))}
            </div>
          </div>
        </div>

        <Section title="Overview Images" hint="Drag images to reorder them as needed for the Overview Images.">
          {overview.map((p) => (
            <Photo key={p.id} photo={p} className="h-[130px] w-[180px]" />
          ))}
        </Section>
        <Section title="Damage Images">
          {damage.map((p) => (
            <Photo key={p.id} photo={p} className="h-[100px] w-[150px]" />
          ))}
        </Section>

        {/* Footer actions */}
        <div className="sticky bottom-0 -mx-[17px] flex items-center gap-2 border-t border-[#e5e5e5] bg-white px-[17px] py-3">
          <button onClick={unclaim} className="h-[32px] rounded-[7px] border border-[#e5e5e5] px-3 text-[12.5px] font-medium hover:bg-[#fafafa]">
            Unclaim
          </button>
          <div className="flex-1" />
          <button
            onClick={() => finish(false)}
            className="flex h-[32px] items-center gap-1.5 rounded-[7px] bg-[#fca5a5] px-3 text-[12.5px] font-medium text-white hover:bg-[#f87171]"
          >
            <X className="size-3.5" /> Reject
          </button>
          <button onClick={() => finish(true)} className="flex h-[32px] items-center gap-1.5 rounded-[7px] bg-[#171717] px-3 text-[12.5px] font-medium text-white hover:bg-[#262626]">
            <Check className="size-3.5" /> Approve
          </button>
        </div>
      </div>
    </AppShell>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        {hint && <div className="text-[12px] text-[#737373]">{hint}</div>}
      </div>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  )
}

/** Placeholder room photo. Auto-passed photos get a small icon; the confidence only shows on hover. */
function Photo({ photo: p, className, caption, first }: { photo: IqaPhoto; className?: string; caption?: boolean; first?: boolean }) {
  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-[6px] border border-[#e5e5e5] bg-white p-1', className)}>
      <div className="relative size-full overflow-hidden rounded-[3px]" style={{ background: p.tone }}>
        {/* simple room: back wall, floor, a door and a window */}
        <div className="absolute inset-x-0 bottom-0 h-[28%] bg-black/10" />
        <div className="absolute top-[22%] right-[14%] h-[52%] w-[16%] rounded-[2px] bg-white/70" />
        <div className="absolute top-[20%] left-[16%] h-[26%] w-[24%] rounded-[2px] bg-[#e7eef5]/90" />
        {caption && (
          <div className="absolute inset-x-0 bottom-0 bg-black/45 px-1.5 py-1 text-center text-[9.5px] leading-tight break-all text-white">{p.id}</div>
        )}
      </div>
      {p.autoPassed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              aria-label="Auto-passed"
              data-testid="auto-passed"
              data-change={first ? 'auto-pass' : undefined}
              className="absolute top-2 left-2 flex size-[22px] items-center justify-center rounded-full bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.2)]"
            >
              <BadgeCheck className="size-[15px] text-[#15803d]" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="flex-col items-start gap-0.5">
            <div className="font-medium">Auto-passed</div>
            <div className="opacity-80">{p.confidence}% model confidence (threshold 99.6%)</div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

/** A simple stand-in for the point cloud: a box-shaped room drawn in perspective. */
function PointCloud() {
  return (
    <svg viewBox="0 0 300 200" className="h-[60%]">
      <polygon points="80,60 170,45 170,150 80,160" fill="#e9e2d3" />
      <polygon points="170,45 225,62 225,140 170,150" fill="#cfc6b4" />
      <polygon points="80,160 170,150 225,140 140,172" fill="#bdb5a5" />
      <rect x="182" y="72" width="18" height="60" fill="#f4f1ea" />
      <rect x="100" y="72" width="34" height="26" fill="#dde7ef" />
      <rect x="92" y="125" width="40" height="22" fill="#8a7f70" />
    </svg>
  )
}
