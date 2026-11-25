import { useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, Check, Info, ListChecks, LoaderCircle, RefreshCw, RotateCw, TriangleAlert, X } from 'lucide-react'
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
  // Q2: which flagged photos have been rotated, and the regenerate step.
  const [rotated, setRotated] = useState<string[]>([])
  const [regen, setRegen] = useState<'idle' | 'running' | 'done'>('idle')
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
  // Q2: in a sideways room, two camera views and one overview photo were taken on their side.
  const flagged = task.sideways ? [photos[1].id, photos[3].id, photos[5].id] : []
  const left = flagged.filter((pid) => !rotated.includes(pid))
  const rotate = (pid: string) => setRotated((r) => (r.includes(pid) ? r : [...r, pid]))
  const regenerate = () => {
    setRegen('running')
    window.setTimeout(() => {
      updateTask(task.id, { sideways: false })
      setRotated([])
      setRegen('done')
      showToast('New point cloud ready. The room is back in Image QA.')
    }, 1800)
  }
  const photoProps = (p: IqaPhoto) => ({
    sideways: flagged.includes(p.id) && !rotated.includes(p.id),
    rotated: flagged.includes(p.id) && rotated.includes(p.id),
    onRotate: () => rotate(p.id),
  })

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
              <button className="flex h-[35px] items-center gap-[7px] rounded-[7px] border border-[#e5e5e5] bg-white px-[13px] text-[12.5px] font-medium hover:bg-[#fafafa]">
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

        {/* Q2: why the cloud is unusable, and the way out */}
        {task.sideways && (
          <div data-change="sideways-banner" className="flex items-start gap-3 rounded-[10px] border border-[#fed7aa] bg-[#fff7ed] px-4 py-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#c2410c]" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[#0a0a0a]">
                {left.length > 0
                  ? `${flagged.length} photos are sideways, so the point cloud is unusable`
                  : 'All photos are upright. Regenerate the point cloud to use them.'}
              </div>
              <p className="mt-0.5 text-[12.5px] leading-[1.5] text-[#525252]">
                The point cloud is built by matching each photo to the next. Sideways photos don't line up with the others, so walls land in the wrong place and parts of the room are missing. Rotate the flagged photos, then regenerate.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setRotated(flagged)}
                disabled={left.length === 0 || regen === 'running'}
                className="flex h-[32px] items-center gap-1.5 rounded-[7px] border border-[#e5e5e5] bg-white px-3 text-[12.5px] font-medium hover:bg-[#fafafa] disabled:pointer-events-none disabled:text-[#a3a3a3]"
              >
                <RotateCw className="size-3.5" /> Rotate all {left.length > 0 ? left.length : ''}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={left.length ? 0 : -1} className="flex">
                    <button
                      onClick={regenerate}
                      disabled={left.length > 0 || regen === 'running'}
                      data-testid="regenerate"
                      className="flex h-[32px] items-center gap-1.5 rounded-[7px] bg-[#171717] px-3 text-[12.5px] font-medium text-white hover:bg-[#262626] disabled:pointer-events-none disabled:bg-[#e5e5e5] disabled:text-[#a3a3a3]"
                    >
                      {regen === 'running' ? <LoaderCircle className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                      {regen === 'running' ? 'Regenerating…' : 'Regenerate point cloud'}
                    </button>
                  </span>
                </TooltipTrigger>
                {left.length > 0 && <TooltipContent>Rotate the {left.length} flagged photo{left.length > 1 ? 's' : ''} first</TooltipContent>}
              </Tooltip>
            </div>
          </div>
        )}
        {regen === 'done' && !task.sideways && (
          <div className="flex items-center gap-2 rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2.5 text-[12.5px] text-[#15803d]">
            <Check className="size-3.5" /> Point cloud regenerated from the rotated photos. Check it, then approve or reject as usual.
          </div>
        )}

        {/* Point cloud + camera views */}
        <div className="flex gap-4 rounded-[10px] bg-[#f5f5f5] p-3">
          <div className="relative flex h-[400px] flex-1 items-center justify-center rounded-[4px] bg-black">
            {regen === 'running' ? (
              <div className="flex flex-col items-center gap-2 text-[12.5px] text-white/80">
                <LoaderCircle className="size-5 animate-spin" /> Regenerating point cloud…
              </div>
            ) : task.sideways ? (
              <BrokenPointCloud />
            ) : (
              <PointCloud />
            )}
          </div>
          <div className="flex w-[200px] flex-col gap-2.5">
            <div className="text-[14px] font-semibold">Camera Views</div>
            <div className="flex max-h-[370px] flex-col gap-2.5 overflow-y-auto pr-1">
              {camera.map((p) => (
                <Photo key={p.id} photo={p} className="h-[110px] w-full" caption first={p.id === firstAutoId} {...photoProps(p)} />
              ))}
            </div>
          </div>
        </div>

        <Section title="Overview Images" hint="Drag images to reorder them as needed for the Overview Images.">
          {overview.map((p) => (
            <Photo key={p.id} photo={p} className="h-[130px] w-[180px]" {...photoProps(p)} />
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

/** Placeholder room photo. Auto-passed photos get a small icon; the confidence only shows on hover.
 * Q2: a sideways photo shows the room turned on its side, with a Sideways tag and its own rotate button. */
function Photo({
  photo: p,
  className,
  caption,
  first,
  sideways,
  rotated,
  onRotate,
}: {
  photo: IqaPhoto
  className?: string
  caption?: boolean
  first?: boolean
  sideways?: boolean
  rotated?: boolean
  onRotate?: () => void
}) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[6px] border bg-white p-1',
        sideways ? 'border-[#fb923c] outline-[1.5px] outline-[#fb923c] outline-solid' : 'border-[#e5e5e5]',
        className,
      )}
      data-testid={sideways ? 'sideways-photo' : undefined}
    >
      <div className="relative size-full overflow-hidden rounded-[3px]" style={{ background: p.tone }}>
        {/* simple room: back wall, floor, a door and a window. Turned 90° when the photo is sideways. */}
        <div className={cn('absolute inset-0 transition-transform duration-300', sideways && 'scale-[1.6] rotate-90')}>
          <div className="absolute inset-x-0 bottom-0 h-[28%] bg-black/10" />
          <div className="absolute top-[22%] right-[14%] h-[52%] w-[16%] rounded-[2px] bg-white/70" />
          <div className="absolute top-[20%] left-[16%] h-[26%] w-[24%] rounded-[2px] bg-[#e7eef5]/90" />
        </div>
        {caption && (
          <div className="absolute inset-x-0 bottom-0 bg-black/45 px-1.5 py-1 text-center text-[9.5px] leading-tight break-all text-white">{p.id}</div>
        )}
      </div>
      {sideways && (
        <>
          <span className="absolute top-2 left-2 rounded-full bg-[#c2410c] px-2 py-[2px] text-[10.5px] font-semibold text-white">Sideways</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onRotate}
                aria-label="Rotate this photo"
                className="absolute top-2 right-2 flex size-[26px] items-center justify-center rounded-full bg-white text-[#0a0a0a] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] hover:bg-[#f5f5f5]"
              >
                <RotateCw className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Rotate this photo</TooltipContent>
          </Tooltip>
        </>
      )}
      {rotated && (
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-white px-2 py-[2px] text-[10.5px] font-medium text-[#15803d] shadow-[0px_1px_3px_rgba(0,0,0,0.2)]">
          <Check className="size-3" /> Rotated
        </span>
      )}
      {p.autoPassed && !sideways && !rotated && (
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

/** Q2: what a cloud built from sideways photos looks like: walls in pieces, at the wrong angles, with gaps. */
function BrokenPointCloud() {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 300 200" className="h-[240px] opacity-90">
        <polygon points="70,70 120,58 118,120 72,128" fill="#e9e2d3" />
        <polygon points="150,30 205,48 196,92 146,80" fill="#cfc6b4" transform="rotate(38 175 60)" />
        <polygon points="160,120 230,112 236,150 170,160" fill="#bdb5a5" transform="rotate(-24 200 135)" />
        <polygon points="96,140 132,134 130,170 98,176" fill="#cfc6b4" transform="rotate(64 114 155)" />
        <rect x="214" y="70" width="14" height="44" fill="#f4f1ea" transform="rotate(90 221 92)" />
        {Array.from({ length: 70 }, (_, i) => (
          <circle key={i} cx={40 + ((i * 53) % 230)} cy={20 + ((i * 37) % 165)} r={0.9 + (i % 3) * 0.4} fill="#e9e2d3" opacity={0.35 + (i % 4) * 0.12} />
        ))}
      </svg>
      <div className="rounded-full bg-white/10 px-3 py-1 text-[11.5px] text-white/80">Unusable: walls don't line up</div>
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
