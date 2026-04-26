import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { X } from 'lucide-react';

export const GroupDashboardView: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestAdminLoading, setRequestAdminLoading] = useState(false);
  const [settingsGroup, setSettingsGroup] = useState<any>(null);
  const [settingsData, setSettingsData] = useState({ name: '', customUrl: '', noIndex: false, password: '' });
  
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

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setGroups(data as any[]);
      }
    } catch (e) {
      console.error('Failed to fetch groups', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();

    const handleGroupsUpdated = (e: any) => {
      if (e.detail) {
        setGroups(e.detail);
      } else {
        fetchGroups();
      }
    };
    window.addEventListener('groupsUpdated', handleGroupsUpdated);
    return () => {
      window.removeEventListener('groupsUpdated', handleGroupsUpdated);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, [groups, settingsGroup]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setToastMessage('グループ名を入力してください。');
      return;
    }
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName: newGroupName.trim(), participants: [] }),
      });
      if (!res.ok) {
        const err = await res.json() as any;
        throw new Error(err.error || 'Failed to create group');
      }
      setNewGroupName('');
      fetchGroups();
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
          const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
          if (!res.ok) {
            const err = await res.json() as any;
            throw new Error(err.error || 'Failed to delete group');
          }
          setToastMessage('グループを削除しました。');
          fetchGroups();
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
      setSettingsData({
        name: group.name || '',
        customUrl: group.customUrl || '',
        noIndex: group.noIndex || false,
        password: ''
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: settingsData.name.trim(),
        customUrl: settingsData.customUrl.trim(),
        noIndex: settingsData.noIndex
      };
      if (settingsData.password) payload.password = settingsData.password;
      
      const res = await fetch(`/api/groups/${settingsGroup.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      
      setToastMessage('設定を保存しました。');
      setSettingsGroup(null);
      fetchGroups();
    } catch (e) {
      setToastMessage('設定の保存に失敗しました。');
    }
  };

  const handleDeletePassword = () => {
    setConfirmDialog({
      message: '本当にこのグループの合言葉を削除しますか？',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/groups/${settingsGroup.id}/password`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete password');
          setToastMessage('合言葉を削除しました。');
          setSettingsGroup((prev: any) => ({...prev, password: null}));
        } catch (e) {
          setToastMessage('合言葉の削除に失敗しました。');
        }
      }
    });
  };

  const handleRequestAdmin = async () => {
    setRequestAdminLoading(true);
    try {
      const res = await fetch('/api/admin/request', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to request admin');
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
      
      {loading ? (
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
                <span style={{ cursor: 'pointer' }}>
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
        <div className="controls" style={{marginTop: '20px'}} id="requestAdminControls">
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
        <div id="groupSettingsModal" className="modal" style={{display: 'block', zIndex: 2000}}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setSettingsGroup(null)}><X /></span>
            <form onSubmit={handleSaveSettings}>
              <h3>グループ設定: <span>{settingsGroup.name}</span></h3>
              <div className="input-group">
                <label htmlFor="groupNameEditInput">グループ名:</label>
                <input type="text" id="groupNameEditInput" value={settingsData.name} onChange={e => setSettingsData({...settingsData, name: e.target.value})} required placeholder="グループ名" autoComplete="off" />
              </div>
              <div className="input-group">
                <label htmlFor="customUrlInput">カスタムURL:</label>
                <input type="text" id="customUrlInput" value={settingsData.customUrl} onChange={e => setSettingsData({...settingsData, customUrl: e.target.value})} pattern="^[a-zA-Z0-9-]+$" title="半角英数字とハイフンのみ使用できます" placeholder="例: my-event-2025" autoComplete="off" />
              </div>
              <p className="url-preview">
                <code>/g/<span>{settingsData.customUrl}</span></code>
              </p>
              <div className="input-group">
                <label htmlFor="groupPasswordInput">合言葉:</label>
                <input 
                  type="password" 
                  id="groupPasswordInput" 
                  value={settingsData.password} 
                  onChange={e => setSettingsData({...settingsData, password: e.target.value})} 
                  placeholder={settingsGroup.hasPassword ? "新規設定・変更のみ入力（現在設定済）" : "新規設定・変更のみ入力"}
                  autoComplete="current-password"
                />
              </div>
              <div className="input-group checkbox-group">
                <input type="checkbox" id="noIndexCheckbox" checked={settingsData.noIndex} onChange={e => setSettingsData({...settingsData, noIndex: e.target.checked})} />
                <label htmlFor="noIndexCheckbox">検索エンジンにインデックスさせない (noindex)</label>
              </div>

              <div className="modal-actions">
                {settingsGroup.hasPassword && (
                  <button type="button" id="deletePasswordButton" className="delete-btn action-left" onClick={handleDeletePassword}>
                    合言葉削除
                  </button>
                )}
                <button type="submit" id="saveGroupSettingsButton" className="primary-action">設定保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="toast" style={{
          position: 'fixed', bottom: '20px', right: '20px', 
          backgroundColor: '#333', color: '#fff', padding: '12px 20px', 
          borderRadius: '8px', zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toastMessage}
        </div>
      )}

      {confirmDialog && (
        <div className="modal" style={{ display: 'block', zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1em', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>{confirmDialog.message}</p>
            <div className="modal-actions" style={{ justifyContent: 'center', gap: '15px' }}>
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
