import { HashRouter, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { StoreProvider } from '@/lib/store'
import DamageLabeling from '@/pages/DamageLabeling'
import ImageQA from '@/pages/ImageQA'
import TaskQueue from '@/pages/TaskQueue'

export default function App() {
  return (
    <StoreProvider>
      <TooltipProvider delayDuration={150}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<TaskQueue />} />
            <Route path="/tasks/:id/draw" element={<DamageLabeling />} />
            <Route path="/tasks/:id/image-qa" element={<ImageQA />} />
            <Route path="*" element={<TaskQueue />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </StoreProvider>
  )
}
