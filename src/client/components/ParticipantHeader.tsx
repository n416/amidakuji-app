import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { clearParticipantSession } from '../store/participantSlice';

export const ParticipantHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const participantSession = useSelector((state: RootState) => state.participant);
  const lotteryState = useSelector((state: RootState) => state.lottery);

  const isParticipantView = 
    location.pathname.startsWith('/events/') || 
    location.pathname.startsWith('/share/') || 
    (location.pathname.startsWith('/groups/') && !location.pathname.startsWith('/admin/groups')) || 
    (location.pathname.startsWith('/g/') && !location.pathname.startsWith('/admin/'));

  const isShareView = location.pathname.startsWith('/share/');

  const isLoggedIn = !!(participantSession.memberId && participantSession.token);
  const participantName = participantSession.name || '';
  const groupId = participantSession.groupId || lotteryState.currentGroupId;

  if (!isParticipantView || isShareView) {
    return null;
  }

  const handleLogout = () => {
    dispatch(clearParticipantSession());
    window.location.reload();
  };

  const handleDashboard = () => {
    if (groupId) {
      navigate(`/groups/${groupId}/dashboard`);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="participant-header visible" id="participantHeader">
      <div className="header-content-wrapper">
        {!isLoggedIn ? (
          <div id="participant-header-logged-out" className="flex-end">
            <div className="participant-header-actions">
              <button className="button" onClick={handleDashboard}>ダッシュボード</button>
            </div>
          </div>
        ) : (
          <div id="participant-header-logged-in" className="flex-center-between">
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
