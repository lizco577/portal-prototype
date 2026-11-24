import { HashRouter, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { StoreProvider } from '@/lib/store'
import TaskQueue from '@/pages/TaskQueue'

export default function App() {
  return (
    <StoreProvider>
      <TooltipProvider delayDuration={150}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<TaskQueue />} />
            <Route path="*" element={<TaskQueue />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </StoreProvider>
  )
}
