import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildTasks, type Task } from '@/data/tasks'

type Store = {
  now: number
  tasks: Task[]
  updateTask: (id: string, patch: Partial<Task>) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(start)
  const [tasks, setTasks] = useState(() => buildTasks(start))

  // Keep SLA countdowns live.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const value = useMemo<Store>(
    () => ({
      now,
      tasks,
      updateTask: (id, patch) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    }),
    [now, tasks],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
