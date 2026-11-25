export type Person = {
  id: string
  name: string // full name, shown on hover
  short: string // "E. Cohen"
  email: string
  color: string // avatar background
  text: string // avatar text colour
  onShift: boolean
}

export const people: Person[] = [
  { id: 'ecohen', name: 'Eli Cohen', short: 'E. Cohen', email: 'ecohen@hosta.ai', color: '#e0e7ff', text: '#4338ca', onShift: true },
  { id: 'aatencio', name: 'Ana Atencio', short: 'A. Atencio', email: 'aatencio@hostalabs.com', color: '#ffedd5', text: '#c2410c', onShift: true },
  { id: 'jaguda', name: 'Jermaine Aguda', short: 'J. Aguda', email: 'jaguda@hostalabs.com', color: '#dbeafe', text: '#1d4ed8', onShift: true },
  { id: 'jcampos', name: 'Julia Campos', short: 'J. Campos', email: 'jcampos@hostalabs.com', color: '#dcfce7', text: '#15803d', onShift: true },
  { id: 'rpatel', name: 'Ryan Patel', short: 'R. Patel', email: 'rpatel@hostalabs.com', color: '#fae8ff', text: '#a21caf', onShift: false },
  { id: 'lmoreno', name: 'Lucia Moreno', short: 'L. Moreno', email: 'lmoreno@hostalabs.com', color: '#fef9c3', text: '#a16207', onShift: true },
  { id: 'bnguyen', name: 'Brad Nguyen', short: 'B. Nguyen', email: 'bnguyen@hostalabs.com', color: '#ccfbf1', text: '#0f766e', onShift: false },
]

// Signed in as Ana Atencio, so E. Cohen can ask you for a review in the prototype.
export const currentUserId = 'aatencio'

export const personById = (id: string | null | undefined) =>
  id ? people.find((p) => p.id === id) ?? null : null

export const initials = (p: Person) =>
  p.name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
