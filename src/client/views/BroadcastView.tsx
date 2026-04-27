import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../lib/api';
import { useDispatch } from 'react-redux';
import { setCurrentEventId, setCurrentGroupId, setCurrentLotteryData } from '../store/lotterySlice';
import { resetAdminPanzoom } from '../lib/animation/setup';
import { useAmidaAnimation } from '../hooks/useAmidaAnimation';
import { ArrowLeft, Maximize, SlidersHorizontal, X, PartyPopper } from 'lucide-react';

export const BroadcastView: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [eventData, setEventData] = useState<any>(null);
  const [groupData, setGroupData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [controlsDisabled, setControlsDisabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightUser, setHighlightUser] = useState('');
  
  // Real-time state from animation results
  const [revealedPrizes, setRevealedPrizes] = useState<any[]>([]);

  // カスタム確認モーダル・トースト
  const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [toastMessage, setToastMessage] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setShowConfirmModal({ isOpen: true, message, onConfirm });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!eventId) return;
        const data = await api.getEvent(eventId);
        setEventData(data);
        dispatch(setCurrentLotteryData(data));
        dispatch(setCurrentEventId(eventId));
        dispatch(setCurrentGroupId(data.groupId));
        
        try {
          const group = await api.getGroup(data.groupId);
          setGroupData(group);
        } catch(e){}
        
        setRevealedPrizes([]);

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [eventId]);

  const { prepareStep, start, stop, reset, advanceLine, isRunning, fadePrizes } = useAmidaAnimation({
    lotteryData: eventData,
    onRevealedPrizesChange: (prizes) => setRevealedPrizes([...prizes])
  });

  useEffect(() => {
    if (!loading && canvasRef.current) {
      const isStarted = eventData?.status === 'started';
      const allParticipants = eventData?.participants.filter((p: any) => p.name) || [];
      const noParticipants = allParticipants.length === 0;
      const hide = (isStarted && noParticipants) ? false : true;
      prepareStep(canvasRef, hide);
    }
  }, [loading, isFullscreen, eventData?.status, prepareStep]);

  useEffect(() => {
    return () => {
      resetAdminPanzoom();
    };
  }, []);

  useEffect(() => {
    return () => {
      resetAdminPanzoom();
    };
  }, []);

  const handleAnimationComplete = () => {
    setControlsDisabled(false);
  };

  const handleStartEvent = async () => {
    if (!eventId) return;
    confirmAction('イベントを開始しますか？\n開始後は新規参加ができなくなります。', async () => {
      setShowConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        await api.startEvent(eventId);
        const data = await api.getEvent(eventId);
        setEventData(data);
        dispatch(setCurrentLotteryData(data));
      } catch (e: any) {
        showToast(`エラー: ${e.error}`);
      }
    });
  };

  const url = groupData && groupData.customUrl ? `${window.location.origin}/g/${groupData.customUrl}/${eventId}` : `${window.location.origin}/events/${eventId}`;

  if (loading) return <div className="loading-mask global-loading-mask">読み込み中...</div>;

  const isPending = eventData?.status === 'pending';
  const allParticipants = eventData?.participants.filter((p: any) => p.name) || [];
  const noParticipants = allParticipants.length === 0;
  const uniqueParticipantNames = Array.from(new Set(allParticipants.map((p: any) => p.name))) as string[];

  return (
    <div id="broadcastView" className={`view-container ${isFullscreen ? 'fullscreen-active' : ''}`}>
      <div className="broadcast-header">
        <button id="backToDashboardButton" onClick={() => navigate(`/admin/event/${eventId}/edit`)}>
          <ArrowLeft size={16} className="mr-5" /> <span>編集画面に戻る</span>
        </button>
        <div className="broadcast-header-controls">
          <button id="toggleFullscreenButton" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize size={16} className="mr-5" /> <span>{isFullscreen ? '元のサイズに戻す' : '表示エリアを最大化'}</span>
          </button>
          {!isPending && (
            <button id="openSidebarButton" onClick={() => setSidebarOpen(true)}>
              <SlidersHorizontal size={16} className="mr-5" /> <span>設定</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="broadcast-layout">
        <p className="event-url-display">イベントURL: <a id="broadcastEventUrl" href={url} target="_blank" rel="noreferrer">{url}</a></p>
        
        <div className={`canvas-panzoom-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
          {isPending && (
            <div id="adminControls" className="floating-controls center-absolute">
              <button id="startEventButton" className="primary-action btn-large" onClick={handleStartEvent}>
                <PartyPopper size={24} className="mr-10" /> イベント開始！
              </button>
              <button 
                id="glimpseButton" 
                onMouseDown={() => fadePrizes(canvasRef, true)}
                onMouseUp={() => fadePrizes(canvasRef, false)}
                onMouseLeave={() => fadePrizes(canvasRef, false)}
                onTouchStart={(e) => { e.preventDefault(); fadePrizes(canvasRef, true); }}
                onTouchEnd={(e) => { e.preventDefault(); fadePrizes(canvasRef, false); }}
              >
                景品チラ見せ
              </button>
            </div>
          )}
          <div className="loading-mask" id="admin-loading-mask">あみだくじを生成中...</div>
          <div className="panzoom-wrapper" id="admin-panzoom-wrapper">
            <canvas id="adminCanvas" ref={canvasRef} width="800" height="400"></canvas>
          </div>
        </div>

        {!isFullscreen && revealedPrizes.length > 0 && (
          <div id="broadcastResultsContainer" className="controls w-100 mt-20">
            <ul id="broadcastResultsList" className="item-list">
              {revealedPrizes.map((r, idx) => {
                const prizeName = typeof r.prize === 'object' ? r.prize.name : r.prize;
                const prizeImageUrl = typeof r.prize === 'object' ? r.prize.imageUrl : null;
                return (
                  <li key={idx} className="item-list-item">
                    {prizeImageUrl && <img src={prizeImageUrl} alt={prizeName} className="result-prize-image large" /> }
                    <span>{r.participantName} → {prizeName}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {sidebarOpen && <div className="broadcast-sidebar-overlay is-visible" onClick={() => setSidebarOpen(false)}></div>}
        <aside id="broadcastSidebar" className={`broadcast-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
          <button className="close-sidebar-btn" aria-label="閉じる" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
          <h4>コントロールパネル</h4>
          <div className="broadcast-controls">
            {noParticipants && !isPending && (
              <p className="text-danger text-sm mb-10">
                ※ 参加者がいないため、アニメーションは実行できません（景品のみ公開されています）
              </p>
            )}
            <div className="control-group">
              <h5>全体進行</h5>
              <button 
                id="animateAllButton"
                disabled={controlsDisabled || noParticipants}
                onClick={async () => {
                  setControlsDisabled(true);
                  // 全結果を再生する時は全て未公開状態に戻す
                  setRevealedPrizes([]);
                  await reset(handleAnimationComplete);
                }}
              >全結果を再生</button>
              <button 
                disabled={controlsDisabled || noParticipants}
                onClick={() => {
                  setControlsDisabled(true);
                  advanceLine(() => setControlsDisabled(false));
                }}
              >一段ずつ進む</button>
            </div>
            <div className="control-group">
              <h5>個別演出</h5>
              <label>特定ユーザー:</label>
              <select value={highlightUser} onChange={e => setHighlightUser(e.target.value)} disabled={controlsDisabled || noParticipants}>
                <option value="">選択してください</option>
                {uniqueParticipantNames.map((name: string) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button 
                disabled={controlsDisabled || !highlightUser || noParticipants}
                onClick={async () => {
                  if (isRunning() || !highlightUser) return;
                  console.log('[BroadcastView] Starting animation for highlighted user:', highlightUser);
                  // 選択されたユーザーを revealedPrizes から除外し、再描画できるようにする
                  const newRevealed = revealedPrizes.filter(p => p.participantName !== highlightUser);
                  setRevealedPrizes(newRevealed);
                  
                  setControlsDisabled(true);
                  await start(canvasRef, [highlightUser], handleAnimationComplete, highlightUser);
                }}
              >選択した人を表示</button>
              <button 
                disabled={controlsDisabled || noParticipants}
                onClick={async () => {
                  if (isRunning()) return;
                  const revealedNames = new Set(revealedPrizes.map(p => p.participantName));
                  const remaining = allParticipants.filter((p: any) => !revealedNames.has(p.name));
                  if (remaining.length === 0) return;
                  const rand = remaining[Math.floor(Math.random() * remaining.length)];
                  setHighlightUser(rand.name);
                  console.log('[BroadcastView] Starting animation for random user:', rand.name);
                  // 選択されたユーザーを revealedPrizes から除外する
                  const newRevealed = revealedPrizes.filter(p => p.participantName !== rand.name);
                  setRevealedPrizes(newRevealed);
                  
                  setControlsDisabled(true);
                  await start(canvasRef, [rand.name], handleAnimationComplete, rand.name);
                }}
              >ランダムに一人表示</button>
            </div>
          </div>
        </aside>
      </div>

      {/* 確認モーダル */}
      {showConfirmModal.isOpen && (
        <div className="modal active">
          <div className="modal-content max-w-400 text-center">
            <h3>確認</h3>
            <p className="confirm-message">{showConfirmModal.message}</p>
            <div className="modal-actions center gap-15">
              <button className="secondary-btn" onClick={() => setShowConfirmModal(prev => ({ ...prev, isOpen: false }))}>キャンセル</button>
              <button className="primary-action" onClick={showConfirmModal.onConfirm}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* トースト通知 */}
      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
