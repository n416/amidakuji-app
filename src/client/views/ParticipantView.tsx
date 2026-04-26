import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// @ts-ignore
import * as api from '../lib/api.js';
// @ts-ignore
import * as state from '../lib/state.js';

import { ArrowLeft, PartyPopper, Hand, Pencil, Eraser } from 'lucide-react';
// @ts-ignore
import { prepareStepAnimation } from '../lib/animation.js';
// @ts-ignore
import { participantPanzoom, resetParticipantPanzoom } from '../lib/animation/setup.js';
// @ts-ignore
import { getVirtualWidth, getNameAreaHeight, calculatePrizeAreaHeight, getTargetHeight } from '../lib/animation/path.js';
// @ts-ignore
import { drawLotteryBase, drawDoodleHoverPreview, drawDoodlePreview } from '../lib/animation/drawing.js';

export const ParticipantView: React.FC = () => {
  const { eventId, customUrl } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<'nameEntry' | 'join' | 'staticAmida' | 'result'>('nameEntry');
  const [eventData, setEventData] = useState<any>(null);
  const [myMemberId, setMyMemberId] = useState<string>('');
  const [myName, setMyName] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');

  // Doodle and Canvas state
  const [doodleTool, setDoodleTool] = useState<'pan'|'draw'|'erase'>('pan');
  const [hoverDoodle, setHoverDoodle] = useState<any>(null);
  const [previewDoodle, setPreviewDoodle] = useState<any>(null);
  const [myResult, setMyResult] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setShowConfirmModal({ isOpen: true, message, onConfirm });
  };

  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  const actualEventId = eventId;
  const isShare = false; // Add share mode check if needed

  useEffect(() => {
    const init = async () => {
      try {
        let data;
        if (customUrl) {
          // fetch event by custom url
          data = await api.getPublicEventData(customUrl); // fallback if customUrl used
        } else {
          data = await api.getPublicEventData(actualEventId!);
        }
        
        setEventData(data);
        state.setCurrentLotteryData(data);
        state.setCurrentGroupId(data.groupId);
        
        state.loadParticipantState();
        if (state.currentParticipantId && state.currentParticipantToken) {
          setMyMemberId(state.currentParticipantId);
          setMyName(state.currentParticipantName);
          
          const participation = data.participants.find((p: any) => p.memberId === state.currentParticipantId);
          
          if (data.status === 'started') {
            setPhase('result');
          } else if (participation) {
            setPhase('staticAmida');
          } else {
            setPhase('join');
          }
        } else {
          setPhase('nameEntry');
        }

        if (!isShare) {
          const firestoreDb = (window as any).firebase.firestore();
          const unsubscribe = firestoreDb.collection('events').doc(actualEventId).onSnapshot(
            async (doc: any) => {
              if (!doc.exists) return;
              const updatedData = doc.data();
              
              setEventData((prev: any) => {
                if (prev?.status === 'pending' && updatedData.status === 'started') {
                  showToast('イベントが開始されました！結果発表です！');
                  setPhase('result');
                }
                
                if (updatedData.doodles && JSON.stringify(prev?.doodles) !== JSON.stringify(updatedData.doodles)) {
                  state.setCurrentLotteryData(updatedData);
                  if (staticCanvasRef.current) {
                    const ctx = staticCanvasRef.current.getContext('2d');
                    const storedState = participantPanzoom ? { pan: participantPanzoom.getPan(), scale: participantPanzoom.getScale() } : null;
                    prepareStepAnimation(ctx, true, false, false, storedState);
                  }
                }
                
                return updatedData;
              });
            },
            (error: any) => {
              console.error("Firestore listener error:", error);
            }
          );
          return () => unsubscribe();
        }
      } catch (err: any) {
        setError(err.error || 'イベントの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [actualEventId, customUrl]);

  useEffect(() => {
    const redrawStaticAmida = () => {
      if (phase === 'staticAmida' && staticCanvasRef.current && eventData) {
        state.setCurrentLotteryData(eventData);
        const ctx = staticCanvasRef.current.getContext('2d');
        if (ctx) {
          const storedState = participantPanzoom ? { pan: participantPanzoom.getPan(), scale: participantPanzoom.getScale() } : null;
          prepareStepAnimation(ctx, true, false, false, storedState).then(() => {
            if (participantPanzoom) {
              participantPanzoom.setOptions({
                disablePan: doodleTool !== 'pan',
                disableZoom: doodleTool !== 'pan'
              });
              const wrapper = document.getElementById('participant-panzoom-wrapper-static');
              if (wrapper) wrapper.style.cursor = doodleTool === 'pan' ? 'grab' : 'crosshair';
            }
          });
        }
      }
    };

    const redrawResultAmida = () => {
      if (phase === 'result' && resultCanvasRef.current && eventData) {
        state.setCurrentLotteryData(eventData);
        const ctx = resultCanvasRef.current.getContext('2d');
        if (ctx) {
          const storedState = participantPanzoom ? { pan: participantPanzoom.getPan(), scale: participantPanzoom.getScale() } : null;
          prepareStepAnimation(ctx, false, true, false, storedState).then(() => {
            if (participantPanzoom) {
              participantPanzoom.setOptions({ disablePan: false, disableZoom: false });
              const wrapper = document.getElementById('participant-panzoom-wrapper');
              if (wrapper) wrapper.style.cursor = 'grab';
            }
          });
          
          const participation = eventData.participants.find((p: any) => p.memberId === myMemberId);
          if (participation && eventData.results) {
            const resultPrizeIndex = eventData.results[participation.slot];
            const resultPrize = eventData.prizes[resultPrizeIndex];
            setMyResult(resultPrize ? resultPrize.name : 'ハズレ');
          }
        }
      }
    };

    redrawStaticAmida();
    redrawResultAmida();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          redrawStaticAmida();
          redrawResultAmida();
        }
      });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
    };
  }, [phase, eventData, myMemberId]); // Removed doodleTool from dependencies

  // Cleanup Panzoom only on component unmount
  useEffect(() => {
    return () => {
      resetParticipantPanzoom();
    };
  }, []);

  // Separate useEffect for updating Panzoom interaction mode without redrawing canvas
  useEffect(() => {
    if (phase === 'staticAmida' && participantPanzoom) {
      participantPanzoom.setOptions({
        disablePan: doodleTool !== 'pan',
        disableZoom: doodleTool !== 'pan'
      });
      const wrapper = document.getElementById('participant-panzoom-wrapper-static');
      if (wrapper) {
        wrapper.style.cursor = doodleTool === 'pan' ? 'grab' : 'crosshair';
      }
    }
  }, [doodleTool, phase]);

  // Handle doodle previews
  useEffect(() => {
    if (phase === 'staticAmida' && previewCanvasRef.current && staticCanvasRef.current) {
      const pCtx = previewCanvasRef.current.getContext('2d');
      const sCanvas = staticCanvasRef.current;
      if (pCtx) {
        const dpr = window.devicePixelRatio || 1;
        // Sync dimensions with static canvas
        previewCanvasRef.current.width = sCanvas.width;
        previewCanvasRef.current.height = sCanvas.height;
        previewCanvasRef.current.style.width = sCanvas.style.width;
        previewCanvasRef.current.style.height = sCanvas.style.height;
        
        pCtx.scale(dpr, dpr);
        pCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);

        if (hoverDoodle && doodleTool === 'draw') {
          drawDoodleHoverPreview(pCtx, hoverDoodle);
        }
        if (previewDoodle && doodleTool === 'draw') {
          drawDoodlePreview(pCtx, previewDoodle);
        }
      }
    }
  }, [hoverDoodle, previewDoodle, doodleTool, phase]); // Only redraw when preview data changes

  // Handle doodling
  const getDoodleDataFromEvent = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    if (!eventData) return null;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    if (participantPanzoom) {
      const scale = participantPanzoom.getScale();
      x = x / scale;
      y = y / scale;
    }

    const container = canvas.closest('.canvas-panzoom-container');
    if (!container) return null;

    const numParticipants = eventData.participants.length;
    const containerWidth = container.clientWidth || 800;
    const virtualWidth = getVirtualWidth(numParticipants, containerWidth);
    const participantSpacing = virtualWidth / (numParticipants + 1);

    const nameAreaHeight = getNameAreaHeight(container);
    const prizeAreaHeight = calculatePrizeAreaHeight(eventData.prizes);
    const targetHeight = getTargetHeight(container);

    const lineTopY = nameAreaHeight;
    const lineBottomY = targetHeight - prizeAreaHeight;
    const amidaDrawableHeight = lineBottomY - lineTopY;
    const sourceLineRange = 330 - 70; // 260

    if (y < lineTopY || y > lineBottomY) return null;

    let fromIndex = -1;
    for (let i = 0; i < numParticipants - 1; i++) {
      const startX = participantSpacing * (i + 1) + participantSpacing * 0.1;
      const endX = participantSpacing * (i + 2) - participantSpacing * 0.1;
      if (x > startX && x < endX) {
        fromIndex = i;
        break;
      }
    }

    if (fromIndex === -1) return null;

    const relativeY = y - lineTopY;
    const originalY = (relativeY / amidaDrawableHeight) * sourceLineRange + 70;
    
    return { fromIndex, toIndex: fromIndex + 1, y: originalY };
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!eventData?.allowDoodleMode || doodleTool !== 'draw' || !staticCanvasRef.current) return;
    const doodleData = getDoodleDataFromEvent(e, staticCanvasRef.current);
    setHoverDoodle(doodleData || null);
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!eventData?.allowDoodleMode || !staticCanvasRef.current) return;
    if (doodleTool === 'draw') {
      const doodleData = getDoodleDataFromEvent(e, staticCanvasRef.current);
      if (doodleData) setPreviewDoodle(doodleData);
    }
  };

  const handleCanvasClick = async (e: React.MouseEvent) => {
    if (!eventData?.allowDoodleMode || !staticCanvasRef.current) return;
    
    if (doodleTool === 'draw') {
      const doodleData = hoverDoodle || getDoodleDataFromEvent(e, staticCanvasRef.current);
      if (!doodleData) return;
      
      setPreviewDoodle(doodleData);
      try {
        await api.addDoodle(actualEventId!, myMemberId, doodleData);
        setPreviewDoodle(null);
      } catch (err: any) {
        if (err.error === '他の線に近すぎるため、線を引けません。') {
          showToast(err.error);
        } else {
          showToast(err.error || '線の追加に失敗しました。');
        }
        setPreviewDoodle(null);
      }
    } else if (doodleTool === 'erase') {
      const myDoodle = eventData.doodles?.find((d: any) => d.memberId === myMemberId);
      if (!myDoodle) return;
      try {
        await api.deleteDoodle(actualEventId!, myMemberId);
        setPreviewDoodle(null);
      } catch (err: any) {
        showToast(err.error || '線の削除に失敗しました。');
      }
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!nameInput.trim() || !eventData) return;
    
    try {
      const res = await api.joinEvent(actualEventId!, nameInput.trim());
      state.saveParticipantState(res.token, res.memberId, nameInput.trim());
      setMyMemberId(res.memberId);
      setMyName(nameInput.trim());
      
      if (res.status === 'event_full') {
        setLoginError('イベントが満員のため参加できませんでした。');
        setPhase('nameEntry');
      } else if (eventData.status === 'started') {
        setPhase('result');
      } else {
        setPhase('staticAmida');
      }
    } catch (err: any) {
      if (err.requiresPassword) {
        const pwd = prompt('合言葉を入力してください:');
        if (pwd) {
          try {
            const res2 = await api.verifyPasswordAndJoin(actualEventId!, err.memberId, pwd);
            state.saveParticipantState(res2.token, res2.memberId, nameInput.trim());
            setMyMemberId(res2.memberId);
            setMyName(nameInput.trim());
            const updatedParticipation = eventData.participants.find((p: any) => p.memberId === res2.memberId);
            setPhase(eventData.status === 'started' ? 'result' : (updatedParticipation ? 'staticAmida' : 'join'));
          } catch (err2: any) {
            setLoginError('合言葉が違います');
          }
        }
      } else {
        setLoginError(err.error || 'ログインに失敗しました');
      }
    }
  };

  const handleJoinSlot = async () => {
    if (selectedSlot === null || !eventData || !myMemberId) return;
    
    confirmAction(`参加枠 ${selectedSlot + 1} で参加しますか？`, async () => {
      setLoading(true);
      try {
        await api.joinSlot(actualEventId!, myMemberId, state.currentParticipantToken, selectedSlot);
        setPhase('staticAmida');
      } catch (err: any) {
        showToast(err.error || '参加に失敗しました');
      } finally {
        setLoading(false);
      }
      setShowConfirmModal({ ...showConfirmModal, isOpen: false });
    });
  };

  if (loading) return <div className="loading-mask" style={{display: 'flex'}}>読み込み中...</div>;
  if (error) return <div className="view-container"><h2 className="error-message">{error}</h2></div>;

  return (
    <div id="participantView" className="view-container">
      <h2 id="participantEventName">{eventData?.eventName || '無題のイベント'}</h2>
      <div className="event-header">
        <button 
          className="button" 
          style={{background: 'none', border: 'none', color: 'var(--primary-color)', display: 'inline-flex', padding: 0}}
          onClick={() => navigate(customUrl ? `/g/${customUrl}/dashboard` : `/groups/${eventData?.groupId}/dashboard`)}
        >
          <ArrowLeft size={16} style={{marginRight: '5px'}}/> ダッシュボードに戻る
        </button>
      </div>

      <div id="participantFlow">
        {phase === 'nameEntry' && (
          <div className="controls">
            <h3>イベントに参加</h3>
            <form onSubmit={handleNameSubmit} className="input-group">
              <input 
                type="text" 
                placeholder="あなたの名前を入力してください" 
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
              />
              <button type="submit" disabled={!nameInput.trim()}>OK</button>
            </form>
            {loginError && <p className="error-message" style={{color: 'var(--danger-color)'}}>{loginError}</p>}
          </div>
        )}

        {phase === 'join' && (
          <div id="joinSection">
            <div id="prizeDisplay">
              <h3>景品一覧</h3>
              <ul>
                {eventData?.prizes?.map((prize: any, idx: number) => (
                  <li key={idx}>{prize.count ? `${prize.name}: ${prize.count}個` : prize.name}</li>
                ))}
              </ul>
            </div>
            <div className="slot-selection-container">
              <h3>参加枠を選んでください</h3>
              <div id="slotList">
                {eventData?.participants?.map((p: any, idx: number) => {
                  const isTaken = !!p.name || !!p.memberId;
                  const isSelected = selectedSlot === p.slot;
                  return (
                    <div 
                      key={idx} 
                      className={`slot ${isTaken ? 'taken' : 'available'} ${isSelected ? 'selected' : ''}`}
                      onClick={() => !isTaken && setSelectedSlot(p.slot)}
                    >
                      {isTaken ? (p.name || '参加済み') : `参加枠 ${p.slot + 1}`}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="join-form">
              <button className="primary-action" disabled={selectedSlot === null} onClick={handleJoinSlot}>
                この枠で参加する
              </button>
            </div>
          </div>
        )}

        {phase === 'staticAmida' && (
          <div id="staticAmidaView" style={{textAlign: 'center'}}>
            <h3>参加登録済み</h3>
            <p>イベント開始までお待ちください。自分の参加枠とあみだくじの線を確認できます。</p>
            <div className="canvas-panzoom-container">
              <div className="loading-mask" id="participant-loading-mask-static" style={{display: 'none'}}>あみだくじを生成中...</div>
              <div className="panzoom-wrapper" id="participant-panzoom-wrapper-static" style={{ position: 'relative' }}>
                <canvas 
                  id="participantCanvasStatic" 
                  ref={staticCanvasRef}
                  style={{ display: 'block' }}
                ></canvas>
                <canvas 
                  id="participantCanvasPreview" 
                  ref={previewCanvasRef}
                  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: doodleTool === 'pan' ? 'none' : 'auto' }}
                  onMouseMove={handlePointerMove}
                  onTouchMove={handlePointerMove}
                  onMouseDown={handlePointerDown}
                  onTouchStart={handlePointerDown}
                  onClick={handleCanvasClick}
                  onMouseLeave={() => setHoverDoodle(null)}
                ></canvas>
              </div>
            </div>
            
            {eventData?.allowDoodleMode && (
              <div id="doodleControls">
                <div className="doodle-mode-switcher">
                  <button className={`doodle-mode-btn ${doodleTool === 'pan' ? 'active' : ''}`} onClick={() => { setDoodleTool('pan'); setHoverDoodle(null); setPreviewDoodle(null); }} title="移動モード"><Hand size={20}/></button>
                  <button className={`doodle-mode-btn ${doodleTool === 'draw' ? 'active' : ''}`} onClick={() => { setDoodleTool('draw'); setHoverDoodle(null); setPreviewDoodle(null); }} title="落書きモード"><Pencil size={20}/></button>
                  <button className={`doodle-mode-btn ${doodleTool === 'erase' ? 'active' : ''}`} onClick={() => { setDoodleTool('erase'); setHoverDoodle(null); setPreviewDoodle(null); }} title="消しゴムモード"><Eraser size={20}/></button>
                </div>
                <p>隣り合った縦線の間をクリックして横線を追加し、1本だけ線を引いて運命を変えよう！</p>
              </div>
            )}

            <div className="controls" style={{marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px'}}>
              <button className="delete-btn" onClick={async () => {
                confirmAction('参加を取り消しますか？', async () => {
                  try {
                    await api.deleteParticipant(actualEventId!, state.currentParticipantToken);
                    setPhase('join');
                    setSelectedSlot(null);
                    showToast('参加を取り消しました。');
                  } catch (e: any) {
                    showToast(e.error || '取り消しに失敗しました');
                  }
                  setShowConfirmModal({ ...showConfirmModal, isOpen: false });
                });
              }}>
                参加を取り消す
              </button>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div id="resultSection">
            <h3><PartyPopper size={24} /> 結果発表 <PartyPopper size={24} /></h3>
            <div className="canvas-panzoom-container">
              <div className="panzoom-wrapper" id="participant-panzoom-wrapper">
                <canvas id="participantCanvas" ref={resultCanvasRef}></canvas>
              </div>
            </div>
            {myResult && <p id="myResult" style={{fontSize: '1.2em', fontWeight: 'bold', marginTop: '20px'}}>あなたの結果: {myResult}</p>}
            <div id="allResultsContainer">
               {/* 共通のResult一覧をあとでコンポーネント化して配置します */}
            </div>
          </div>
        )}

      </div>

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
    </div>
  );
};
