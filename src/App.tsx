import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CleanroomLayout } from './components/CleanroomLayout';
import { useNousgentMission } from './hooks/useNousgentMission';
import { OverviewPage } from './pages/OverviewPage';
import { PodBayArenaPage } from './pages/PodBayArenaPage';
import { EnlistNodePage } from './pages/EnlistNodePage';
import { MissionsQuorumPage } from './pages/MissionsQuorumPage';
import { ObservatoryBisectPage } from './pages/ObservatoryBisectPage';
import { DossierAndDocsPage } from './pages/DossierAndDocsPage';

export function App() {
  const { snapshot, hostPlane, setHostPlane, refreshStatus } = useNousgentMission();

  return (
    <BrowserRouter>
      <CleanroomLayout snapshot={snapshot} hostPlane={hostPlane} onTogglePlane={setHostPlane}>
        <Routes>
          <Route path="/" element={<OverviewPage snapshot={snapshot} onRefresh={() => void refreshStatus()} />} />
          <Route path="/pod-bay" element={<PodBayArenaPage onDeflectionRecorded={() => void refreshStatus()} />} />
          <Route path="/enlist" element={<EnlistNodePage snapshot={snapshot} onEnlisted={() => void refreshStatus()} />} />
          <Route path="/missions" element={<MissionsQuorumPage snapshot={snapshot} onRefresh={() => void refreshStatus()} />} />
          <Route path="/observatory" element={<ObservatoryBisectPage snapshot={snapshot} />} />
          <Route path="/ranks" element={<DossierAndDocsPage snapshot={snapshot} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CleanroomLayout>
    </BrowserRouter>
  );
}
