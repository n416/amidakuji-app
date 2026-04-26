import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const AdminDashboardView: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  // Group Admins State
  const [groupAdmins, setGroupAdmins] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setShowConfirmModal({ isOpen: true, message, onConfirm });
  };
  const [groupAdminSearch, setGroupAdminSearch] = useState('');
  const [groupAdminPage, setGroupAdminPage] = useState(0);
  const [groupAdminHistory, setGroupAdminHistory] = useState<any[]>([null]);
  const [groupAdminHasNext, setGroupAdminHasNext] = useState(false);
  const [groupAdminNextCursor, setGroupAdminNextCursor] = useState<any>(null);

  // System Admins State
  const [systemAdmins, setSystemAdmins] = useState<any[]>([]);
  const [systemAdminSearch, setSystemAdminSearch] = useState('');
  const [systemAdminPage, setSystemAdminPage] = useState(0);
  const [systemAdminHistory, setSystemAdminHistory] = useState<any[]>([null]);
  const [systemAdminHasNext, setSystemAdminHasNext] = useState(false);
  const [systemAdminNextCursor, setSystemAdminNextCursor] = useState<any>(null);

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch('/api/admin/requests', { credentials: 'include' });
      if (res.ok) setPendingRequests(await res.json());
    } catch (e) {
      console.error('Failed to fetch pending requests', e);
    }
  };

  const fetchGroupAdmins = async (cursor: any = null, search = groupAdminSearch) => {
    try {
      let endpoint = '/api/admin/group-admins';
      const params = new URLSearchParams();
      if (cursor) params.append('lastVisible', cursor);
      if (search) params.append('searchId', search);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const res = await fetch(endpoint, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setGroupAdmins((data as any)?.admins || []);
        setGroupAdminNextCursor((data as any)?.lastVisible);
        setGroupAdminHasNext((data as any)?.hasNextPage || false);
      }
    } catch (e) {
      console.error('Failed to fetch group admins', e);
      setGroupAdmins([]);
    }
  };

  const fetchSystemAdmins = async (cursor: any = null, search = systemAdminSearch) => {
    try {
      let endpoint = '/api/admin/system-admins';
      const params = new URLSearchParams();
      if (cursor) params.append('lastVisible', cursor);
      if (search) params.append('searchId', search);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const res = await fetch(endpoint, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as any;
        setSystemAdmins(data?.admins || []);
        setSystemAdminNextCursor(data?.lastVisible);
        setSystemAdminHasNext(data?.hasNextPage || false);
      }
    } catch (e) {
      console.error('Failed to fetch system admins', e);
      setSystemAdmins([]);
    }
  };

  const fetchAdminData = () => {
    fetchPendingRequests();
    fetchGroupAdmins();
    fetchSystemAdmins();
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveAdmin = async (requestId: string) => {
    confirmAction('このユーザーの管理者権限を承認しますか？', async () => {
      try {
        const res = await fetch('/api/admin/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId })
        });
        if (!res.ok) throw new Error('Failed to approve request');
        showToast('申請を承認しました。');
        fetchAdminData();
      } catch (e) {
        showToast('承認に失敗しました。');
      }
      setShowConfirmModal({ ...showConfirmModal, isOpen: false });
    });
  };

  const handleImpersonate = async (userId: string) => {
    confirmAction('このユーザーとしてログインしますか？', async () => {
      try {
        const res = await fetch('/api/admin/impersonate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: userId })
        });
        if (!res.ok) throw new Error('Failed to impersonate');
        showToast('成り代わりました。ページをリロードします。');
        setTimeout(() => window.location.href = '/', 1000);
      } catch (e) {
        showToast('成り代わりに失敗しました。');
      }
      setShowConfirmModal({ ...showConfirmModal, isOpen: false });
    });
  };

  const handleDemoteAdmin = async (userId: string) => {
    confirmAction('本当にこのシステム管理者を通常ユーザーに戻しますか？', async () => {
      try {
        const res = await fetch('/api/admin/demote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        if (!res.ok) throw new Error('Failed to demote');
        showToast('ユーザーを降格させました。');
        fetchAdminData();
      } catch (e) {
        showToast('降格に失敗しました。');
      }
      setShowConfirmModal({ ...showConfirmModal, isOpen: false });
    });
  };

  // Group Admin Pagination
  const handleGroupAdminNext = () => {
    const newPage = groupAdminPage + 1;
    const newHistory = [...groupAdminHistory, groupAdminNextCursor];
    setGroupAdminPage(newPage);
    setGroupAdminHistory(newHistory);
    fetchGroupAdmins(groupAdminNextCursor);
  };
  const handleGroupAdminPrev = () => {
    const newPage = groupAdminPage - 1;
    const newHistory = [...groupAdminHistory];
    newHistory.pop();
    setGroupAdminPage(newPage);
    setGroupAdminHistory(newHistory);
    fetchGroupAdmins(newHistory[newPage]);
  };

  // System Admin Pagination
  const handleSystemAdminNext = () => {
    const newPage = systemAdminPage + 1;
    const newHistory = [...systemAdminHistory, systemAdminNextCursor];
    setSystemAdminPage(newPage);
    setSystemAdminHistory(newHistory);
    fetchSystemAdmins(systemAdminNextCursor);
  };
  const handleSystemAdminPrev = () => {
    const newPage = systemAdminPage - 1;
    const newHistory = [...systemAdminHistory];
    newHistory.pop();
    setSystemAdminPage(newPage);
    setSystemAdminHistory(newHistory);
    fetchSystemAdmins(newHistory[newPage]);
  };

  return (
    <div id="adminDashboard" className="view-container">
      <h2>システム管理ダッシュボード</h2>
      <div className="controls">
        <h3>管理者申請一覧</h3>
        <ul id="pendingRequestsList" className="item-list">
          {pendingRequests.length === 0 ? (
            <li>現在、承認待ちの申請はありません。</li>
          ) : (
            pendingRequests.map(req => (
              <li key={req.id} className="item-list-item">
                <span>{req.name} (id: {req.id})</span>
                <div className="item-buttons">
                  <button className="approve-btn" onClick={() => handleApproveAdmin(req.id)}>承認</button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      
      <div className="controls">
        <h3>ユーザー一覧</h3>
        <div className="search-controls">
          <input 
            type="text" 
            placeholder="ユーザーIDで検索" 
            value={groupAdminSearch}
            onChange={(e) => setGroupAdminSearch(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && fetchGroupAdmins(null)}
          />
          <button onClick={() => { setGroupAdminPage(0); setGroupAdminHistory([null]); fetchGroupAdmins(null); }}>検索</button>
        </div>
        <ul id="adminUserList" className="item-list">
          {groupAdmins.length === 0 ? (
            <li>ユーザーは存在しません。</li>
          ) : (
            groupAdmins.map(admin => (
              <li key={admin.id} className="item-list-item">
                <span>{admin.name} (id: {admin.id})</span>
                <div className="item-buttons">
                  <button className="impersonate-btn" onClick={() => handleImpersonate(admin.id)}>成り代わり</button>
                </div>
              </li>
            ))
          )}
        </ul>
        <div className="pagination-controls" id="groupAdminPagination">
          <button className="prev-btn" style={{ display: groupAdminPage > 0 ? 'inline-block' : 'none' }} onClick={handleGroupAdminPrev}>前へ</button>
          <button className="next-btn" style={{ display: groupAdminHasNext ? 'inline-block' : 'none' }} onClick={handleGroupAdminNext}>次へ</button>
        </div>
      </div>
      
      <div className="controls">
        <h3>システム管理者一覧</h3>
        <div className="search-controls">
          <input 
            type="text" 
            placeholder="ユーザーIDで検索" 
            value={systemAdminSearch}
            onChange={(e) => setSystemAdminSearch(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && fetchSystemAdmins(null)}
          />
          <button onClick={() => { setSystemAdminPage(0); setSystemAdminHistory([null]); fetchSystemAdmins(null); }}>検索</button>
        </div>
        <ul id="systemAdminList" className="item-list">
          {systemAdmins.length === 0 ? (
            <li>ユーザーは存在しません。</li>
          ) : (
            systemAdmins.map(admin => {
              const isCurrentUser = user && admin.id === (user.isImpersonating && user.originalUser ? user.originalUser.id : user.id);
              let regDateStr = '不明';
              if (admin.createdAt && admin.createdAt._seconds) {
                regDateStr = new Date(admin.createdAt._seconds * 1000).toLocaleDateString();
              }
              return (
                <li key={admin.id} className="item-list-item">
                  <span>{admin.name} (id: {admin.id})</span> 
                  <span className="registration-date">登録日: {regDateStr}</span> 
                  {!isCurrentUser && (
                    <div className="item-buttons">
                      <button className="demote-btn delete-btn" onClick={() => handleDemoteAdmin(admin.id)}>権限剥奪</button>
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
        <div className="pagination-controls" id="systemAdminPagination">
          <button className="prev-btn" style={{ display: systemAdminPage > 0 ? 'inline-block' : 'none' }} onClick={handleSystemAdminPrev}>前へ</button>
          <button className="next-btn" style={{ display: systemAdminHasNext ? 'inline-block' : 'none' }} onClick={handleSystemAdminNext}>次へ</button>
        </div>
      </div>

      {showConfirmModal.isOpen && (
        <div className="modal" style={{display: 'block', zIndex: 10000}}>
          <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center'}}>
            <h3>確認</h3>
            <p>{showConfirmModal.message}</p>
            <div className="modal-actions" style={{justifyContent: 'center', gap: '15px'}}>
              <button className="secondary-btn" onClick={() => setShowConfirmModal({...showConfirmModal, isOpen: false})}>キャンセル</button>
              <button className="primary-action" onClick={showConfirmModal.onConfirm}>OK</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#333', color: '#fff', padding: '10px 20px', borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 99999
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};
