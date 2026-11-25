import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { StoreProvider } from '@/lib/store'
import { ClaimDetail, ClaimsList } from '@/pages/Claims'
import DamageLabeling from '@/pages/DamageLabeling'
import FinalQA from '@/pages/FinalQA'
import ImageQA from '@/pages/ImageQA'
import Modeling from '@/pages/Modeling'
import Pipeline from '@/pages/Pipeline'
import { RuleEditor, RuleSetDetail, RuleSetList } from '@/pages/RuleSets'
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
            <Route path="/tasks/:id/final-qa" element={<FinalQA />} />
            <Route path="/tasks/:id/modeling" element={<Modeling />} />
            <Route path="/claims" element={<ClaimsList key="admin" base="/claims" />} />
            <Route path="/claims/:claimId" element={<ClaimDetail base="/claims" />} />
            <Route path="/org/claims" element={<ClaimsList key="org" base="/org/claims" />} />
            <Route path="/org/claims/:claimId" element={<ClaimDetail base="/org/claims" />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/rule-sets" element={<RuleSetList />} />
            <Route path="/rule-sets/:rulesetId" element={<RuleSetDetail />} />
            <Route path="/rule-sets/:rulesetId/rules/:ruleId" element={<RuleEditor />} />
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
