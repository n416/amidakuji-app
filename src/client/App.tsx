import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { store } from './store';
import { Header } from './components/Header';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { GroupDashboardView } from './views/GroupDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';

import { ParticipantDashboardView } from './views/ParticipantDashboardView';
import { MemberManagementView } from './views/MemberManagementView';
import { EventEditView } from './views/EventEditView';
import { BroadcastView } from './views/BroadcastView';
import { ParticipantView } from './views/ParticipantView';
import { TutorialListView } from './views/TutorialListView';
import { BackgroundGrid } from './components/BackgroundGrid';
import { SettingsPanel } from './components/SettingsPanel';
import { TutorialEngine } from './tutorial/TutorialEngine';
import { useSelector } from 'react-redux';
import * as api from './lib/api';
import { initFirebase, firebaseAuth } from './lib/firebaseSetup';
import { signInAnonymously } from 'firebase/auth';

const App: React.FC = () => {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState('');
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, message: string, resolve: (v: boolean) => void} | null>(null);

  const [backgroundAnimation, setBackgroundAnimation] = useState(true);

  const user = useSelector((state: any) => state.auth.user);

  const showToast = (msg: string, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), duration);
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const configRes = await fetch('/api/config');
        const firebaseConfig = await configRes.json();
        initFirebase(firebaseConfig);
        signInAnonymously(firebaseAuth).catch(console.error);

        const emojiRes = await fetch('/api/emoji-map');
        (window as any).emojiMapData = await emojiRes.json();

        setIsFirebaseReady(true);
      } catch (e) {
        console.error('Failed to load initial config:', e);
      }
    };
    initApp();
  }, []);



  if (!isFirebaseReady) {
    return (
      <div id="globalLoadingMask" className="loading-mask global-loading-mask">
        <p>Firebase 初期化中...</p>
      </div>
    );
  }

  return (
    <>
      
  <div id="globalLoadingMask" className="loading-mask hidden-element">
    <p>読み込み中...</p>
  </div>
  
  <BackgroundGrid animation={backgroundAnimation} />
  <SettingsPanel animation={backgroundAnimation} setAnimation={setBackgroundAnimation} />
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
      <Route path="/groups/:groupId" element={<Navigate replace to="dashboard" />} />
      <Route path="/g/:customUrl" element={<Navigate replace to="dashboard" />} />
      <Route path="/groups/:groupId/dashboard" element={<ParticipantDashboardView />} />
      <Route path="/g/:customUrl/dashboard" element={<ParticipantDashboardView />} />
      <Route path="/events/:eventId" element={<ParticipantView />} />
      <Route path="/g/:customUrl/:eventId" element={<ParticipantView />} />
      <Route path="/share/:eventId/:participantName" element={<ParticipantView />} />
      <Route path="/tutorials" element={<TutorialListView />} />
    </Routes>
    </div>

    {toastMessage && (
      <div className="toast active">{toastMessage}</div>
    )}

    {confirmState?.isOpen && (
      <div className="modal active modal-confirm">
        <div className="modal-content text-center max-w-400">
          <h3>確認</h3>
          <p className="confirm-message">{confirmState.message}</p>
          <div className="modal-actions center gap-15">
            <button className="secondary-btn" onClick={() => { setConfirmState(null); confirmState.resolve(false); }}>キャンセル</button>
            <button className="primary-action" onClick={() => { setConfirmState(null); confirmState.resolve(true); }}>OK</button>
          </div>
        </div>
      </div>
    )}
    <TutorialEngine />
    </>
  );
};

export default App;
