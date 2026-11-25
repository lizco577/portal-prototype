import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildTasks, type Organization, type Task } from '@/data/tasks'
import { buildPhotos, INITIAL_MATERIALS, REVIEW_REPLIES, type Material, type PhotoState } from '@/data/labeling'
import { currentUserId } from '@/data/people'

export type MaterialSort = 'az' | 'used' | 'custom'

/** A note on a task. A note can ask a teammate to review; their reply is a note marked as the review. */
export type TaskNote = {
  id: string
  authorId: string
  text: string
  at: number
  reviewRequestTo?: string // this note asks this person to review
  reviewReplyTo?: string // this note is the review answering that request (note id)
}

/** Where the latest review request stands, for the one-line banner. */
export type ReviewStatus = { requestId: string; reviewerId: string; reviewed: boolean } | null

type Store = {
  now: number
  tasks: Task[]
  updateTask: (id: string, patch: Partial<Task>) => void

  // Priority
  priorityOrgs: Organization[]
  toggleOrgPriority: (org: Organization) => void
  isPriority: (t: Task) => boolean
  toggleStar: (t: Task) => void

  // Damage labeling
  photosFor: (taskId: string) => PhotoState[]
  setPhotos: (taskId: string, fn: (p: PhotoState[]) => PhotoState[]) => void
  notesFor: (taskId: string) => TaskNote[]
  addNote: (taskId: string, text: string, reviewerId?: string) => void
  reviewStatus: (taskId: string) => ReviewStatus
  dismissedBanners: string[]
  dismissBanner: (requestId: string) => void

  // Materials
  materials: Material[]
  setMaterials: (fn: (m: Material[]) => Material[]) => void
  materialSort: MaterialSort
  setMaterialSort: (s: MaterialSort) => void
  sortedMaterials: Material[]

  toast: string | null
  showToast: (msg: string) => void

  // "What's changed" panel: open or collapsed, kept across pages
  changesOpen: boolean
  setChangesOpen: (open: boolean) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(start)
  const [tasks, setTasks] = useState(() => buildTasks(start))
  const [priorityOrgs, setPriorityOrgs] = useState<Organization[]>([])
  const [photos, setPhotoMap] = useState<Record<string, PhotoState[]>>({})
  const [notes, setNotes] = useState<Record<string, TaskNote[]>>({})
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([])
  const [materials, setMaterialsState] = useState<Material[]>(INITIAL_MATERIALS)
  const [materialSort, setMaterialSort] = useState<MaterialSort>('az')
  const [toast, setToast] = useState<string | null>(null)
  const [changesOpen, setChangesOpen] = useState(true)
  const toastTimer = useRef<number | undefined>(undefined)

  // Keep SLA countdowns live.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }, [])

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    [],
  )

  const isPriority = useCallback((t: Task) => t.star ?? priorityOrgs.includes(t.org), [priorityOrgs])

  const addNote = useCallback(
    (taskId: string, text: string, reviewerId?: string) => {
      const note: TaskNote = { id: `n${Date.now()}`, authorId: currentUserId, text, at: Date.now(), reviewRequestTo: reviewerId }
      setNotes((n) => ({ ...n, [taskId]: [...(n[taskId] ?? []), note] }))
      if (!reviewerId) return
      updateTask(taskId, { status: 'In review', assigneeId: reviewerId, sentById: currentUserId })
      // Prototype only: the teammate replies a few seconds later so the reviewed state can be seen.
      window.setTimeout(() => {
        setNotes((n) => {
          const list = n[taskId] ?? []
          const replyText = REVIEW_REPLIES[list.filter((x) => x.reviewReplyTo).length % REVIEW_REPLIES.length]
          const reply: TaskNote = { id: `n${Date.now()}`, authorId: reviewerId, text: replyText, at: Date.now(), reviewReplyTo: note.id }
          return { ...n, [taskId]: [...list, reply] }
        })
        updateTask(taskId, { status: 'In Progress', assigneeId: currentUserId, sentById: null })
      }, 6000)
    },
    [updateTask],
  )

  const reviewStatus = useCallback(
    (taskId: string): ReviewStatus => {
      const list = notes[taskId] ?? []
      const request = [...list].reverse().find((x) => x.reviewRequestTo)
      if (!request) return null
      return { requestId: request.id, reviewerId: request.reviewRequestTo!, reviewed: list.some((x) => x.reviewReplyTo === request.id) }
    },
    [notes],
  )

  const sortedMaterials = useMemo(() => {
    if (materialSort === 'az') return [...materials].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    if (materialSort === 'used') return [...materials].sort((a, b) => b.usage - a.usage)
    return materials // custom: array order is the order
  }, [materials, materialSort])

  const value = useMemo<Store>(
    () => ({
      now,
      tasks,
      updateTask,
      priorityOrgs,
      toggleOrgPriority: (org) => setPriorityOrgs((o) => (o.includes(org) ? o.filter((x) => x !== org) : [...o, org])),
      isPriority,
      toggleStar: (t) => updateTask(t.id, { star: !isPriority(t) }),
      photosFor: (taskId) => photos[taskId] ?? buildPhotos(taskId),
      setPhotos: (taskId, fn) => setPhotoMap((m) => ({ ...m, [taskId]: fn(m[taskId] ?? buildPhotos(taskId)) })),
      notesFor: (taskId) => notes[taskId] ?? [],
      addNote,
      reviewStatus,
      dismissedBanners,
      dismissBanner: (requestId) => setDismissedBanners((d) => [...d, requestId]),
      materials,
      setMaterials: setMaterialsState,
      materialSort,
      setMaterialSort,
      sortedMaterials,
      toast,
      showToast,
      changesOpen,
      setChangesOpen,
    }),
    [now, tasks, updateTask, priorityOrgs, isPriority, photos, notes, addNote, reviewStatus, dismissedBanners, materials, materialSort, sortedMaterials, toast, showToast, changesOpen],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
