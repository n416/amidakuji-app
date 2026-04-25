import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Modals } from './components/Modals';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { GroupDashboardView } from './views/GroupDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { GroupEventListView } from './views/GroupEventListView';
import { MemberManagementView } from './views/MemberManagementView';
import { EventEditView } from './views/EventEditView';
import { BroadcastView } from './views/BroadcastView';
import { ParticipantView } from './views/ParticipantView';
import { TutorialListView } from './views/TutorialListView';

const App: React.FC = () => {
  useEffect(() => {
    // ここでVanilla JSのエントリポイントを呼び出す（動的import等で）
    const loadLegacyScripts = async () => {
      // @ts-ignore
      await import('./lib/main.js');
    };
    loadLegacyScripts();
  }, []);

  return (
    <>
      
  <div id="globalLoadingMask" className="loading-mask" style={{position: 'fixed', display: 'none', zIndex: '9999'}}>
    <p>読み込み中...</p>
  </div>
  
  <div id="canvas-container">
    <canvas id="grid-canvas"></canvas>
    <canvas id="animation-canvas"></canvas>

  </div>
    <Header />
    <LandingView />
    <GroupDashboardView />
    <AdminDashboardView />
    <GroupEventListView />
    <DashboardView />
    <MemberManagementView />
    <EventEditView />
    <BroadcastView />
    <ParticipantView />
    <TutorialListView />

    <Modals />
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

    </>
  );
};

export default App;
