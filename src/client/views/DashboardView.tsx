import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { X, ImagePlus, Star, Trash2, Settings, Trophy, Users } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [group, setGroup] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [passwordRequests, setPasswordRequests] = useState<any[]>([]);
  const [showStartedEvents, setShowStartedEvents] = useState(false);
  const [loading, setLoading] = useState(true);

  // Group Settings State
  const [settingsGroup, setSettingsGroup] = useState<any>(null);
  const [settingsData, setSettingsData] = useState({ name: '', customUrl: '', noIndex: false, password: '' });

  const [showPrizeMasterModal, setShowPrizeMasterModal] = useState(false);
  const [prizeMasters, setPrizeMasters] = useState<any[]>([]);
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterFile, setNewMasterFile] = useState<File | null>(null);
  const [newMasterFilePreview, setNewMasterFilePreview] = useState<string | null>(null);
  const [newMasterRank, setNewMasterRank] = useState('common');
  const [prizeMasterError, setPrizeMasterError] = useState('');

  // Cropper States
  const [cropTargetImage, setCropTargetImage] = useState<string | null>(null);
  const cropperImageRef = useRef<HTMLImageElement>(null);
  const cropperInstanceRef = useRef<any>(null);

  const [showPasswordRequestsModal, setShowPasswordRequestsModal] = useState(false);

  // UI States
  const [toastMessage, setToastMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const fetchData = async () => {
    if (!groupId) return;
    try {
      const [groupRes, eventsRes, requestsRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`, { credentials: 'include' }),
        fetch(`/api/groups/${groupId}/events`, { credentials: 'include' }),
        fetch(`/api/admin/groups/${groupId}/password-requests`, { credentials: 'include' })
      ]);

      if (groupRes.ok) {
        const data = await groupRes.json();
        setGroup(data);
      }
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (requestsRes.ok) setPasswordRequests(await requestsRes.json());
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

  useEffect(() => {
    if (cropTargetImage && cropperImageRef.current) {
      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy();
      }
      const Cropper = (window as any).Cropper;
      if (Cropper) {
        cropperInstanceRef.current = new Cropper(cropperImageRef.current, {
          aspectRatio: 1,
          viewMode: 1,
          background: false,
          autoCropArea: 1,
        });
      }
    }
    return () => {
      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy();
        cropperInstanceRef.current = null;
      }
    };
  }, [cropTargetImage]);

  const handleGroupSettings = () => {
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
      fetchData(); // Reload data
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
          setSettingsGroup((prev: any) => ({...prev, hasPassword: false}));
        } catch (e) {
          setToastMessage('合言葉の削除に失敗しました。');
        }
      }
    });
  };

  const loadPrizeMasters = async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/prize-masters`, { credentials: 'include' });
      if (res.ok) setPrizeMasters(await res.json());
    } catch (e) {}
  };

  const handlePrizeMaster = () => {
    loadPrizeMasters();
    setPrizeMasterError('');
    setShowPrizeMasterModal(true);
  };

  const handleAddPrizeMaster = async () => {
    if (!newMasterName.trim() || !newMasterFile) {
      setPrizeMasterError('賞品名と画像を選択してください');
      return;
    }
    setPrizeMasterError('');
    try {
      const buffer = await newMasterFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const resUrl = await fetch(`/api/groups/${groupId}/prize-masters/generate-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: newMasterFile.type, fileHash })
      });
      if (!resUrl.ok) throw new Error('Failed to get upload URL');
      const res = await resUrl.json();
      const { signedUrl, imageUrl } = res as any;
      const resUpload = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': newMasterFile.type }, body: newMasterFile });
      if (!resUpload.ok) throw new Error('Upload failed');

      const resAdd = await fetch(`/api/groups/${groupId}/prize-masters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMasterName, imageUrl, rank: newMasterRank })
      });
      if (!resAdd.ok) throw new Error('Failed to add master');

      setToastMessage('賞品マスターを追加しました。');
      setNewMasterName('');
      setNewMasterFile(null);
      setNewMasterFilePreview(null);
      setNewMasterRank('common');
      loadPrizeMasters();
    } catch (e) {
      setToastMessage('追加に失敗しました');
    }
  };

  const handleDeletePrizeMaster = (masterId: string) => {
    setConfirmDialog({
      message: 'この賞品マスターを削除しますか？',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/prize-masters/${masterId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId })
          });
          if (!res.ok) throw new Error('Failed to delete master');
          setToastMessage('削除しました');
          loadPrizeMasters();
        } catch (e) {
          setToastMessage('削除に失敗しました');
        }
      }
    });
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

  const handleApprovePasswordReset = (memberId: string, requestId: string) => {
    setConfirmDialog({
      message: 'このユーザーの合言葉を削除しますか？',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/members/${memberId}/approve-password-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, requestId })
          });
          if (!res.ok) throw new Error('Failed to approve');
          setToastMessage('合言葉を削除しました。');
          fetchData();
          if (passwordRequests.length <= 1) {
            setShowPasswordRequestsModal(false);
          }
        } catch (e) {
          setToastMessage('削除に失敗しました');
        }
      }
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setConfirmDialog({
      message: 'このイベントを削除しますか？元に戻せません。',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE', credentials: 'include' });
          if (!res.ok) throw new Error('Failed to delete event');
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
          const res = await fetch(`/api/events/${eventId}/copy`, { method: 'POST', credentials: 'include' });
          if (!res.ok) throw new Error('Failed to copy event');
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

      <div className="controls">
        <div id="userInfoDisplay" className="user-info-display">
          {user && user.anonymousName ? `ようこそ ${user.anonymousName} さん (id: ${user.id.substring(0, 8)}...)` : ''}
        </div>
        <button id="goToGroupSettingsButton" onClick={handleGroupSettings}><Settings size={18} /> グループ設定</button>
        <button id="goToPrizeMasterButton" onClick={handlePrizeMaster}><Trophy size={18} /> 賞品マスター管理</button>
        <button id="goToMemberManagementButton" onClick={handleMemberManagement}><Users size={18} /> メンバー管理</button>
        <button id="goToCreateEventViewButton" onClick={handleCreateEvent}>イベント新規作成</button>
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
                  <button className="edit-event-btn" onClick={(e) => { e.stopPropagation(); navigate(`/admin/event/${event.id}/edit`); }}>
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

      {/* Prize Master Modal */}
      {showPrizeMasterModal && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowPrizeMasterModal(false)}><X size={28} /></span>
            <h3>賞品マスター管理</h3>
            <p>よく使う賞品を登録しておくと、イベント作成時に簡単に呼び出せます。</p>
            
            <div className="prize-master-form">
              <div className="prize-master-image-dropzone">
                <label htmlFor="newMasterImageUpload">
                  <img id="addMasterPrizeImagePreview" src={newMasterFilePreview || undefined} alt="プレビュー" style={{display: newMasterFilePreview ? 'block' : 'none'}} />
                  <div id="addMasterPrizePlaceholder" style={{display: newMasterFilePreview ? 'none' : 'flex'}}>
                    <ImagePlus size={32} />
                    <span>クリックして画像を選択</span>
                  </div>
                </label>
                <input 
                  type="file" 
                  id="newMasterImageUpload" 
                  accept="image/*" 
                  className="visually-hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setCropTargetImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                      e.target.value = ''; // Reset input to allow selecting same file again
                    }
                  }}
                />
              </div>
              <div className="prize-master-inputs">
                <input type="text" id="addMasterPrizeNameInput" placeholder="新しい賞品名" value={newMasterName} onChange={e => setNewMasterName(e.target.value)} />
                <div className="prize-rank-selector" data-rank={newMasterRank}>
                  {['miss', 'uncommon', 'common', 'rare', 'epic'].map((rankValue, index) => {
                    const ranks = ['miss', 'uncommon', 'common', 'rare', 'epic'];
                    const currentIndex = ranks.indexOf(newMasterRank);
                    return (
                      <Star 
                        key={rankValue}
                        className={`lucide-star ${index <= currentIndex ? 'filled' : ''}`} 
                        onClick={() => setNewMasterRank(rankValue)}
                      />
                    );
                  })}
                </div>
                <button id="addMasterPrizeButton" className="primary-action" onClick={handleAddPrizeMaster}>マスターに追加</button>
              </div>
            </div>
            {prizeMasterError && <p className="error-message" style={{color: 'var(--error-color)', margin: '10px 0', textAlign: 'center'}}>{prizeMasterError}</p>}

            <ul id="prizeMasterList" className="item-list prize-master-list">
              {prizeMasters.map(pm => {
                const rankConfig: Record<string, { stars: number, label: string, color: string }> = {
                  'miss': { stars: 1, label: 'ハズレ', color: '#999' },
                  'uncommon': { stars: 2, label: 'アンコモン', color: '#4caf50' },
                  'common': { stars: 3, label: 'コモン', color: '#2196f3' },
                  'rare': { stars: 4, label: 'レア', color: '#9c27b0' },
                  'epic': { stars: 5, label: 'エピック', color: '#f44336' }
                };
                const config = rankConfig[pm.rank] || rankConfig['common'];
                
                return (
                  <li key={pm.id} className="item-list-item prize-master-item">
                    <img src={pm.imageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'} alt={pm.name} className="prize-master-image" />
                    <div className="prize-master-info">
                      <span className="prize-master-name">{pm.name}</span>
                      <div className="prize-master-rank" data-rank={pm.rank}>
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`lucide-star ${i < config.stars ? 'filled' : ''}`} 
                            style={i < config.stars ? { color: config.color, fill: config.color } : {}}
                            size={16}
                          />
                        ))}
                      </div>
                    </div>
                    <button className="delete-btn" onClick={() => handleDeletePrizeMaster(pm.id)}>
                      <Trash2 size={20} />
                    </button>
                  </li>
                );
              })}
              {prizeMasters.length === 0 && <li>登録されている賞品マスターはありません。</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Password Reset Requests Modal */}
      {showPasswordRequestsModal && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowPasswordRequestsModal(false)}><X size={28} /></span>
            <h3>合言葉リセット依頼</h3>
            <p>以下のユーザーが合言葉を忘れたため、リセット（削除）を依頼しています。</p>
            <ul className="item-list">
              {passwordRequests.map(req => (
                <li key={req.id} className="item-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{req.memberName}</span>
                  <button className="primary-action" onClick={() => handleApprovePasswordReset(req.memberId, req.id)}>削除を承認</button>
                </li>
              ))}
              {passwordRequests.length === 0 && <li>リセット依頼はありません。</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {cropTargetImage && (
        <div className="modal" style={{ display: 'block', zIndex: 4000 }}>
          <div className="modal-content large">
            <h3>画像の切り抜き</h3>
            <div className="cropper-container">
              <img ref={cropperImageRef} src={cropTargetImage} alt="Cropper" style={{ maxWidth: '100%' }} />
            </div>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setCropTargetImage(null)}>キャンセル</button>
              <button className="primary-action" onClick={() => {
                if (cropperInstanceRef.current) {
                  cropperInstanceRef.current.getCroppedCanvas({ width: 300, height: 300, imageSmoothingQuality: 'high' }).toBlob((blob: Blob) => {
                    const file = new File([blob], 'processed_image.png', { type: 'image/png' });
                    setNewMasterFile(file);
                    setNewMasterFilePreview(URL.createObjectURL(blob));
                    setCropTargetImage(null);
                  }, 'image/png');
                }
              }}>決定</button>
            </div>
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
    </div>
  );
};
