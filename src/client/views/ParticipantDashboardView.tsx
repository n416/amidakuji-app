import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../lib/api';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCurrentGroupId } from '../store/lotterySlice';
import { setParticipantSession, clearParticipantSession } from '../store/participantSlice';
import { LogOut, Trash2, Edit3, Key, PartyPopper, Gift, AlertTriangle, ArrowLeft, ImagePlus, X, Lock } from 'lucide-react';

export const ParticipantDashboardView: React.FC = () => {
  const { groupId, customUrl } = useParams<{ groupId?: string; customUrl?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const participantSession = useSelector((state: RootState) => state.participant);

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [participantId, setParticipantId] = useState('');

  // Local UI state
  const [nameInput, setNameInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showAcknowledged, setShowAcknowledged] = useState(() => {
    return localStorage.getItem('showAcknowledgedEvents') === 'true';
  });

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileColorInput, setProfileColorInput] = useState('#000000');
  const [profileIconUrlInput, setProfileIconUrlInput] = useState<string | null>(null);
  const [newIconFile, setNewIconFile] = useState<File | null>(null);
  const [newIconFilePreview, setNewIconFilePreview] = useState<string | null>(null);
  const [cropTargetImage, setCropTargetImage] = useState<string | null>(null);

  const cropperImageRef = useRef<HTMLImageElement>(null);
  const cropperInstanceRef = useRef<any>(null);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [participantHasPassword, setParticipantHasPassword] = useState(false);

  // メンバーログイン用合言葉モーダル
  const [showMemberPasswordModal, setShowMemberPasswordModal] = useState(false);
  const [memberPasswordInput, setMemberPasswordInput] = useState('');
  const [pendingLoginName, setPendingLoginName] = useState('');

  // グループ合言葉入力用ステート
  const [showGroupPasswordModal, setShowGroupPasswordModal] = useState(false);
  const [groupPasswordInput, setGroupPasswordInput] = useState('');
  const [groupPasswordError, setGroupPasswordError] = useState('');

  // Custom Toast and Confirm Modals
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setShowConfirmModal({ isOpen: true, message, onConfirm });
  };

  const identifier = customUrl || groupId;
  const isCustomUrl = !!customUrl;

  useEffect(() => {
    localStorage.setItem('showAcknowledgedEvents', String(showAcknowledged));
  }, [showAcknowledged]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!identifier) return;

      const groupData = isCustomUrl 
        ? await api.getGroupByCustomUrl(identifier) 
        : await api.getGroup(identifier);
      
      setGroup(groupData);
      dispatch(setCurrentGroupId(groupData.id));

      const fetchedEvents = await api.getPublicEventsForGroup(groupData.id);
      setEvents(fetchedEvents);

      if (participantSession.memberId && participantSession.token) {
        setIsLoggedIn(true);
        setParticipantName(participantSession.name || '');
        setParticipantId(participantSession.memberId);
        
        // Load additional participant info (color, iconUrl) via API
        try {
          const participantInfo = await api.getMemberDetails(groupData.id, participantSession.memberId);
          if (participantInfo) {
            setProfileColorInput(participantInfo.color || '#000000');
            setProfileIconUrlInput(participantInfo.iconUrl || null);
            setParticipantHasPassword(participantInfo.hasPassword || false);
          }
        } catch (e) {
          console.error('Failed to load member details', e);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (e: any) {
      // グループの合言葉が必要な場合はモーダルを表示
      if (e.requiresPassword) {
        setShowGroupPasswordModal(true);
      } else {
        setError(e.error || e.message || 'ダッシュボードの読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [identifier, isCustomUrl]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!nameInput.trim() || !group) return;
    
    try {
      const res = await api.loginOrRegisterToGroup(group.id, nameInput.trim());
      dispatch(setParticipantSession({ token: res.token, memberId: res.memberId, name: nameInput.trim(), groupId: group.id }));
      setIsLoggedIn(true);
      setParticipantName(nameInput.trim());
      setParticipantId(res.memberId);
      setNameInput('');
      fetchDashboardData(); // Refresh events to show join status
    } catch (err: any) {
      if (err.requiresPassword) {
        setPendingLoginName(nameInput.trim());
        setShowMemberPasswordModal(true);
      } else {
        setLoginError(err.error || 'ログインに失敗しました');
      }
    }
  };

  const handleMemberLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLoginName || !group) return;
    try {
      const res2 = await api.loginOrRegisterToGroup(group.id, pendingLoginName, memberPasswordInput);
      dispatch(setParticipantSession({ token: res2.token, memberId: res2.memberId, name: pendingLoginName, groupId: group.id }));
      setIsLoggedIn(true);
      setParticipantName(pendingLoginName);
      setParticipantId(res2.memberId);
      setNameInput('');
      setMemberPasswordInput('');
      setShowMemberPasswordModal(false);
      fetchDashboardData();
    } catch (err2: any) {
      setLoginError(err2.error || '合言葉が違います');
      setShowMemberPasswordModal(false); // Close modal and show error in main form
    }
  };

  const handleLogout = () => {
    confirmAction('ログアウトしますか？', () => {
      dispatch(clearParticipantSession());
      setIsLoggedIn(false);
      setParticipantName('');
      setParticipantId('');
      setShowConfirmModal(prev => ({ ...prev, isOpen: false }));
    });
  };

  const handleDeleteAccount = async () => {
    if (!group) return;
    confirmAction('本当にアカウントを削除しますか？\n（参加中のイベントからも名前が消えます）', async () => {
      try {
        await api.deleteMemberAccount(group.id, participantId, participantSession.token!);
        showToast('アカウントを削除しました。');
        dispatch(clearParticipantSession());
        setIsLoggedIn(false);
        setParticipantName('');
        setParticipantId('');
      } catch (err: any) {
        showToast(err.error || '削除に失敗しました');
      }
      setShowConfirmModal({ ...showConfirmModal, isOpen: false });
    });
  };

  const handleSaveProfile = async () => {
    if (!profileNameInput.trim() || !group) return;
    setLoading(true);
    try {
      let iconUrlToSave = profileIconUrlInput;
      if (newIconFile) {
        const buffer = await newIconFile.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const fileHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const resUrl = await api.generateUploadUrl(participantId, newIconFile.type, fileHash, participantSession.token!);
        if (resUrl && resUrl.signedUrl) {
          const resUpload = await fetch(resUrl.signedUrl, { method: 'PUT', headers: { 'Content-Type': newIconFile.type }, body: newIconFile });
          if (!resUpload.ok) throw new Error('画像のアップロードに失敗しました');
          iconUrlToSave = resUrl.imageUrl;
        }
      }

      await api.updateProfile(participantId, { name: profileNameInput.trim(), color: profileColorInput, iconUrl: iconUrlToSave }, group.id, participantSession.token!);
      dispatch(setParticipantSession({ name: profileNameInput.trim() }));
      setParticipantName(profileNameInput.trim());
      setShowProfileModal(false);
      setNewIconFile(null);
      setNewIconFilePreview(null);
      showToast('プロフィールを保存しました。');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.error || 'プロフィールの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    setLoading(true);
    try {
      await api.setPassword(participantId, newPasswordInput, group.id, participantSession.token!);
      showToast('合言葉を設定しました。');
      setShowPasswordModal(false);
      setNewPasswordInput('');
      setParticipantHasPassword(!!newPasswordInput);
    } catch (err: any) {
      showToast(err.error || '合言葉の設定に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePassword = () => {
    if (!group) return;
    confirmAction('合言葉を削除しますか？\n（誰でもこのアカウントを利用できるようになります）', async () => {
      setLoading(true);
      try {
        await api.setPassword(participantId, '', group.id, participantSession.token!);
        showToast('合言葉を削除しました。');
        setShowPasswordModal(false);
        setParticipantHasPassword(false);
        setNewPasswordInput('');
      } catch (err: any) {
        showToast(err.error || '合言葉の削除に失敗しました');
      } finally {
        setLoading(false);
        setShowConfirmModal({ ...showConfirmModal, isOpen: false });
      }
    });
  };

  if (loading) return <div className="loading-mask" style={{display: 'flex'}}>読み込み中...</div>;
  if (error) return <div className="view-container"><h2 className="error-message">{error}</h2></div>;

  const eventsToRender = events.filter((event) => {
    const myParticipation = participantId ? event.participants.find((p: any) => p.memberId === participantId) : null;
    const isStarted = event.status === 'started';

    if (isStarted && myParticipation && !myParticipation.acknowledgedResult) return true;
    if (showAcknowledged) return true;
    return !isStarted;
  });

  return (
    <div className="view-container">
      <div className="event-header">
        <button className="button" style={{background: 'none', border: 'none', color: 'var(--primary-color)', display: 'inline-flex', padding: 0}} onClick={() => navigate(group.customUrl ? `/g/${group.customUrl}` : `/groups/${group.id}`)}>
          <ArrowLeft size={16} style={{marginRight: '5px'}}/> イベント一覧に戻る
        </button>
      </div>
      <h2>{group?.name} のダッシュボード</h2>

      <div id="participantFlow">
        {!isLoggedIn ? (
          <div className="controls">
            <h3>イベントに参加 / ログイン</h3>
            <form onSubmit={handleLogin} className="input-group">
              <label htmlFor="nameInput" className="visually-hidden">あなたの名前</label>
              <input 
                type="text" 
                placeholder="あなたの名前を入力してください" 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
              <button type="submit" disabled={!nameInput.trim()}>OK</button>
            </form>
            {loginError && <p className="error-message" style={{color: 'var(--danger-color)'}}>{loginError}</p>}
          </div>
        ) : (
          <div className="controls participant-dashboard">
            <h3>ようこそ、<span>{participantName}</span> さん</h3>
            <div className="setting-group">
              <h4 className="setting-group-title">アカウント設定</h4>
              <div className="setting-group-buttons">
                <button className="secondary-btn" onClick={() => { setProfileNameInput(participantName); setShowProfileModal(true); }}>
                  <Edit3 size={16}/> プロフィール編集
                </button>
                <button className="secondary-btn" onClick={() => { setNewPasswordInput(''); setShowPasswordModal(true); }}>
                  <Key size={16}/> 合言葉を設定
                </button>
              </div>
            </div>
            <div className="danger-zone">
              <button className="secondary-btn" onClick={handleLogout}><LogOut size={16}/> ログアウト</button>
              <button className="secondary-btn danger" onClick={handleDeleteAccount}><Trash2 size={16}/> アカウントを削除</button>
            </div>
          </div>
        )}

        <div className="controls" style={{marginTop: '20px'}}>
          <div className="list-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h4>イベント一覧</h4>
            <div className="input-group checkbox-group" style={{marginBottom: '0'}}>
              <input 
                type="checkbox" 
                id="showAcknowledged" 
                checked={showAcknowledged}
                onChange={(e) => setShowAcknowledged(e.target.checked)}
              />
              <label htmlFor="showAcknowledged">終了済みを表示する</label>
            </div>
          </div>
          
          <ul className="item-list">
            {eventsToRender.length === 0 ? (
              <li className="item-list-item">現在表示できるイベントはありません。</li>
            ) : (
              eventsToRender.map(event => {
                const date = new Date((event.createdAt._seconds || event.createdAt.seconds) * 1000);
                const eventUrl = group.customUrl ? `/g/${group.customUrl}/${event.id}` : `/events/${event.id}`;
                const myParticipation = participantId ? event.participants.find((p: any) => p.memberId === participantId) : null;
                
                let badge = null;
                if (event.status === 'started' && myParticipation && !myParticipation.acknowledgedResult) {
                  badge = <span className="badge result-ready"><PartyPopper size={12}/> 結果発表！</span>;
                } else if (event.status === 'pending') {
                  if (myParticipation) {
                    badge = <span className="badge joined">参加登録済</span>;
                  } else {
                    const isFull = event.participants.every((p: any) => p.name !== null);
                    if (isFull) {
                      badge = <span className="badge full">満員御礼</span>;
                    } else {
                      badge = <span className="badge ongoing">開催中</span>;
                    }
                  }
                }

                return (
                  <li key={event.id} className="item-list-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span><strong>{event.eventName || '無題のイベント'}</strong> {badge}</span>
                    <button className="button" onClick={() => navigate(eventUrl)}>
                      {event.status === 'started' ? '結果を見る' : '参加する'}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      {/* グループ合言葉入力モーダル */}
      {showGroupPasswordModal && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content">
            <div className="password-entry-container">
              <Lock size={48} className="password-icon" />
              <h3>{group?.name || 'グループ'}の合言葉</h3>
              <p>このグループのダッシュボードにアクセスするには合言葉が必要です。</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setGroupPasswordError('');
                if (!groupPasswordInput.trim() || !group) return;
                try {
                  await api.verifyGroupPassword(group.id, groupPasswordInput.trim());
                  setShowGroupPasswordModal(false);
                  setGroupPasswordInput('');
                  // Cookie設定済み → 再読込
                  fetchDashboardData();
                } catch (err: any) {
                  setGroupPasswordError(err.error || '合言葉が違います。');
                }
              }} className="input-group">
                <input
                  type="password"
                  placeholder="合言葉を入力"
                  value={groupPasswordInput}
                  onChange={(e) => setGroupPasswordInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={!groupPasswordInput.trim()}>認証</button>
              </form>
              {groupPasswordError && <p className="error-message">{groupPasswordError}</p>}
            </div>
          </div>
        </div>
      )}

      {/* メンバーログイン用合言葉入力モーダル */}
      {showMemberPasswordModal && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowMemberPasswordModal(false)}>
              <X size={24} />
            </span>
            <h3>本人確認</h3>
            <p><strong>{pendingLoginName}</strong> さんの合言葉を入力してください。</p>
            <form onSubmit={handleMemberLoginSubmit} className="input-group">
              <input
                type="password"
                placeholder="合言葉を入力"
                value={memberPasswordInput}
                onChange={(e) => setMemberPasswordInput(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button type="submit" className="primary-action" disabled={!memberPasswordInput}>ログイン</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowProfileModal(false)}>
              <X size={24} />
            </span>
            <h3>プロフィール編集</h3>
            <div className="prize-master-form" style={{marginBottom: '15px'}}>
              <div className="prize-master-image-dropzone" style={{margin: '0 auto'}}>
                <label htmlFor="newProfileImageUpload">
                  <img id="profileImagePreview" src={newIconFilePreview || profileIconUrlInput || undefined} alt="プレビュー" style={{display: (newIconFilePreview || profileIconUrlInput) ? 'block' : 'none'}} />
                  <div id="profileImagePlaceholder" style={{display: (newIconFilePreview || profileIconUrlInput) ? 'none' : 'flex'}}>
                    <ImagePlus size={32} />
                    <span>クリックして画像を選択</span>
                  </div>
                </label>
                <input 
                  type="file" 
                  id="newProfileImageUpload" 
                  accept="image/*" 
                  className="visually-hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setCropTargetImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                      e.target.value = ''; 
                    }
                  }}
                />
              </div>
            </div>
            <div className="input-group">
              <label>名前:</label>
              <input type="text" value={profileNameInput} onChange={e => setProfileNameInput(e.target.value)} />
            </div>
            <div className="input-group">
              <label>カラー:</label>
              <input type="color" value={profileColorInput} onChange={e => setProfileColorInput(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="primary-action" onClick={handleSaveProfile} disabled={!profileNameInput.trim()}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowPasswordModal(false)}><X size={24} /></span>
            <h3>合言葉の設定</h3>
            <p>合言葉を設定すると、他の人があなたのアカウントを使うのを防げます。</p>
            <div className="input-group">
              <label>新しい合言葉:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="password" 
                  value={newPasswordInput} 
                  onChange={e => setNewPasswordInput(e.target.value)} 
                  placeholder={participantHasPassword ? "変更する場合は入力" : "新しい合言葉"}
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => setNewPasswordInput('')}
                  title="入力をクリア"
                >
                  クリア
                </button>
              </div>
            </div>
            <div className="modal-actions" style={{marginTop: '20px'}}>
              {participantHasPassword && (
                <button 
                  type="button" 
                  className="delete-btn action-left" 
                  onClick={handleDeletePassword} 
                >
                  合言葉削除
                </button>
              )}
              <button className="primary-action" onClick={handleSetPassword} disabled={!newPasswordInput.trim()}>
                {participantHasPassword ? "変更を保存" : "設定を保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal.isOpen && (
        <div className="modal" style={{display: 'block', zIndex: 10000}}>
          <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center'}}>
            <h3>確認</h3>
            <p style={{whiteSpace: 'pre-wrap'}}>{showConfirmModal.message}</p>
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

      {cropTargetImage && (
        <div className="modal" style={{ display: 'block', zIndex: 11000 }}>
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
                    const file = new File([blob], 'profile_image.png', { type: 'image/png' });
                    setNewIconFile(file);
                    setNewIconFilePreview(URL.createObjectURL(blob));
                    setCropTargetImage(null);
                  }, 'image/png');
                }
              }}>決定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
