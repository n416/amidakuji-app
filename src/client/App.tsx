import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { EventEditView } from './views/EventEditView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'eventEdit'>('eventEdit');

  return (
    <Layout>
      {currentView === 'landing' && (
        <div id="landingView" className="view-container">
          <div className="landing-container">
            <h2>ダイナミックあみだくじへようこそ！</h2>
            <p className="landing-subtitle">インタラクティブなあみだくじを作成して、イベントを盛り上げましょう。</p>
            <div className="controls">
              <button className="primary-action" onClick={() => setCurrentView('eventEdit')}>
                イベント編集画面へ
              </button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'eventEdit' && <EventEditView />}
    </Layout>
  );
};

export default App;
