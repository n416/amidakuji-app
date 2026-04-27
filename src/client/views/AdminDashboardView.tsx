import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import * as api from '../lib/api';

export const AdminDashboardView: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  // Group Admins State
  const [groupAdmins, setGroupAdmins] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [toastMessage, setToastMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage(null);
      const data = await api.getAdminRequests();
      setPendingRequests(data);
    } catch (e: any) {
      console.error('Failed to fetch pending requests', e);
      if (e.error) setErrorMessage(e.error);
    }
  };

  const fetchGroupAdmins = async (cursor: any = null, search = groupAdminSearch) => {
    try {
      setErrorMessage(null);
      const data = await api.getGroupAdmins(cursor, search);
      setGroupAdmins((data as any)?.admins || []);
      setGroupAdminNextCursor((data as any)?.lastVisible);
      setGroupAdminHasNext((data as any)?.hasNextPage || false);
    } catch (e: any) {
      console.error('Failed to fetch group admins', e);
      if (e.error) setErrorMessage(e.error);
      setGroupAdmins([]);
    }
  };

  const fetchSystemAdmins = async (cursor: any = null, search = systemAdminSearch) => {
    try {
      setErrorMessage(null);
      const data = await api.getSystemAdmins(cursor, search);
      setSystemAdmins(data?.admins || []);
      setSystemAdminNextCursor(data?.lastVisible);
      setSystemAdminHasNext(data?.hasNextPage || false);
    } catch (e: any) {
      console.error('Failed to fetch system admins', e);
      if (e.error) setErrorMessage(e.error);
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
        await api.approveAdminRequest(requestId);
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
        await api.impersonateUser(userId);
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
        await api.demoteAdmin(userId);
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
      {errorMessage && (
        <div className="error-banner">
          <strong>アクセスエラー:</strong> {errorMessage}
          <p className="mt-10 mb-0 text-09em">
            システム管理者権限がありません。Firestoreでご自身の role を system_admin に変更するか、管理者に権限を申請してください。
          </p>
        </div>
      )}
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
          <button className={`prev-btn ${groupAdminPage > 0 ? '' : 'hidden-element'}`} onClick={handleGroupAdminPrev}>前へ</button>
          <button className={`next-btn ${groupAdminHasNext ? '' : 'hidden-element'}`} onClick={handleGroupAdminNext}>次へ</button>
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
          <button className={`prev-btn ${systemAdminPage > 0 ? '' : 'hidden-element'}`} onClick={handleSystemAdminPrev}>前へ</button>
          <button className={`next-btn ${systemAdminHasNext ? '' : 'hidden-element'}`} onClick={handleSystemAdminNext}>次へ</button>
        </div>
      </div>

      {showConfirmModal.isOpen && (
        <div className="modal active">
          <div className="modal-content max-w-400 text-center">
            <h3>確認</h3>
            <p className="confirm-message">{showConfirmModal.message}</p>
            <div className="modal-actions center gap-15">
              <button className="secondary-btn" onClick={() => setShowConfirmModal({...showConfirmModal, isOpen: false})}>キャンセル</button>
              <button className="primary-action" onClick={showConfirmModal.onConfirm}>OK</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="toast active">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
