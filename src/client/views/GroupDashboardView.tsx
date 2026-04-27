import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setGroups, setLoadingGroups } from '../store/adminSlice';
import { X } from 'lucide-react';
import * as api from '../lib/api';
import { GroupSettingsModal } from '../components/admin/GroupSettingsModal';

export const GroupDashboardView: React.FC = () => {
  const dispatch = useDispatch();
  const groups = useSelector((state: RootState) => state.admin.groups);
  const loadingGroups = useSelector((state: RootState) => state.admin.loadingGroups);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [requestAdminLoading, setRequestAdminLoading] = useState(false);
  const [settingsGroup, setSettingsGroup] = useState<any>(null);
  
  // UI States
  const [toastMessage, setToastMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const fetchGroupsData = async () => {
    dispatch(setLoadingGroups(true));
    try {
      const data = await api.getGroups();
      dispatch(setGroups(data));
    } catch (e) {
      console.error('Failed to fetch groups', e);
      dispatch(setLoadingGroups(false));
    }
  };

  useEffect(() => {
    fetchGroupsData();
  }, [dispatch]);

  useEffect(() => {
    // CDN版のlucide初期化を削除しました
  }, [groups, settingsGroup]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setToastMessage('グループ名を入力してください。');
      return;
    }
    try {
      await api.createGroup(newGroupName.trim());
      setNewGroupName('');
      fetchGroupsData();
      setToastMessage('グループを作成しました。');
    } catch (e: any) {
      setToastMessage(e.message || 'グループの作成に失敗しました。');
    }
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    setConfirmDialog({
      message: `グループ「${groupName}」を削除しますか？\n関連するすべてのイベントも削除され、元に戻せません。`,
      onConfirm: async () => {
        try {
          await api.deleteGroup(groupId);
          setToastMessage('グループを削除しました。');
          fetchGroupsData();
        } catch (e: any) {
          setToastMessage(e.message || 'グループの削除に失敗しました。');
        }
      }
    });
  };

  const handleSettings = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setSettingsGroup(group);
    }
  };



  const handleRequestAdmin = async () => {
    setRequestAdminLoading(true);
    try {
      await api.requestAdminAccess();
      setToastMessage('管理者権限を申請しました。承認をお待ちください。');
      // リロードしてReduxのユーザーステートを最新化（Vanilla JS側と同期）
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      setToastMessage('申請に失敗しました。');
      setRequestAdminLoading(false);
    }
  };

  const showAdminRequest = user && user.role !== 'admin' && user.role !== 'system_admin';

  return (
    <div id="groupDashboard" className="view-container">
      <h2>マイグループ一覧</h2>
      <div className="controls">
        <div className="input-group">
          <label htmlFor="groupNameInput" className="visually-hidden">新しいグループ名</label>
          <input 
            type="text" 
            id="groupNameInput" 
            placeholder="新しいグループ名" 
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button id="createGroupButton" onClick={handleCreateGroup}>グループ作成</button>
        </div>
      </div>
      
      {loadingGroups ? (
        <p>読み込み中...</p>
      ) : (
        <ul id="groupList" className="item-list">
          {groups.map(group => {
            let dateString = '不明な日時';
            if (group.createdAt) {
              const d = new Date(group.createdAt._seconds ? group.createdAt._seconds * 1000 : group.createdAt);
              if (!isNaN(d.getTime())) dateString = d.toLocaleDateString();
            }
            return (
              <li key={group.id} className="item-list-item list-item-link" onClick={() => navigate(`/admin/groups/${group.id}`)}>
                <span className="cursor-pointer">
                  {group.name} ({dateString})
                </span>
                <div className="item-buttons">
                  <button onClick={(e) => { e.stopPropagation(); handleSettings(group.id); }}>設定</button>
                  <button className="delete-btn delete-group-btn" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id, group.name); }}>削除</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showAdminRequest && (
        <div className="controls mt-20" id="requestAdminControls">
          <button 
            id="requestAdminButton" 
            onClick={handleRequestAdmin}
            disabled={requestAdminLoading || user.adminRequestStatus === 'pending'}
          >
            {requestAdminLoading || user.adminRequestStatus === 'pending' ? '申請中' : '管理者権限を申請する'}
          </button>
        </div>
      )}

      {settingsGroup && (
        <GroupSettingsModal
          settingsGroup={settingsGroup}
          onClose={() => setSettingsGroup(null)}
          onSaved={() => {
            setSettingsGroup(null);
            fetchGroupsData();
          }}
          onDeleted={() => {
            setSettingsGroup(null);
            fetchGroupsData();
          }}
          setToastMessage={setToastMessage}
          setConfirmDialog={setConfirmDialog}
        />
      )}

      {toastMessage && (
        <div className="toast active">
          {toastMessage}
        </div>
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
