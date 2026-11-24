// Rows for the "What's changed" panel: what's new or different from the current portal, per page.
// `target` matches a data-change="…" attribute on the page element that gets outlined.

export type Change = {
  id: string
  code: string // PRD number
  title: string
  kind: 'New' | 'Changed'
  detail: string
  target: string
  /**
   * What clicking the row opens: 'click' presses the outlined element (a menu or panel button);
   * any other value asks the page to open that modal (e.g. 'materials').
   */
  opens?: string
}

export const TASK_LIST_CHANGES: Change[] = [
  {
    id: 'd6',
    code: 'D6',
    title: 'SLA warnings',
    kind: 'Changed',
    detail: 'SLA is now the first column. Overdue dark red, under 1 hour light red, everything else grey.',
    target: 'sla-header',
  },
  {
    id: 'd1-5',
    code: 'D1–D5',
    title: 'Summary cards',
    kind: 'Changed',
    detail: 'Each card shows a live count and filters the list when clicked. Total Tasks card removed.',
    target: 'summary-cards',
  },
  {
    id: 'd2',
    code: 'D2',
    title: 'Task type counts',
    kind: 'Changed',
    detail: 'Counts per task type live in this dropdown instead of a Total Tasks card.',
    target: 'type-dropdown',
    opens: 'click',
  },
  {
    id: 'd11-star',
    code: 'D11',
    title: 'Priority star',
    kind: 'New',
    detail: 'Star a single task to mark it priority. Filterable.',
    target: 'star-header',
  },
  {
    id: 'd11-settings',
    code: 'D11',
    title: 'Priority settings',
    kind: 'New',
    detail: 'Leads mark a whole customer as priority. All its tasks get a star.',
    target: 'priority-settings',
    opens: 'click',
  },
  {
    id: 'd7',
    code: 'D7',
    title: 'Assigned to',
    kind: 'Changed',
    detail: 'Claimed by and Assigned to merged. Initials, full name on hover.',
    target: 'assignee-header',
  },
  {
    id: 'd8',
    code: 'D8',
    title: 'Claim button',
    kind: 'Changed',
    detail: 'Lock icon replaced with a clear Claim button, only on unclaimed tasks.',
    target: 'claim-button',
  },
]

export const DAMAGE_LABELING_CHANGES: Change[] = [
  {
    id: 'l3',
    code: 'L3',
    title: 'Persistent draw',
    kind: 'Changed',
    detail: 'Drawing stays on after each shape until Esc.',
    target: 'draw-hint',
  },
  {
    id: 'l5-finish',
    code: 'L5',
    title: 'Finish labeling',
    kind: 'Changed',
    detail: '"Complete" renamed to "Finish labeling", plus a "No damage, next photo" button.',
    target: 'photo-buttons',
  },
  {
    id: 'l5-photos',
    code: 'L5',
    title: 'Finished photos',
    kind: 'New',
    detail: 'Done photos show a green check in the photo strip.',
    target: 'photo-strip',
  },
  {
    id: 'l6',
    code: 'L6',
    title: 'Send for review',
    kind: 'New',
    detail: 'Send the task to a teammate with a note. Their reply shows at the top of the labels panel.',
    target: 'send-for-review',
    opens: 'send-for-review',
  },
  {
    id: 'l1',
    code: 'L1',
    title: 'Materials',
    kind: 'Changed',
    detail: 'Materials open in a modal where you can add, rename, delete, search and sort them.',
    target: 'manage-materials',
    opens: 'materials',
  },
]

export const IMAGE_QA_CHANGES: Change[] = [
  {
    id: 'q1',
    code: 'Q1',
    title: 'Auto-pass',
    kind: 'New',
    detail: 'Photos passed by automation show an icon. Confidence shows on hover.',
    target: 'auto-pass',
  },
]
