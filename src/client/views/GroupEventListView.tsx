import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// @ts-ignore
import * as api from '../lib/api.js';
// @ts-ignore
import * as state from '../lib/state.js'; // ParticipantView(未移行)との状態共有のため一時的に残置
import { ArrowLeft, X } from 'lucide-react';

export const GroupEventListView: React.FC = () => {
  const { groupId, customUrl } = useParams<{ groupId?: string; customUrl?: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // パスワードモーダル用ステート
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const identifier = customUrl || groupId;
  const isCustomUrl = !!customUrl;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!identifier) return;

        let currentGroup;
        try {
          currentGroup = isCustomUrl 
            ? await api.getGroupByCustomUrl(identifier) 
            : await api.getGroup(identifier);
          setGroup(currentGroup);
          state.setCurrentGroupId(currentGroup.id);
        } catch (e: any) {
          setError('不明なグループのイベント一覧');
          setLoading(false);
          return;
        }

        try {
          const fetchedEvents = isCustomUrl 
            ? await api.getEventsByCustomUrl(identifier) 
            : await api.getPublicEventsForGroup(identifier);
          setEvents(fetchedEvents);
        } catch (e: any) {
          if (e.requiresPassword) {
            setShowPasswordModal(true);
          } else {
            setError(e.error || e.message);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [identifier, isCustomUrl]);

  if (loading) return <div className="loading-mask" style={{display: 'flex'}}>読み込み中...</div>;

  const groupName = group ? group.name : '不明なグループ';
  
  const handleBackClick = () => {
    if (state.currentUser) {
      if (group && group.id) {
        navigate(`/admin/groups/${group.id}`);
      } else {
        navigate('/admin/groups');
      }
    } else {
      if (group && group.customUrl) {
        navigate(`/g/${group.customUrl}/dashboard`);
      } else if (group && group.id) {
        navigate(`/groups/${group.id}/dashboard`);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div id="groupEventListView" className="view-container">
      <div className="event-header">
        {group && (
          <button 
            id="backToDashboardFromEventListButton" 
            className="button" 
            style={{background: 'none', border: 'none', color: 'var(--primary-color)', display: 'inline-flex', padding: 0}} 
            onClick={handleBackClick}
          >
            <ArrowLeft size={16} style={{marginRight: '5px'}}/> {state.currentUser ? '管理ダッシュボードに戻る' : 'ダッシュボードに戻る'}
          </button>
        )}
      </div>
      <h2 id="groupEventListName">{groupName} のイベント一覧</h2>
      <ul id="groupEventList" className="item-list">
        {error ? (
          <li className="error-message">{error}</li>
        ) : events.length === 0 ? (
          <li className="item-list-item">現在参加できるイベントはありません。</li>
        ) : (
          events.map(event => {
            const date = new Date((event.createdAt._seconds || event.createdAt.seconds) * 1000);
            const eventUrl = isCustomUrl ? `/g/${identifier}/${event.id}` : `/events/${event.id}`;
            return (
              <li key={event.id} className="item-list-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span><strong>{event.eventName || '無題のイベント'}</strong>（{date.toLocaleDateString()} 作成）</span>
                <a href={eventUrl} className="button primary-action" onClick={(e) => {
                  e.preventDefault();
                  navigate(eventUrl);
                }}>参加する</a>
              </li>
            );
          })
        )}
      </ul>

      {/* パスワード入力モーダル (React化) */}
      {showPasswordModal && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowPasswordModal(false)}>
              <X size={20} />
            </span>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setPasswordError('');
              try {
                // パスワードを送信してグループにログイン
                const res = await api.loginOrRegisterToGroup(identifier, null, passwordInput);
                state.saveParticipantState(res.token, res.memberId, res.name);
                setShowPasswordModal(false);
                window.location.reload(); // 成功したらリロードしてイベント一覧を再取得
              } catch (err: any) {
                setPasswordError(err.error || '合言葉が違います。');
              }
            }}>
              <h3>非公開グループ</h3>
              <p>このグループのイベント一覧を見るには合言葉が必要です。</p>
              <div className="input-group">
                <input 
                  type="password" 
                  placeholder="合言葉を入力" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                />
              </div>
              {passwordError && <p className="error-message" style={{color: 'var(--danger-color)'}}>{passwordError}</p>}
              <div className="modal-actions">
                <button type="submit" className="primary-action">確認</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
