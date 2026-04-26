import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { GroupDashboardView } from './views/GroupDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { GroupEventListView } from './views/GroupEventListView';
import { ParticipantDashboardView } from './views/ParticipantDashboardView';
import { MemberManagementView } from './views/MemberManagementView';
import { EventEditView } from './views/EventEditView';
import { BroadcastView } from './views/BroadcastView';
import { ParticipantView } from './views/ParticipantView';
import { TutorialListView } from './views/TutorialListView';
import { BackgroundGrid } from './components/BackgroundGrid';
import { SettingsPanel } from './components/SettingsPanel';

const App: React.FC = () => {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const configRes = await fetch('/api/config');
        const firebaseConfig = await configRes.json();
        // @ts-ignore
        if (!window.firebase.apps.length) {
          // @ts-ignore
          window.firebase.initializeApp(firebaseConfig);
        }
        // @ts-ignore
        window.firebase.auth().signInAnonymously().catch(console.error);

        const emojiRes = await fetch('/api/emoji-map');
        // @ts-ignore
        window.emojiMapData = await emojiRes.json();

        setIsFirebaseReady(true);
      } catch (e) {
        console.error('Failed to load initial config:', e);
      }
    };
    initApp();
  }, []);

  if (!isFirebaseReady) {
    return (
      <div id="globalLoadingMask" className="loading-mask" style={{position: 'fixed', display: 'flex', zIndex: '9999', width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)'}}>
        <p>Firebase 初期化中...</p>
      </div>
    );
  }

  return (
    <>
      
  <div id="globalLoadingMask" className="loading-mask" style={{position: 'fixed', display: 'none', zIndex: '9999'}}>
    <p>読み込み中...</p>
  </div>
  
  <BackgroundGrid />
  <SettingsPanel />
    <Header />
    <div id="content" className="container">
    <Routes>
      <Route path="/" element={<LandingView />} />
      <Route path="/admin/groups" element={<GroupDashboardView />} />
      <Route path="/admin/groups/:groupId" element={<DashboardView />} />
      <Route path="/admin/dashboard" element={<AdminDashboardView />} />
      <Route path="/admin/event/:eventId/edit" element={<EventEditView />} />
      <Route path="/admin/event/:eventId/broadcast" element={<BroadcastView />} />
      <Route path="/admin/group/:groupId/event/new" element={<EventEditView />} />
      <Route path="/admin/groups/:groupId/members" element={<MemberManagementView />} />
      <Route path="/groups/:groupId" element={<GroupEventListView />} />
      <Route path="/g/:customUrl" element={<GroupEventListView />} />
      <Route path="/groups/:groupId/dashboard" element={<ParticipantDashboardView />} />
      <Route path="/g/:customUrl/dashboard" element={<ParticipantDashboardView />} />
      <Route path="/events/:eventId" element={<ParticipantView />} />
      <Route path="/g/:customUrl/:eventId" element={<ParticipantView />} />
      <Route path="/share/:eventId/:participantName" element={<ParticipantView />} />
      <Route path="/tutorials" element={<TutorialListView />} />
    </Routes>
    </div>
    </>
  );
};

export default App;
