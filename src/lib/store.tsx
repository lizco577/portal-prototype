import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildTasks, imageQaFor, type Organization, type Task } from '@/data/tasks'
import { buildPhotos, INITIAL_MATERIALS, type Material, type PhotoState } from '@/data/labeling'
import { buildReviews, cannedReview, EMPTY_REVIEW, reviewStage, type Attachment, type Review, type ReviewStage } from '@/data/reviews'
import { currentUserId } from '@/data/people'
import { RULES, RULESETS, type Rule, type Ruleset } from '@/data/rules'

export type MaterialSort = 'az' | 'used' | 'custom'

type Store = {
  now: number
  tasks: Task[]
  updateTask: (id: string, patch: Partial<Task>) => void
  /** Claim a task for the signed-in user. M2: claiming a Modelling task also claims its room's Image QA. */
  claimTask: (id: string) => { alsoClaimed: Task | null }

  // Priority
  priorityOrgs: Organization[]
  toggleOrgPriority: (org: Organization) => void
  isPriority: (t: Task) => boolean
  toggleStar: (t: Task) => void

  // Damage labeling
  photosFor: (taskId: string) => PhotoState[]
  setPhotos: (taskId: string, fn: (p: PhotoState[]) => PhotoState[]) => void
  reviewFor: (taskId: string) => Review
  setReviewer: (taskId: string, personId: string | null) => void
  sendReviewComment: (taskId: string, text: string, images: Attachment[]) => void
  toggleResolved: (taskId: string, commentId: string) => void
  markReviewRead: (taskId: string) => void
  /** Prototype only: jump a task to one of the four review states */
  setReviewStage: (taskId: string, stage: ReviewStage) => void

  // Materials
  materials: Material[]
  setMaterials: (fn: (m: Material[]) => Material[]) => void
  materialSort: MaterialSort
  setMaterialSort: (s: MaterialSort) => void
  sortedMaterials: Material[]

  // Rule Sets
  rulesets: Ruleset[]
  setRulesets: (fn: (r: Ruleset[]) => Ruleset[]) => void
  rules: Rule[]
  addRule: (rule: Rule) => void

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
  const [reviews, setReviews] = useState<Record<string, Review>>(() => buildReviews(tasks, start))
  const [materials, setMaterialsState] = useState<Material[]>(INITIAL_MATERIALS)
  const [materialSort, setMaterialSort] = useState<MaterialSort>('az')
  const [rulesets, setRulesetsState] = useState<Ruleset[]>(RULESETS)
  const [rules, setRules] = useState<Rule[]>(RULES)
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

  const claimTask = useCallback(
    (id: string) => {
      const t = tasks.find((x) => x.id === id)
      if (!t) return { alsoClaimed: null }
      const iqa = t.type === 'Modelling' ? imageQaFor(tasks, t) : null
      const also = iqa && iqa.status !== 'Done' ? iqa : null
      const claim = (x: Task): Task => ({
        ...x,
        claimedById: currentUserId,
        assigneeId: currentUserId,
        status: x.status === 'Not started' ? 'In Progress' : x.status,
      })
      setTasks((ts) => ts.map((x) => (x.id === id || x.id === also?.id ? claim(x) : x)))
      return { alsoClaimed: also }
    },
    [tasks],
  )

  const isPriority = useCallback((t: Task) => t.star ?? priorityOrgs.includes(t.org), [priorityOrgs])

  const patchReview = useCallback(
    (taskId: string, fn: (r: Review) => Review) => setReviews((m) => ({ ...m, [taskId]: fn(m[taskId] ?? EMPTY_REVIEW) })),
    [],
  )
  const uid = () => `r${Date.now()}${Math.random().toString(36).slice(2, 6)}`

  // Picking someone before anything is sent only sets them. Once a request is out, a new pick asks the
  // new person, and removing them takes the task back.
  const setReviewer = useCallback(
    (taskId: string, personId: string | null) => {
      const r = reviews[taskId] ?? EMPTY_REVIEW
      const at = Date.now()
      if (r.askedAt == null || r.askedById !== currentUserId) {
        patchReview(taskId, (x) => ({ ...x, reviewerId: personId }))
        return
      }
      if (personId === r.reviewerId) return
      if (!personId) {
        patchReview(taskId, (x) => ({
          ...x,
          reviewerId: null,
          askedById: null,
          askedAt: null,
          items: [...x.items, { kind: 'removed', id: uid(), at, byId: currentUserId, toId: r.reviewerId! }],
        }))
        updateTask(taskId, { status: 'In Progress', assigneeId: currentUserId, sentById: null })
        return
      }
      patchReview(taskId, (x) => ({
        ...x,
        reviewerId: personId,
        askedAt: at,
        items: [...x.items, { kind: 'asked', id: uid(), at, byId: currentUserId, toId: personId }],
      }))
      updateTask(taskId, { status: 'In review', assigneeId: personId, sentById: currentUserId })
    },
    [reviews, patchReview, updateTask],
  )

  const sendReviewComment = useCallback(
    (taskId: string, text: string, images: Attachment[]) => {
      const r = reviews[taskId] ?? EMPTY_REVIEW
      const at = Date.now()
      const comment = { kind: 'comment' as const, id: uid(), at, authorId: currentUserId, text, images }
      const stage = reviewStage(r)
      if (stage === 1 && r.reviewerId) {
        // The first message after picking a reviewer is what sends the request.
        patchReview(taskId, (x) => ({
          ...x,
          askedById: currentUserId,
          askedAt: at,
          unread: false,
          items: [...x.items, { kind: 'asked', id: uid(), at, byId: currentUserId, toId: r.reviewerId! }, comment],
        }))
        updateTask(taskId, { status: 'In review', assigneeId: r.reviewerId, sentById: currentUserId })
        return
      }
      patchReview(taskId, (x) => ({ ...x, unread: false, items: [...x.items, comment] }))
      // The reviewer answering hands the task back to whoever asked.
      if (stage === 3 && r.askedById) updateTask(taskId, { status: 'In Progress', assigneeId: r.askedById, sentById: null })
    },
    [reviews, patchReview, updateTask],
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
      claimTask,
      priorityOrgs,
      toggleOrgPriority: (org) => setPriorityOrgs((o) => (o.includes(org) ? o.filter((x) => x !== org) : [...o, org])),
      isPriority,
      toggleStar: (t) => updateTask(t.id, { star: !isPriority(t) }),
      photosFor: (taskId) => photos[taskId] ?? buildPhotos(taskId),
      setPhotos: (taskId, fn) => setPhotoMap((m) => ({ ...m, [taskId]: fn(m[taskId] ?? buildPhotos(taskId)) })),
      reviewFor: (taskId) => reviews[taskId] ?? EMPTY_REVIEW,
      setReviewer,
      sendReviewComment,
      toggleResolved: (taskId, commentId) =>
        patchReview(taskId, (x) => ({
          ...x,
          items: x.items.map((i) => (i.kind === 'comment' && i.id === commentId ? { ...i, resolved: !i.resolved } : i)),
        })),
      markReviewRead: (taskId) => {
        if (reviews[taskId]?.unread) patchReview(taskId, (x) => ({ ...x, unread: false }))
      },
      setReviewStage: (taskId, stage) => {
        const { review, task } = cannedReview(stage, Date.now())
        setReviews((m) => ({ ...m, [taskId]: review }))
        updateTask(taskId, task)
      },
      materials,
      setMaterials: setMaterialsState,
      materialSort,
      setMaterialSort,
      sortedMaterials,
      rulesets,
      setRulesets: setRulesetsState,
      rules,
      addRule: (rule) => setRules((rs) => (rs.some((r) => r.id === rule.id) ? rs : [...rs, rule])),
      toast,
      showToast,
      changesOpen,
      setChangesOpen,
    }),
    [now, tasks, updateTask, claimTask, priorityOrgs, isPriority, photos, reviews, patchReview, setReviewer, sendReviewComment, materials, materialSort, sortedMaterials, rulesets, rules, toast, showToast, changesOpen],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
