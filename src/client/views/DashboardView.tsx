import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCurrentGroup, setCurrentGroupEvents, setPasswordRequests, setCurrentGroupPrizeMasters } from '../store/adminSlice';
import { X, ImagePlus, Star, Trash2, Settings, Trophy, Users } from 'lucide-react';
import * as api from '../lib/api';
import { GroupSettingsModal } from '../components/admin/GroupSettingsModal';
import { PrizeMasterModal } from '../components/admin/PrizeMasterModal';
import { PasswordRequestsModal } from '../components/admin/PasswordRequestsModal';

export const DashboardView: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const group = useSelector((state: RootState) => state.admin.currentGroup);
  const events = useSelector((state: RootState) => state.admin.currentGroupEvents);
  const passwordRequests = useSelector((state: RootState) => state.admin.passwordRequests);
  const [showStartedEvents, setShowStartedEvents] = useState(false);
  const [loading, setLoading] = useState(true);

  // Group Settings State
  const [settingsGroup, setSettingsGroup] = useState<any>(null);

  const [showPrizeMasterModal, setShowPrizeMasterModal] = useState(false);
  const [showPasswordRequestsModal, setShowPasswordRequestsModal] = useState(false);

  // UI States
  const [toastMessage, setToastMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const fetchData = async () => {
    if (!groupId) return;
    localStorage.setItem('lastUsedGroupId', groupId);
    try {
      const [groupData, eventsData, requestsData] = await Promise.all([
        api.getGroup(groupId),
        api.getEventsForGroup(groupId),
        api.getPasswordRequests(groupId)
      ]);

      dispatch(setCurrentGroup(groupData));
      dispatch(setCurrentGroupEvents(eventsData));
      dispatch(setPasswordRequests(requestsData));
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedPreference = localStorage.getItem('showStartedEvents');
    if (savedPreference === 'true') {
      setShowStartedEvents(true);
    }

    fetchData();

    const handleUpdate = () => fetchData();
    window.addEventListener('dashboardUpdated', handleUpdate);
    return () => window.removeEventListener('dashboardUpdated', handleUpdate);
  }, [groupId]);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const handleGroupSettings = () => {
    if (group) {
      setSettingsGroup(group);
    }
  };

  const handlePrizeMaster = () => {
    setShowPrizeMasterModal(true);
  };

  const handleMemberManagement = () => {
    navigate(`/admin/groups/${groupId}/members`);
  };

  const handleCreateEvent = () => {
    navigate(`/admin/group/${groupId}/event/new`);
  };

  const handlePasswordResetRequests = () => {
    setShowPasswordRequestsModal(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setConfirmDialog({
      message: 'このイベントを削除しますか？元に戻せません。',
      onConfirm: async () => {
        try {
          await api.deleteEvent(eventId);
          setToastMessage('イベントを削除しました。');
          fetchData();
        } catch (e) {
          setToastMessage('イベントの削除に失敗しました。');
        }
      }
    });
  };

  const handleCopyEvent = (eventId: string) => {
    setConfirmDialog({
      message: 'このイベントをコピーしますか？',
      onConfirm: async () => {
        try {
          await api.copyEvent(eventId);
          setToastMessage('イベントをコピーしました。');
          fetchData();
        } catch (e) {
          setToastMessage('イベントのコピーに失敗しました。');
        }
      }
    });
  };

  const eventsToRender = showStartedEvents ? events : events.filter(e => e.status !== 'started');

  return (
    <div id="dashboardView" className="view-container">
      <h2 id="eventGroupName">{group?.name || 'グループダッシュボード'}</h2>

      {passwordRequests.length > 0 && (
        <div id="passwordResetNotification" className="notification-banner">
          <p><span id="passwordResetCount">{passwordRequests.length}</span>件の合言葉リセット依頼が承認を待っています。</p>
          <button id="showPasswordResetRequestsButton" onClick={handlePasswordResetRequests}>詳細を表示</button>
        </div>
      )}

      <div className="controls dashboard-actions-container">
        <div id="userInfoDisplay" className="user-info-display">
          {user && user.anonymousName ? `ようこそ ${user.anonymousName} さん (id: ${user.id.substring(0, 8)}...)` : ''}
        </div>
        <div className="action-groups">
          <div className="action-group modal-actions-group">
            <button id="goToGroupSettingsButton" className="secondary-btn auto-width" onClick={handleGroupSettings}><Settings size={18} /> グループ設定</button>
            <button id="goToPrizeMasterButton" className="secondary-btn auto-width" onClick={handlePrizeMaster}><Trophy size={18} /> 景品マスター管理</button>
          </div>
          <div className="action-group navigation-actions-group">
            <button id="goToMemberManagementButton" onClick={handleMemberManagement}><Users size={18} /> メンバー管理</button>
            <button id="goToCreateEventViewButton" className="primary-action" onClick={handleCreateEvent}>イベント新規作成</button>
          </div>
        </div>
      </div>

      <div className="list-header">
        <h3>このグループのイベント一覧</h3>
        <div className="input-group checkbox-group">
          <input
            type="checkbox"
            id="showStartedEvents"
            checked={showStartedEvents}
            onChange={(e) => {
              setShowStartedEvents(e.target.checked);
              localStorage.setItem('showStartedEvents', e.target.checked.toString());
            }}
          />
          <label htmlFor="showStartedEvents">終了済みを表示する</label>
        </div>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ul id="eventList" className="item-list">
          {eventsToRender.map(event => {
            let dateString = '日付不明';
            if (event.createdAt) {
              const d = new Date(event.createdAt._seconds ? event.createdAt._seconds * 1000 : event.createdAt);
              if (!isNaN(d.getTime())) dateString = d.toLocaleString();
            }

            const isFull = event.participants?.every((p: any) => p.name !== null);
            const filledSlots = event.participants?.filter((p: any) => p.name).length || 0;

            return (
              <li key={event.id} className="item-list-item list-item-link" onClick={() => navigate(event.status === 'started' ? `/admin/event/${event.id}/broadcast` : `/admin/event/${event.id}/edit`)}>
                <span className="event-info">
                  <strong>{event.eventName || '無題のイベント'}</strong>
                  <span className="event-date">（{dateString}作成）</span>
                  {event.status === 'started' ? (
                    <span>実施済み</span>
                  ) : isFull ? (
                    <span className="badge full">満員御礼</span>
                  ) : (
                    <span className="badge ongoing">開催中</span>
                  )}
                  <span className="event-status">{filledSlots} / {event.participantCount || 0} 名参加</span>
                </span>
                <div className="item-buttons">
                  <button className="edit-event-btn" data-tutorial-target={event.status === 'started' ? undefined : "edit-event"} onClick={(e) => { e.stopPropagation(); navigate(`/admin/event/${event.id}/edit`); }}>
                    {event.status === 'started' ? '確認' : '編集'}
                  </button>
                  <button className="start-event-btn" onClick={(e) => { e.stopPropagation(); navigate(`/admin/event/${event.id}/broadcast`); }}>実施</button>
                  <button className="copy-event-btn" onClick={(e) => { e.stopPropagation(); handleCopyEvent(event.id); }}>コピー</button>
                  <button className="delete-btn delete-event-btn" onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}>削除</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showPrizeMasterModal && (
        <PrizeMasterModal
          groupId={groupId!}
          onClose={() => setShowPrizeMasterModal(false)}
          setToastMessage={setToastMessage}
          setConfirmDialog={setConfirmDialog}
        />
      )}

      {showPasswordRequestsModal && (
        <PasswordRequestsModal
          groupId={groupId!}
          onClose={() => setShowPasswordRequestsModal(false)}
          setToastMessage={setToastMessage}
          setConfirmDialog={setConfirmDialog}
          onRefresh={fetchData}
        />
      )}

      {settingsGroup && (
        <GroupSettingsModal
          settingsGroup={settingsGroup}
          onClose={() => setSettingsGroup(null)}
          onSaved={() => {
            setSettingsGroup(null);
            fetchData();
          }}
          onDeleted={() => {
            setSettingsGroup(null);
            navigate('/admin/groups');
          }}
          setToastMessage={setToastMessage}
          setConfirmDialog={setConfirmDialog}
        />
      )}

      {confirmDialog && (
        <div className="modal active modal-confirm">
          <div className="modal-content max-w-400 text-center">
            <p className="confirm-message text-lg">{confirmDialog.message}</p>
            <div className="modal-actions center gap-15">
              <button className="secondary-btn" onClick={() => setConfirmDialog(null)}>キャンセル</button>
              <button className="primary-action danger" onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
