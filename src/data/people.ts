export type Person = {
  id: string
  name: string // full name, shown on hover
  short: string // "E. Cohen"
  email: string
  color: string // avatar background
  text: string // avatar text colour
}

export const people: Person[] = [
  { id: 'ecohen', name: 'Eli Cohen', short: 'E. Cohen', email: 'ecohen@hosta.ai', color: '#e0e7ff', text: '#4338ca' },
  { id: 'aatencio', name: 'Ana Atencio', short: 'A. Atencio', email: 'aatencio@hostalabs.com', color: '#ffedd5', text: '#c2410c' },
  { id: 'jaguda', name: 'Jermaine Aguda', short: 'J. Aguda', email: 'jaguda@hostalabs.com', color: '#dbeafe', text: '#1d4ed8' },
  { id: 'jcampos', name: 'Julia Campos', short: 'J. Campos', email: 'jcampos@hostalabs.com', color: '#dcfce7', text: '#15803d' },
  { id: 'rpatel', name: 'Ryan Patel', short: 'R. Patel', email: 'rpatel@hostalabs.com', color: '#fae8ff', text: '#a21caf' },
  { id: 'lmoreno', name: 'Lucia Moreno', short: 'L. Moreno', email: 'lmoreno@hostalabs.com', color: '#fef9c3', text: '#a16207' },
  { id: 'bnguyen', name: 'Brad Nguyen', short: 'B. Nguyen', email: 'bnguyen@hostalabs.com', color: '#ccfbf1', text: '#0f766e' },
]

export const currentUserId = 'ecohen'

export const personById = (id: string | null | undefined) =>
  id ? people.find((p) => p.id === id) ?? null : null

export const initials = (p: Person) =>
  p.name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
