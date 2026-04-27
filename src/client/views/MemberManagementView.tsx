import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCurrentGroupMembers } from '../store/adminSlice';
import * as api from '../lib/api';
import { ArrowLeft, Plus, X } from 'lucide-react';

export const MemberManagementView: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const members = useSelector((state: RootState) => state.admin.currentGroupMembers);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMemberData, setEditMemberData] = useState<any>(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2>(1);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkAnalysis, setBulkAnalysis] = useState<any[]>([]);
  const [bulkResolutions, setBulkResolutions] = useState<Record<string, string>>({});
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [bulkRegistering, setBulkRegistering] = useState(false);
  const [confirmDeletePassword, setConfirmDeletePassword] = useState<{ memberId: string, name: string } | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // カスタム確認モーダル
  const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });

  // メンバー追加用入力モーダル
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberNameInput, setAddMemberNameInput] = useState('');

  const fetchMembers = async () => {
    try {
      if (groupId) {
        const data = await api.getMembers(groupId);
        dispatch(setCurrentGroupMembers(data));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const handleAddMember = async () => {
    if (!addMemberNameInput.trim() || !groupId) return;
    try {
      await api.addMember(groupId, addMemberNameInput.trim());
      setShowAddMemberModal(false);
      setAddMemberNameInput('');
      fetchMembers();
    } catch (e: any) {
      setToastMessage(e.error || 'メンバーの追加に失敗しました。');
    }
  };

  const handleDeleteMember = (memberId: string, name: string) => {
    setShowConfirmModal({
      isOpen: true,
      message: `メンバー「${name}」を削除しますか？`,
      onConfirm: async () => {
        setShowConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          await api.deleteMember(groupId!, memberId);
          fetchMembers();
        } catch (e: any) {
          setToastMessage(e.error || 'メンバーの削除に失敗しました。');
        }
      }
    });
  };

  const handleToggleActive = async (memberId: string, isActive: boolean) => {
    try {
      await api.updateMemberStatus(groupId!, memberId, isActive);
      const updatedMembers = members.map((m: any) => m.id === memberId ? { ...m, isActive } : m);
      dispatch(setCurrentGroupMembers(updatedMembers));
    } catch (e) {
      setToastMessage('状態の更新に失敗しました。');
    }
  };

  const openEditModal = (member: any) => {
    setEditMemberData({ ...member });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editMemberData.name.trim()) {
      setToastMessage('名前は必須です。');
      return;
    }
    try {
      await api.updateMember(groupId!, editMemberData.id, {
        name: editMemberData.name.trim(),
        color: editMemberData.color || '#cccccc'
      });
      setShowEditModal(false);
      fetchMembers();
    } catch (e: any) {
      setToastMessage(e.error || '更新に失敗しました。');
    }
  };

  const executeDeletePassword = async () => {
    if (!confirmDeletePassword) return;
    try {
      await api.approvePasswordReset(confirmDeletePassword.memberId, groupId!);
      setToastMessage('合言葉を削除しました。');
      setConfirmDeletePassword(null);
      fetchMembers();
    } catch (e: any) {
      setToastMessage(e.message || e.error || '合言葉の削除に失敗しました。');
      setConfirmDeletePassword(null);
    }
  };

  const handleCleanupEvents = () => {
    setShowConfirmModal({
      isOpen: true,
      message: '過去に削除されたメンバーの参加情報を、開催前のイベントから一括で削除します。よろしいですか？',
      onConfirm: async () => {
        setShowConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          const result = await api.cleanupEvents(groupId!);
          setToastMessage(result.message);
        } catch (e: any) {
          setToastMessage(e.error || '処理に失敗しました。');
        }
      }
    });
  };

  const handleAnalyzeBulk = async () => {
    if (!bulkInput.trim()) { setToastMessage('名前を入力してください。'); return; }
    setBulkAnalyzing(true);
    try {
      const result = await api.analyzeBulkMembers(groupId!, bulkInput);
      setBulkAnalysis(result.analysisResults);

      const newResolutions: Record<string, string> = {};
      result.analysisResults.forEach((r: any) => {
        if (r.status === 'potential_match') {
          newResolutions[r.inputName] = 'skip';
        }
      });
      setBulkResolutions(newResolutions);

      setBulkStep(2);
    } catch (e: any) {
      setToastMessage(e.error || '分析に失敗しました。');
    } finally {
      setBulkAnalyzing(false);
    }
  };

  const handleFinalizeBulk = async () => {
    setBulkRegistering(true);
    const resolutions: any[] = [];

    bulkAnalysis.forEach(r => {
      if (r.status === 'new_registration') {
        resolutions.push({ inputName: r.inputName, action: 'create' });
      } else if (r.status === 'potential_match') {
        resolutions.push({ inputName: r.inputName, action: bulkResolutions[r.inputName] });
      }
    });

    try {
      const result = await api.finalizeBulkMembers(groupId!, resolutions);
      setToastMessage(`${result.createdCount}名のメンバーを新しく登録しました。`);
      setShowBulkModal(false);
      fetchMembers();
    } catch (e: any) {
      setToastMessage(e.error || '登録に失敗しました。');
    } finally {
      setBulkRegistering(false);
    }
  };

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const newRegs = bulkAnalysis.filter(r => r.status === 'new_registration');
  const exactMatches = bulkAnalysis.filter(r => r.status === 'exact_match');
  const potentialMatches = bulkAnalysis.filter(r => r.status === 'potential_match');

  if (loading) return <div>読み込み中...</div>;

  return (
    <div id="memberManagementView" className="view-container">
      <div className="event-header">
        <button onClick={() => navigate(`/admin/groups/${groupId}`)}>
          <ArrowLeft size={16} className="icon-inline mr-5" /> ダッシュボードに戻る
        </button>
      </div>
      <h2>メンバー管理</h2>
      <div className="controls">
        <div className="input-group">
          <label htmlFor="memberSearchInput" className="visually-hidden">メンバー名で検索</label>
          <input
            type="text"
            id="memberSearchInput"
            placeholder="メンバー名で検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button className="primary-action" onClick={() => { setAddMemberNameInput(''); setShowAddMemberModal(true); }}><Plus size={16} className="icon-inline mr-5" /> メンバー追加</button>
          <button id="bulkRegisterButton" onClick={() => { setBulkInput(''); setBulkStep(1); setShowBulkModal(true); }}>一括登録</button>
          <button className="secondary-btn hidden-element" onClick={handleCleanupEvents}>過去データ修正</button>
        </div>
      </div>
      <ul className="item-list">
        {filteredMembers.map(member => {
          const isActive = typeof member.isActive === 'boolean' ? member.isActive : true;
          return (
            <li key={member.id} className={`item-list-item member-list-item ${isActive ? '' : 'inactive'}`}>
              <div className="member-info">
                <input type="color" value={member.color || '#cccccc'} disabled />
                <span>{member.name}</span>
                {member.createdBy === 'admin' ? <span className="label admin">管理者登録</span> : <span className="label user">本人登録</span>}
              </div>
              <div className="item-buttons">
                <label className="switch">
                  <input type="checkbox" checked={isActive} onChange={e => handleToggleActive(member.id, e.target.checked)} />
                  <span className="slider"></span>
                </label>
                <button onClick={() => openEditModal(member)}>編集</button>
                <button className="delete-btn" onClick={() => handleDeleteMember(member.id, member.name)}>削除</button>
              </div>
            </li>
          );
        })}
      </ul>

      {showEditModal && (
        <div className="modal active">
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowEditModal(false)}><X size={20} /></span>
            <h3>メンバー編集</h3>
            <div className="input-group">
              <label>名前:</label>
              <input type="text" value={editMemberData.name} onChange={e => setEditMemberData({ ...editMemberData, name: e.target.value })} />
            </div>
            <div className="input-group">
              <label>カラー:</label>
              <input type="color" value={editMemberData.color || '#cccccc'} onChange={e => setEditMemberData({ ...editMemberData, color: e.target.value })} />
            </div>
            <div className="modal-actions">
              {!!editMemberData.password && (
                <button type="button" className="delete-btn action-left" onClick={() => setConfirmDeletePassword({ memberId: editMemberData.id, name: editMemberData.name })}>
                  合言葉削除
                </button>
              )}
              <button className="primary-action" onClick={handleSaveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="modal active">
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowBulkModal(false)}><X size={20} /></span>
            <h3>メンバーの一括登録</h3>

            {bulkStep === 1 ? (
              <div>
                <label>登録したいメンバーの名前を、改行・スペース・カンマ区切りでテキストエリアに貼り付けてください。</label>
                <textarea id="bulkNamesTextarea" rows={10} value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder="佐藤 太郎, 鈴木 一郎, ..."></textarea>
                <div className="modal-actions">
                  <button id="analyzeBulkButton" className="primary-action" onClick={handleAnalyzeBulk} disabled={bulkAnalyzing}>
                    {bulkAnalyzing ? '分析中...' : '確認する'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p>入力された名前を分析しました。内容を確認し、登録を実行してください。</p>
                <div className="scrollable-list-wrapper">
                  <h4>新規登録 ({newRegs.length})</h4>
                  <ul>{newRegs.map(r => <li key={r.inputName}>"{r.inputName}" を新規登録します。</li>)}</ul>

                  <h4>類似候補 ({potentialMatches.length})</h4>
                  <ul>
                    {potentialMatches.map((r, i) => (
                      <li key={r.inputName} className="mb-10">
                        <p><strong>"{r.inputName}"</strong> は、既存の <strong>"{r.suggestions[0].name}"</strong> と類似しています。</p>
                        <label>
                          <input type="radio" checked={bulkResolutions[r.inputName] === 'skip'} onChange={() => setBulkResolutions({ ...bulkResolutions, [r.inputName]: 'skip' })} />
                          同一人物として扱う (スキップ)
                        </label><br />
                        <label>
                          <input type="radio" checked={bulkResolutions[r.inputName] === 'create'} onChange={() => setBulkResolutions({ ...bulkResolutions, [r.inputName]: 'create' })} />
                          別人として新規登録する
                        </label>
                      </li>
                    ))}
                  </ul>

                  <h4>完全一致 (スキップ) ({exactMatches.length})</h4>
                  <ul>{exactMatches.map(r => <li key={r.inputName}>"{r.inputName}" は登録済みのためスキップします。</li>)}</ul>
                </div>

                <div className="modal-actions">
                  <button id="finalizeBulkButton" className="primary-action" onClick={handleFinalizeBulk} disabled={bulkRegistering}>
                    {bulkRegistering ? '登録処理中...' : 'この内容で登録を実行する'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDeletePassword && (
        <div className="modal active">
          <div className="modal-content max-w-400 text-center">
            <p className="confirm-message text-lg">
              メンバー「{confirmDeletePassword.name}」の合言葉を削除しますか？
            </p>
            <div className="modal-actions center gap-15">
              <button className="secondary-btn" onClick={() => setConfirmDeletePassword(null)}>キャンセル</button>
              <button className="primary-action danger" onClick={executeDeletePassword}>削除する</button>
            </div>
          </div>
        </div>
      )}

      {/* カスタム確認モーダル */}
      {showConfirmModal.isOpen && (
        <div className="modal active z-10001">
          <div className="modal-content max-w-400 text-center">
            <h3>確認</h3>
            <p className="confirm-message">{showConfirmModal.message}</p>
            <div className="modal-actions center gap-15">
              <button className="secondary-btn" onClick={() => setShowConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}>キャンセル</button>
              <button className="primary-action" onClick={showConfirmModal.onConfirm}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* メンバー追加入力モーダル */}
      {showAddMemberModal && (
        <div className="modal active z-10001">
          <div className="modal-content max-w-400">
            <h3>メンバー追加</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddMember(); }} className="input-group">
              <label>追加するメンバーの名前:</label>
              <input
                type="text"
                placeholder="名前を入力"
                value={addMemberNameInput}
                onChange={(e) => setAddMemberNameInput(e.target.value)}
                autoFocus
              />
            </form>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowAddMemberModal(false)}>キャンセル</button>
              <button className="primary-action" onClick={handleAddMember} disabled={!addMemberNameInput.trim()}>追加</button>
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
