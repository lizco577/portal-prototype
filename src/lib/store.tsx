import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildTasks, type Organization, type Task } from '@/data/tasks'
import { buildPhotos, INITIAL_MATERIALS, REVIEW_REPLIES, type Material, type PhotoState } from '@/data/labeling'
import { currentUserId } from '@/data/people'

export type MaterialSort = 'az' | 'used' | 'custom'

export type Review = {
  fromId: string
  toId: string
  note: string
  photoIndex: number
  sentAt: number
  reply: { text: string; at: number } | null
  bannerDismissed: boolean
}

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
  reviews: Record<string, Review>
  sendForReview: (taskId: string, toId: string, note: string, photoIndex: number) => void
  dismissReviewBanner: (taskId: string) => void

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
  const [reviews, setReviews] = useState<Record<string, Review>>({})
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

  const sendForReview = useCallback(
    (taskId: string, toId: string, note: string, photoIndex: number) => {
      setReviews((r) => ({
        ...r,
        [taskId]: { fromId: currentUserId, toId, note, photoIndex, sentAt: Date.now(), reply: null, bannerDismissed: false },
      }))
      updateTask(taskId, { status: 'In review', assigneeId: toId, sentById: currentUserId })
      // Prototype only: the teammate "replies" a few seconds later so the reply banner can be seen.
      window.setTimeout(() => {
        setReviews((r) => {
          const cur = r[taskId]
          if (!cur || cur.reply) return r
          return { ...r, [taskId]: { ...cur, reply: { text: REVIEW_REPLIES[photoIndex % REVIEW_REPLIES.length], at: Date.now() } } }
        })
        updateTask(taskId, { status: 'In Progress', assigneeId: currentUserId, sentById: null })
      }, 6000)
    },
    [updateTask],
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
      reviews,
      sendForReview,
      dismissReviewBanner: (taskId) => setReviews((r) => (r[taskId] ? { ...r, [taskId]: { ...r[taskId], bannerDismissed: true } } : r)),
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
    [now, tasks, updateTask, priorityOrgs, isPriority, photos, reviews, sendForReview, materials, materialSort, sortedMaterials, toast, showToast, changesOpen],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
