import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
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
            <Route path="/" element={<FreshTaskQueue />} />
            <Route path="/tasks/:id/draw" element={<DamageLabeling />} />
            <Route path="/tasks/:id/image-qa" element={<ImageQA />} />
            <Route path="*" element={<FreshTaskQueue />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </StoreProvider>
  )
}

/**
 * Every click on "Tasks Queue" (or the Tasks breadcrumb) is a new navigation with its own key,
 * so the list starts fresh: filters, search, card selection and page all reset.
 */
function FreshTaskQueue() {
  const location = useLocation()
  return <TaskQueue key={location.key} />
}
