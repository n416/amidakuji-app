import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// @ts-ignore
import * as state from '../lib/state.js';

export const ParticipantHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [participantName, setParticipantName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);

  const isParticipantView = 
    location.pathname.startsWith('/events/') || 
    location.pathname.startsWith('/share/') || 
    (location.pathname.startsWith('/groups/') && !location.pathname.startsWith('/admin/groups')) || 
    (location.pathname.startsWith('/g/') && !location.pathname.startsWith('/admin/'));

  useEffect(() => {
    const checkState = () => {
      state.loadParticipantState();
      setGroupId(state.currentGroupId);
      if (state.currentParticipantId && state.currentParticipantToken) {
        setIsLoggedIn(true);
        setParticipantName(state.currentParticipantName || '');
      } else {
        setIsLoggedIn(false);
      }
    };

    checkState();

    window.addEventListener('participantStateChanged', checkState);
    return () => {
      window.removeEventListener('participantStateChanged', checkState);
    };
  }, [location.pathname]);

  if (!isParticipantView) {
    return null;
  }

  const handleLogout = () => {
    state.clearParticipantState();
    window.location.reload();
  };

  const handleDashboard = () => {
    if (groupId) {
      navigate(`/groups/${groupId}/dashboard`);
    } else if (state.currentGroupId) {
      navigate(`/groups/${state.currentGroupId}/dashboard`);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="participant-header" id="participantHeader" style={{ display: 'flex' }}>
      <div className="header-content-wrapper">
        {!isLoggedIn ? (
          <div id="participant-header-logged-out" style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
            <div className="participant-header-actions">
              <button className="button" onClick={handleDashboard}>ダッシュボード</button>
            </div>
          </div>
        ) : (
          <div id="participant-header-logged-in" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div id="participantWelcomeMessage">ようこそ、{participantName}さん</div>
            <div className="participant-header-actions">
              <button className="button" onClick={handleDashboard}>ダッシュボード</button>
              <button className="secondary-btn" onClick={handleLogout}>ログアウト</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
