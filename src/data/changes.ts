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
    detail: 'Each card shows a live count and filters the list when clicked. Total Tasks card removed. Clicking Tasks Queue in the nav clears all filters.',
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
    detail: 'Star a single task to mark it priority: the star turns black and the task moves to the top of the list. Click the star in the table header to mark whole customers as priority. Filterable from the Filters menu.',
    target: 'priority-settings',
    opens: 'click',
  },
  {
    id: 'd7',
    code: 'D7',
    title: 'Claimed by and Assigned to',
    kind: 'Changed',
    detail: 'Two columns: Claimed by shows who picked the task up. Assigned to shows coloured initials, with the full name on hover. Both can be filtered.',
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
    detail: 'Drawing stays on after each shape until Esc. The hint sits on the photo.',
    target: 'draw-hint',
  },
  {
    id: 'l7',
    code: 'L7',
    title: 'Magic wand removed',
    kind: 'Changed',
    detail: 'The magic wand is gone from the toolbar. The pen is the first tool and is on by default.',
    target: 'draw-tools',
  },
  {
    id: 'l5-finish',
    code: 'L5',
    title: 'Finish labeling',
    kind: 'Changed',
    detail: '"Complete" renamed to "Finish labeling", next to one "No damage, next photo" button that reads "Next photo" once the photo has labels. The bar stays fixed and the same under both tabs.',
    target: 'photo-buttons',
  },
  {
    id: 'l6',
    code: 'L6',
    title: 'Review',
    kind: 'New',
    detail: 'A Review tab next to Labels replaces the Send for review modal. Pick a teammate, then ask your question: sending it asks them and puts the task in their My Tasks. Replies are a comment thread; a reply can be resolved. A number on Review counts new comments since you last looked. Use Review state above to see each state.',
    target: 'review-tab',
    opens: 'click',
  },
  {
    id: 'l1',
    code: 'L1',
    title: 'Materials',
    kind: 'Changed',
    detail: 'Materials open in a modal. One box searches and adds: type a new name and press Enter to create it. Rename, delete, and sort A to Z, Most used or by drag.',
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
