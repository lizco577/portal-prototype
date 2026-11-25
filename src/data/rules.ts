// Rules: used by Final QA (adding line items, F2) and the Rule Sets page (R1).
// Category and rule names come from the "Rules Editor" Figma page.

export const RULE_CATEGORIES = ['Floor', 'Wall', 'Ceiling', 'Object', 'Room Prep', 'Room Specific'] as const
export type RuleCategory = (typeof RULE_CATEGORIES)[number]

export type Rule = {
  id: string
  category: RuleCategory
  name: string
  /** how many times specialists added it as a line item in the last 30 days (F2 "Most used") */
  usage: number
}

const R = (category: RuleCategory, name: string, usage: number): Rule => ({
  id: `${category}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  category,
  name,
  usage,
})

export const RULES: Rule[] = [
  R('Floor', 'Bathroom Floor Replacement', 42),
  R('Floor', 'Bathroom Wood Floor Replacement', 9),
  R('Floor', 'Carpet Repair/Replacement', 131),
  R('Floor', 'Carpet Cleaning Only', 64),
  R('Floor', 'Stained Concrete', 4),
  R('Floor', 'Painted Concrete Floor', 7),
  R('Floor', 'Concrete Floor - Cleaning Only', 18),
  R('Floor', 'Tile Floor - Paint Grade Baseboard', 23),
  R('Wall', 'Drywall Patch', 156),
  R('Wall', 'Drywall Replacement - Full Wall', 88),
  R('Wall', 'Paint Walls - Two Coats', 172),
  R('Wall', 'Wood Paneling Replacement', 11),
  R('Wall', 'Wallpaper Removal', 6),
  R('Ceiling', 'Ceiling Drywall Patch', 97),
  R('Ceiling', 'Acoustic Ceiling Tile Replacement', 21),
  R('Ceiling', 'Paint Ceiling', 119),
  R('Ceiling', 'Popcorn Ceiling Removal', 8),
  R('Object', 'Detach and Reset Toilet', 37),
  R('Object', 'Vanity Replacement', 15),
  R('Object', 'Interior Door Replacement', 29),
  R('Room Prep', 'Content Manipulation - Average Room', 104),
  R('Room Prep', 'Floor Protection', 58),
  R('Room Specific', 'Kitchen Cabinet Toe Kick', 12),
  R('Room Specific', 'Closet Shelving Replacement', 5),
]

export type RuleSort = 'az' | 'used'
export const sortRules = (rules: Rule[], sort: RuleSort) =>
  [...rules].sort((a, b) => (sort === 'az' ? a.name.localeCompare(b.name) : b.usage - a.usage))

// Rule Sets page: one ruleset per carrier, as in "Select Ruleset".
export type RulesetStatus = 'Live' | 'Draft' | 'Unpublished Changes'
export type Ruleset = { id: string; name: string; status: RulesetStatus; ruleIds: string[] }

const all = RULES.map((r) => r.id)
export const RULESETS: Ruleset[] = [
  { id: 'american-family', name: 'American Family', status: 'Live', ruleIds: all },
  { id: 'cincinnati-financial', name: 'Cincinnati Financial', status: 'Live', ruleIds: all.filter((_, i) => i % 4 !== 3) },
  { id: 'farmers', name: 'Farmer’s Insurance', status: 'Unpublished Changes', ruleIds: all.filter((_, i) => i % 3 !== 2) },
  { id: 'slide', name: 'Slide', status: 'Live', ruleIds: all.filter((_, i) => i % 2 === 0) },
  // USAA is the empty ruleset from the "Empty Ruleset" frames
  { id: 'usaa', name: 'USAA', status: 'Draft', ruleIds: [] },
]

/** The line items a rule adds, for the rule editor. */
export type LineItem = { id: string; sortKey: string; code: string; description: string }
export const lineItemsFor = (rule: Rule): { restoration: LineItem[]; mitigation: LineItem[] } => ({
  restoration: [
    { id: `${rule.id}-r1`, sortKey: '1.3', code: `${rule.category.slice(0, 3).toUpperCase()} R&R`, description: `Remove and replace for ${rule.name.toLowerCase()}.` },
    { id: `${rule.id}-r2`, sortKey: '1.4', code: 'CLN', description: '' },
  ],
  mitigation: [{ id: `${rule.id}-m1`, sortKey: '1.3', code: 'WTR DRY', description: '' }],
})
