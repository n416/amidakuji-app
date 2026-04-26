import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { store } from '../store';

export const TutorialListView: React.FC = () => {
  const navigate = useNavigate();
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    // @ts-ignore
    if (window.tutorials) {
      // @ts-ignore
      setTutorials(window.tutorials.filter((t: any) => t.showInList !== false));
    }
  }, []);

  const handleReset = (id: string, title: string) => {
    localStorage.removeItem(`tutorialCompleted_${id}`);
    showToast(`「${title}」の進捗をリセットしました。`);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLinkClick = (e: React.MouseEvent, tutorial: any) => {
    e.preventDefault();
    // @ts-ignore
    if (window.tutorialManager) {
      // @ts-ignore
      window.tutorialManager.setReturnUrl(window.location.pathname);
    }
    
    // Create a proxy state similar to App.tsx so generateTutorialUrl can resolve currentGroupId
    const st = store.getState();
    const proxyState = {
      get currentGroupId() { return st.lottery.currentGroupId || st.admin.currentGroup?.id || localStorage.getItem('lastUsedGroupId'); },
      get currentUser() { return st.auth.user; }
    };

    // @ts-ignore
    const href = window.tutorialUtils?.generateTutorialUrl(tutorial, proxyState) || '#';
    
    if (href === '#NO_GROUP') {
      showToast('このチュートリアルを開始するには、グループが必要です。先にグループを作成して選択してください。');
      return;
    }

    navigate(href);
  };

  const groupedTutorials = tutorials.reduce((acc, tutorial) => {
    const group = tutorial.description || 'その他';
    if (!acc[group]) acc[group] = [];
    acc[group].push(tutorial);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="view-container">
      <h2>チュートリアル一覧</h2>
      <div className="controls">
        <p>各チュートリアルのタイトルをクリックすると、いつでも説明を再確認できます。</p>
      </div>
      <div>
        {Object.keys(groupedTutorials).map(groupName => (
          <div key={groupName}>
            <h3>{groupName}</h3>
            <ul className="item-list">
              {groupedTutorials[groupName].map((tutorial: any) => {
                const isCompleted = localStorage.getItem(`tutorialCompleted_${tutorial.id}`) === 'true';
                return (
                  <li key={tutorial.id} className="item-list-item">
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <span className={`tutorial-status-icon ${isCompleted ? 'completed' : ''}`}></span>
                      <a href="#" className="tutorial-link" onClick={(e) => handleLinkClick(e, tutorial)}>
                        {tutorial.title}
                      </a>
                    </div>
                    <div className="item-buttons">
                      <button className="secondary-btn reset-tutorial-btn" onClick={() => handleReset(tutorial.id, tutorial.title)}>
                        進捗リセット
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {toastMessage && (
        <div className="toast active">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
