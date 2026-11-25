import { currentUserId } from '@/data/people'
import type { Task } from '@/data/tasks'

/** An image on a comment: an uploaded file (src) or a placeholder photo like the ones in the strip. */
export type Attachment = { id: string; name: string; src?: string; tone?: string; bars?: string }

export type ReviewItem =
  | { kind: 'asked'; id: string; at: number; byId: string; toId: string }
  | { kind: 'removed'; id: string; at: number; byId: string; toId: string }
  | { kind: 'comment'; id: string; at: number; authorId: string; text: string; images: Attachment[]; resolved?: boolean }

/**
 * One reviewer per task for now. reviewerId with no askedAt is a pick that hasn't been sent yet:
 * the first message after picking is what sends the request.
 */
export type Review = {
  reviewerId: string | null
  askedById: string | null
  askedAt: number | null
  items: ReviewItem[]
  /** something new for me on the Review tab (blue dot) */
  unread: boolean
}

export type ReviewStage = 1 | 2 | 3 | 4
export const STAGE_LABELS: Record<ReviewStage, string> = {
  1: 'No request',
  2: 'You asked',
  3: "You're reviewing",
  4: 'Reply received',
}

export const EMPTY_REVIEW: Review = { reviewerId: null, askedById: null, askedAt: null, items: [], unread: false }

export function reviewStage(r: Review): ReviewStage {
  if (r.reviewerId === currentUserId && r.askedById && r.askedById !== currentUserId) return 3
  if (r.reviewerId && r.askedAt != null) {
    const replied = r.items.some((i) => i.kind === 'comment' && i.authorId === r.reviewerId && i.at >= r.askedAt!)
    return replied ? 4 : 2
  }
  return 1
}

/** When the reviewer last replied, for "Replied 1m ago". */
export const lastReplyAt = (r: Review) =>
  Math.max(0, ...r.items.filter((i) => i.kind === 'comment' && i.authorId === r.reviewerId).map((i) => i.at))

const QUESTION_PHOTO: Attachment = { id: 'a-ceiling', name: 'ceiling.jpg', tone: '#51473f', bars: '#8a7d70' }

/** The canned data for each state, plus where the task sits in the queue in that state. */
export function cannedReview(stage: ReviewStage, now: number): { review: Review; task: Partial<Task> } {
  const m = (mins: number) => now - mins * 60000
  const me = currentUserId
  switch (stage) {
    case 1:
      return {
        review: EMPTY_REVIEW,
        task: { status: 'In Progress', assigneeId: me, sentById: null, claimedById: me },
      }
    case 2:
      return {
        review: {
          reviewerId: 'jaguda',
          askedById: me,
          askedAt: m(5),
          unread: false,
          items: [
            { kind: 'asked', id: 'e1', at: m(5), byId: me, toId: 'jaguda' },
            { kind: 'comment', id: 'c1', at: m(5), authorId: me, text: 'Is this ceiling tile or drywall? Hard to tell in this light.', images: [] },
          ],
        },
        task: { status: 'In review', assigneeId: 'jaguda', sentById: me, claimedById: me },
      }
    case 3:
      return {
        review: {
          reviewerId: me,
          askedById: 'ecohen',
          askedAt: m(5),
          unread: true,
          items: [
            { kind: 'asked', id: 'e1', at: m(5), byId: 'ecohen', toId: me },
            { kind: 'comment', id: 'c1', at: m(5), authorId: 'ecohen', text: 'Is this ceiling tile or drywall?', images: [QUESTION_PHOTO] },
          ],
        },
        task: { status: 'In review', assigneeId: me, sentById: 'ecohen', claimedById: 'ecohen' },
      }
    case 4:
      return {
        review: {
          reviewerId: 'jaguda',
          askedById: me,
          askedAt: m(6),
          unread: true,
          items: [
            { kind: 'asked', id: 'e1', at: m(6), byId: me, toId: 'jaguda' },
            { kind: 'comment', id: 'c1', at: m(6), authorId: me, text: 'Is this ceiling tile or drywall? Hard to tell in this light.', images: [] },
            { kind: 'comment', id: 'c2', at: m(1), authorId: 'jaguda', text: 'Drywall. You can see the tape seams.', images: [] },
          ],
        },
        task: { status: 'In Progress', assigneeId: me, sentById: null, claimedById: me },
      }
  }
}

/** Seeded damage labeling tasks that open in each state (seed index in tasks.ts → state). */
export const SEEDED_STAGES: [number, ReviewStage][] = [
  [0, 1],
  [13, 2],
  [6, 3],
  [17, 4],
]

export function buildReviews(tasks: Task[], now: number): Record<string, Review> {
  const out: Record<string, Review> = {}
  for (const [i, stage] of SEEDED_STAGES) if (tasks[i]) out[tasks[i].id] = cannedReview(stage, now).review
  return out
}
