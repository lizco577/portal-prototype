import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  ImageOff,
  MousePointer2,
  PenTool,
  Redo2,
  Send,
  Settings,
  Trash2,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react'
import { AppShell } from '@/components/portal/AppShell'
import { Avatar } from '@/components/portal/assignee'
import { ChoiceSelect } from '@/components/portal/ChoiceSelect'
import { MaterialsDialog } from '@/components/portal/MaterialsDialog'
import { WHATS_CHANGED_OPEN } from '@/components/portal/ChangesPanel'
import { SendForReviewDialog } from '@/components/portal/SendForReviewDialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DAMAGE_TYPES, SURFACES, type Label, type PhotoState, type Point } from '@/data/labeling'
import { currentUserId, personById } from '@/data/people'
import { DAMAGE_LABELING_CHANGES } from '@/data/changes'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

type Mode = 'draw' | 'select'

const labelName = (l: Label) =>
  [l.surface, l.damage].filter(Boolean).join('-').toLowerCase().replace(/\s+/g, '-') + (l.surface || l.damage ? `-${l.n}` : `label-${l.n}`)

export default function DamageLabeling() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { tasks, photosFor, setPhotos, updateTask, showToast, reviews, sendForReview, dismissReviewBanner, sortedMaterials } = useStore()
  const task = tasks.find((t) => t.id === id)
  const photos = photosFor(id)
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>('draw')
  const [draft, setDraft] = useState<Point[]>([])
  const [cursor, setCursor] = useState<Point | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [redo, setRedo] = useState<Label[]>([])
  const [tab, setTab] = useState<'labels' | 'notes'>('labels')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [materialsOpen, setMaterialsOpen] = useState(false)
  const photoRef = useRef<HTMLDivElement>(null)

  const photo = photos[index]
  const doneCount = photos.filter((p) => p.done).length
  const allDone = doneCount === photos.length
  const review = reviews[id]

  const updatePhoto = useCallback(
    (fn: (p: PhotoState) => PhotoState) => setPhotos(id, (ps) => ps.map((p, i) => (i === index ? fn(p) : p))),
    [id, index, setPhotos],
  )
  const updateLabel = (labelId: string, patch: Partial<Label>) =>
    updatePhoto((p) => ({ ...p, labels: p.labels.map((l) => (l.id === labelId ? { ...l, ...patch } : l)) }))

  // "What's changed" rows can open this page's modals.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const what = (e as CustomEvent<string>).detail
      if (what === 'materials') setMaterialsOpen(true)
      if (what === 'send-for-review') setReviewOpen(true)
    }
    window.addEventListener(WHATS_CHANGED_OPEN, onOpen)
    return () => window.removeEventListener(WHATS_CHANGED_OPEN, onOpen)
  }, [])

  // Esc stops drawing. Enter closes the shape you're drawing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Esc on an open modal, menu or dropdown only closes that, it doesn't stop drawing.
      if (reviewOpen || materialsOpen) return
      if (document.querySelector('[role=dialog], [data-slot=popover-content], [data-slot=dropdown-menu-content]')) return
      if (e.key === 'Escape') {
        setDraft([])
        setMode('select')
      }
      if (e.key === 'Enter' && draft.length >= 3) closeShape()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!task) {
    return (
      <AppShell crumbs={[{ label: 'Tasks', to: '/' }]}>
        <div className="p-8 text-[13px] text-[#737373]">This task doesn't exist in the mock data.</div>
      </AppShell>
    )
  }

  // Points outside the photo snap to its edge, so drawing into the black area never breaks the shape (L2).
  const toPoint = (e: React.MouseEvent): Point | null => {
    const r = photoRef.current?.getBoundingClientRect()
    if (!r) return null
    const clamp = (v: number) => Math.min(1, Math.max(0, v))
    return [clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height)]
  }
  const nearFirst = (p: Point) => {
    const r = photoRef.current?.getBoundingClientRect()
    if (!r || draft.length < 3) return false
    const [fx, fy] = draft[0]
    return Math.hypot((p[0] - fx) * r.width, (p[1] - fy) * r.height) < 12
  }
  function closeShape() {
    if (draft.length < 3) return
    const n = photos.reduce((a, p) => a + p.labels.length, 0) + 1
    const label: Label = { id: `l${Date.now()}`, n, points: draft, surface: '', material: '', damage: '' }
    updatePhoto((p) => ({ ...p, labels: [...p.labels, label], noDamage: false }))
    setSelected(label.id)
    setDraft([])
    setRedo([])
    setTab('labels')
    // Drawing stays on for the next shape until Esc.
  }
  const onCanvasClick = (e: React.MouseEvent) => {
    if (mode !== 'draw') return
    const p = toPoint(e)
    if (!p) return
    if (nearFirst(p)) closeShape()
    else setDraft((d) => [...d, p])
  }

  const goTo = (i: number) => {
    setIndex(i)
    setTab('labels')
    setDraft([])
    setSelected(null)
    setRedo([])
  }
  const nextPhoto = () => {
    const hasLabels = photo.labels.length > 0
    updatePhoto((p) => ({ ...p, done: true, noDamage: !hasLabels }))
    const next = photos.findIndex((p, i) => i > index && !p.done)
    const wrap = photos.findIndex((p, i) => i !== index && !p.done)
    const target = next >= 0 ? next : wrap
    if (target >= 0) goTo(target)
    showToast(hasLabels ? `Photo ${index + 1} done` : `Photo ${index + 1} marked as no damage`)
  }
  const finish = () => {
    updateTask(task.id, { status: 'Done', dueAt: null })
    showToast(`Labeling finished · ${task.roomType}`)
    navigate('/')
  }
  const undo = () => {
    if (draft.length) return setDraft((d) => d.slice(0, -1))
    const last = photo.labels[photo.labels.length - 1]
    if (!last) return
    updatePhoto((p) => ({ ...p, labels: p.labels.slice(0, -1) }))
    setRedo((r) => [...r, last])
  }
  const redoLast = () => {
    const l = redo[redo.length - 1]
    if (!l) return
    updatePhoto((p) => ({ ...p, labels: [...p.labels, l] }))
    setRedo((r) => r.slice(0, -1))
  }
  const deleteLabel = (labelId: string) => {
    updatePhoto((p) => ({ ...p, labels: p.labels.filter((l) => l.id !== labelId), done: p.labels.length > 1 ? p.done : false }))
    if (selected === labelId) setSelected(null)
  }

  const replied = review?.reply
  const showBanner = review && !review.bannerDismissed && (review.fromId === currentUserId || replied)

  return (
    <AppShell
      changes={DAMAGE_LABELING_CHANGES}
      crumbs={[
        { label: 'Tasks', to: '/' },
        { label: task.roomId, to: '/' },
        { label: 'Damage-labeling' },
        { label: 'Draw' },
      ]}
    >
      <div className="flex gap-4 px-[17px] pt-4 pb-6">
        {/* Canvas column */}
        <div className="flex min-w-0 flex-1 flex-col gap-[14px]">
          <div className="flex flex-col gap-[10px] rounded-[10px] border border-[#e5e5e5] bg-white p-3">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1" data-change="draw-tools">
                {/* Pen first: drawing is the default tool when a task opens */}
                <Tool icon={PenTool} label="Draw polygon" active={mode === 'draw'} onClick={() => setMode('draw')} />
                <Tool icon={MousePointer2} label="Select (Esc)" active={mode === 'select'} onClick={() => (setMode('select'), setDraft([]))} />
                <Tool
                  icon={Trash2}
                  label={selected ? 'Delete selected label' : 'Select a label to delete it'}
                  disabled={!selected}
                  onClick={() => selected && deleteLabel(selected)}
                />
              </div>
              <div className="flex-1" />
              <Tool icon={ZoomIn} label="Zoom in" disabled={zoom >= 2} onClick={() => setZoom((z) => Math.min(2, z + 0.25))} />
              <Tool icon={ZoomOut} label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - 0.25))} />
              <Tool icon={Undo2} label="Undo" disabled={!draft.length && !photo.labels.length} onClick={undo} />
              <Tool icon={Redo2} label="Redo" disabled={!redo.length} onClick={redoLast} />
            </div>

            <div
              className={cn('relative flex h-[470px] items-center justify-center overflow-hidden rounded-[4px] bg-black', mode === 'draw' && 'cursor-crosshair')}
              onClick={onCanvasClick}
              onDoubleClick={() => mode === 'draw' && draft.length >= 3 && closeShape()}
              onMouseMove={(e) => mode === 'draw' && setCursor(toPoint(e))}
              onMouseLeave={() => setCursor(null)}
            >
              {/* Hint pill on the photo, as in "UI DL · Draw · L2 L3 L4". It never blocks drawing. */}
              <div
                data-testid="draw-hint"
                data-change="draw-hint"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-[12px] whitespace-nowrap text-white backdrop-blur-sm',
                  mode === 'draw' && 'pointer-events-none',
                )}
              >
                {mode === 'draw' ? (
                  'Click on the photo to draw · Esc to stop drawing'
                ) : (
                  <span>
                    Drawing is off ·{' '}
                    <button className="font-medium underline underline-offset-2" onClick={() => setMode('draw')}>
                      Turn it back on
                    </button>
                  </span>
                )}
              </div>
              <div
                ref={photoRef}
                className="relative aspect-[458/470] h-full transition-transform"
                style={{ background: photo.tone, transform: `scale(${zoom})` }}
              >
                {/* Redacted placeholder photo, like the Figma frames */}
                {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                  <div
                    key={r}
                    className="absolute h-[3.4%] rounded-[3px]"
                    style={{ left: '4.4%', right: '4.4%', top: `${42.5 + r * 6}%`, background: photo.bars }}
                  />
                ))}
                <svg className="absolute inset-0 size-full" viewBox="0 0 1 1" preserveAspectRatio="none">
                  {photo.labels.map((l) => (
                    <polygon
                      key={l.id}
                      points={l.points.map((p) => p.join(',')).join(' ')}
                      fill={selected === l.id ? 'rgba(248,113,113,0.7)' : 'rgba(246,173,160,0.75)'}
                      stroke={selected === l.id ? '#2563eb' : '#f87171'}
                      strokeWidth={selected === l.id ? 2 : 1}
                      vectorEffect="non-scaling-stroke"
                      className={mode === 'select' ? 'cursor-pointer' : undefined}
                      onClick={(e) => {
                        if (mode !== 'select') return
                        e.stopPropagation()
                        setSelected(l.id)
                        setTab('labels')
                      }}
                    />
                  ))}
                  {draft.length > 0 && (
                    <>
                      <polyline points={draft.map((p) => p.join(',')).join(' ')} fill="none" stroke="#3b82f6" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                      {cursor && (
                        <line
                          x1={draft[draft.length - 1][0]}
                          y1={draft[draft.length - 1][1]}
                          x2={cursor[0]}
                          y2={cursor[1]}
                          stroke="#3b82f6"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}
                    </>
                  )}
                </svg>
                {/* Points as HTML so they stay round */}
                {draft.map((p, i) => (
                  <span
                    key={i}
                    className={cn('pointer-events-none absolute size-2 -translate-1/2 rounded-full border-[1.5px] border-[#3b82f6]', i === 0 ? 'size-3 bg-white' : 'bg-[#3b82f6]')}
                    style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` }}
                  />
                ))}
                {photo.labels.map((l) => {
                  const bottom = l.points.reduce((a, p) => (p[1] > a[1] ? p : a), l.points[0])
                  return (
                    <span
                      key={l.id}
                      className="absolute flex -translate-x-1/2 items-center gap-1.5 rounded-[3px] bg-[#f6c9c3] py-[3px] pr-1.5 pl-[7px] text-[11px] font-medium whitespace-nowrap text-[#4a1d1a]"
                      style={{ left: `${Math.min(85, Math.max(15, bottom[0] * 100))}%`, top: `calc(${Math.min(94, bottom[1] * 100)}% + 4px)` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {labelName(l)}
                      <button aria-label={`Delete ${labelName(l)}`} onClick={() => deleteLabel(l.id)}>
                        <X className="size-[11px]" />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Photo strip */}
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold text-[#171717]">Photos</span>
            <span className="text-[#737373]">
              {doneCount} of {photos.length} done
            </span>
          </div>
          <div className="flex flex-wrap gap-[14px] self-start" data-change="photo-strip">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => goTo(i)}
                aria-label={`Photo ${i + 1}${p.done ? ', done' : ''}`}
                className={cn('relative size-[96px] overflow-hidden rounded-[4px]', i === index && 'outline-2 outline-offset-2 outline-[#0a0a0a] outline-solid')}
                style={{ background: p.tone }}
              >
                {[0, 1, 2, 3, 4].map((r) => (
                  <span key={r} className="absolute left-[13px] h-2 w-[70px] rounded-[2px]" style={{ top: 24 + r * 13, background: p.bars }} />
                ))}
                {p.done && (
                  <>
                    <span className="absolute inset-0 bg-[rgba(74,222,128,0.6)]" />
                    <span className="absolute top-1/2 left-1/2 flex size-6 -translate-1/2 items-center justify-center rounded-full bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.18)]">
                      <Check className="size-[13px] text-[#15803d]" strokeWidth={3} />
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Label panel */}
        <div className="flex w-[380px] shrink-0 flex-col rounded-[10px] border border-[#e5e5e5] bg-white">
          <div className="flex flex-1 flex-col gap-[14px] px-[14px] pt-4 pb-4">
            {showBanner && review && (
              <ReviewBanner
                replied={!!replied}
                toName={personById(review.toId)?.name ?? ''}
                reply={replied?.text}
                onDismiss={() => dismissReviewBanner(id)}
                onOpenNotes={() => setTab('notes')}
              />
            )}
            <div className="flex flex-col gap-1 leading-normal">
              <div className="flex gap-[5px]">
                <span className="text-[13.5px] font-semibold">Image ID:</span>
                <span className="truncate text-[13px] text-[#262626]">{photo.imageId}</span>
              </div>
              <div className="flex gap-[5px]">
                <span className="text-[13.5px] font-semibold">Room Description:</span>
                <span className="text-[13px] text-[#737373]">No description provided.</span>
              </div>
            </div>

            {review && (
              <div className="flex gap-5 border-b border-[#e5e5e5]">
                <PanelTab active={tab === 'labels'} onClick={() => setTab('labels')} label="Labels" count={photo.labels.length} />
                <PanelTab active={tab === 'notes'} onClick={() => setTab('notes')} label="Notes" count={replied ? 2 : 1} />
              </div>
            )}

            {tab === 'notes' && review ? (
              <NotesThread review={review} taskId={id} />
            ) : photo.labels.length === 0 ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[12.5px] text-[#262626]">
                  <ImageOff className="size-3.5" /> No damage labeled on this photo
                </div>
                <div className="text-[12px] text-[#737373]">If you see damage, click on the photo to draw around it.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {photo.labels.map((l) => {
                  const open = selected === l.id
                  return (
                    <div key={l.id} className="flex flex-col">
                      <button
                        onClick={() => setSelected(open ? null : l.id)}
                        className="flex h-[30px] items-center justify-between rounded-[6px] bg-[#ebb4ac] px-2.5 text-[12.5px] font-medium text-[#3b1512]"
                      >
                        {labelName(l)}
                        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
                      </button>
                      {open && (
                        <div className="flex flex-col gap-3 px-1.5 pt-3 pb-1">
                          <Question label="Which surface is the damage on?">
                            <ChoiceSelect value={l.surface} options={SURFACES} onChange={(v) => updateLabel(l.id, { surface: v })} />
                          </Question>
                          <Question label="What material is the damage?">
                            <ChoiceSelect
                              value={l.material}
                              options={sortedMaterials.map((m) => m.name)}
                              onChange={(v) => updateLabel(l.id, { material: v })}
                              footer={(close) => (
                                <button
                                  data-change="manage-materials"
                                  onClick={() => {
                                    close()
                                    setMaterialsOpen(true)
                                  }}
                                  className="flex w-full items-center gap-2 rounded-[5px] px-2 py-[6px] text-left text-[12.5px] hover:bg-[#f5f5f5]"
                                >
                                  <Settings className="size-3.5" />
                                  <span className="flex-1">Manage materials</span>
                                  <span className="text-[11px] text-[#a3a3a3]">Admins</span>
                                </button>
                              )}
                            />
                          </Question>
                          <Question label="What is the type of damage?">
                            <ChoiceSelect value={l.damage} options={DAMAGE_TYPES} onChange={(v) => updateLabel(l.id, { damage: v })} />
                          </Question>
                          {review && !replied ? (
                            <div className="flex items-center gap-1.5 text-[12px] text-[#737373]">
                              <Clock className="size-3.5" /> Waiting on {personById(review.toId)?.name}'s review
                            </div>
                          ) : (
                            <button
                              data-change="send-for-review"
                              onClick={() => setReviewOpen(true)}
                              className="flex items-center gap-1.5 self-start text-[12px] text-[#525252] underline-offset-2 hover:text-[#0a0a0a] hover:underline"
                            >
                              <Send className="size-3" /> Not sure? Send for review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Panel footer, as in "UI DL · Draw · L5" */}
          <div className="flex gap-2 border-t border-[#e5e5e5] px-[14px] py-3" data-change="photo-buttons">
            <button
              onClick={nextPhoto}
              className={cn(
                'h-[34px] flex-1 rounded-[8px] px-3 text-[12.5px] font-medium',
                photo.labels.length ? 'border border-[#e5e5e5] bg-white text-[#171717] hover:bg-[#fafafa]' : 'bg-[#171717] text-white hover:bg-[#262626]',
              )}
            >
              {photo.labels.length ? 'Next photo' : 'No damage, next photo'}
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={allDone ? -1 : 0} className="flex flex-1">
                  <button
                    onClick={finish}
                    disabled={!allDone}
                    className="h-[34px] flex-1 rounded-[8px] bg-[#171717] px-3 text-[12.5px] font-medium text-white hover:bg-[#262626] disabled:pointer-events-none disabled:bg-[#e5e5e5] disabled:text-[#a3a3a3]"
                  >
                    Finish labeling
                  </button>
                </span>
              </TooltipTrigger>
              {!allDone && <TooltipContent>Label or mark all {photos.length} photos first ({photos.length - doneCount} left)</TooltipContent>}
            </Tooltip>
          </div>
        </div>
      </div>

      <SendForReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onSend={(toId, note) => {
          sendForReview(id, toId, note, index)
          setReviewOpen(false)
          showToast(`Sent to ${personById(toId)?.name} for review`)
        }}
      />
      <MaterialsDialog open={materialsOpen} onOpenChange={setMaterialsOpen} />
    </AppShell>
  )
}

function ReviewBanner({
  replied,
  toName,
  reply,
  onDismiss,
  onOpenNotes,
}: {
  replied: boolean
  toName: string
  reply?: string
  onDismiss: () => void
  onOpenNotes: () => void
}) {
  if (!replied)
    return (
      <div className="flex gap-[10px] rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-3" data-testid="review-banner">
        <Clock className="mt-px size-[15px] text-[#525252]" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold">Sent to {toName} for review</div>
          <div className="text-[12px] text-[#525252]">Their reply will show here. The task is In review until then.</div>
        </div>
      </div>
    )
  return (
    <div className="flex gap-[10px] rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] p-3" data-testid="review-banner">
      <CircleCheck className="mt-px size-[15px] text-[#15803d]" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">Reviewed by {toName}</div>
        <div className="mt-1 text-[13px] leading-[1.45] text-[#262626]">“{reply}”</div>
        <button onClick={onOpenNotes} className="mt-1 text-[12px] text-[#525252] underline-offset-2 hover:underline">
          See the full note history
        </button>
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className="self-start rounded p-0.5 text-[#525252] hover:bg-black/5">
        <X className="size-3.5" />
      </button>
    </div>
  )
}

function NotesThread({ review }: { review: NonNullable<ReturnType<typeof useStore>['reviews'][string]>; taskId: string }) {
  const from = personById(review.fromId)
  const to = personById(review.toId)
  const ago = (t: number) => {
    const m = Math.max(0, Math.round((Date.now() - t) / 60000))
    return m < 1 ? 'just now' : `${m} min ago`
  }
  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center gap-2 text-[12px] text-[#737373]">
        <Send className="size-[13px]" /> {from?.name} sent this for review to {to?.name} · {ago(review.sentAt)}
      </div>
      <Note person={from} when={ago(review.sentAt)} text={review.note} />
      {review.reply && (
        <>
          <Note person={to} when={ago(review.reply.at)} text={review.reply.text} />
          <div className="flex items-center gap-2 text-[12px] text-[#737373]">
            <CircleCheck className="size-[13px]" /> {to?.name} marked this reviewed · {ago(review.reply.at)}
          </div>
        </>
      )}
    </div>
  )
}

function Note({ person, when, text }: { person: ReturnType<typeof personById>; when: string; text: string }) {
  return (
    <div className="flex gap-[10px]">
      <Avatar person={person} />
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <div className="flex gap-1.5">
          <span className="text-[12.5px] font-semibold">{person?.name}</span>
          <span className="text-[12px] text-[#a3a3a3]">{when}</span>
        </div>
        <p className="text-[13px] leading-[1.45] text-[#262626]">{text}</p>
      </div>
    </div>
  )
}

function PanelTab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn('-mb-px flex gap-[5px] border-b-2 pb-2 text-[13px]', active ? 'border-[#0a0a0a] font-semibold' : 'border-transparent text-[#737373]')}
    >
      {label}
      <span className="text-[12px] font-normal text-[#a3a3a3]">{count}</span>
    </button>
  )
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[12.5px] text-[#262626]">{label}</div>
      {children}
    </div>
  )
}

function Tool({ icon: Icon, label, active, disabled, onClick }: { icon: LucideIcon; label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            'flex size-8 items-center justify-center rounded-[6px] disabled:text-[#d4d4d4]',
            active ? 'border border-[#d4d4d4] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.06)]' : 'hover:bg-black/5',
          )}
        >
          <Icon className="size-[15px]" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
