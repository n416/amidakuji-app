import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../lib/api';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestoreDb } from '../lib/firebaseSetup';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setParticipantSession, clearParticipantSession } from '../store/participantSlice';
import { setCurrentGroupId, setCurrentLotteryData } from '../store/lotterySlice';
import { ArrowLeft, PartyPopper, Hand, Pencil, Eraser, Gift, Lock, X } from 'lucide-react';
import { useAmidaAnimation } from '../hooks/useAmidaAnimation';
import { participantPanzoom, resetParticipantPanzoom } from '../lib/animation/setup';
import { getVirtualWidth, getNameAreaHeight, calculatePrizeAreaHeight, getTargetHeight } from '../lib/animation/path';
import { drawLotteryBase, drawDoodleHoverPreview, drawDoodlePreview } from '../lib/animation/drawing';

export const ParticipantView: React.FC = () => {
  const { eventId, customUrl, participantName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const participantSession = useSelector((state: RootState) => state.participant);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [phase, setPhase] = useState<'nameEntry' | 'join' | 'staticAmida' | 'result' | 'passwordEntry'>('nameEntry');
  const [eventData, setEventData] = useState<any>(null);
  const [myMemberId, setMyMemberId] = useState<string>('');
  const [myName, setMyName] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>(participantSession.name || '');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');

  // グループ合言葉関連のstate
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordGroupId, setPasswordGroupId] = useState('');
  const [passwordGroupName, setPasswordGroupName] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Doodle and Canvas state
  const [doodleTool, setDoodleTool] = useState<'pan'|'draw'|'erase'>('pan');
  const [hoverDoodle, setHoverDoodle] = useState<any>(null);
  const [previewDoodle, setPreviewDoodle] = useState<any>(null);
  const [myResult, setMyResult] = useState<React.ReactNode>('');
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);
  const [showAllTracers, setShowAllTracers] = useState(false);

  // Participant login state
  const [showMemberPasswordModal, setShowMemberPasswordModal] = useState(false);
  const [memberPasswordInput, setMemberPasswordInput] = useState('');
  const [pendingLoginId, setPendingLoginId] = useState('');
  const [pendingLoginName, setPendingLoginName] = useState('');

  // Share fallback state
  const [shareFallbackUrl, setShareFallbackUrl] = useState('');

  // Modal and toast
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
  const staticPanzoomWrapperRef = useRef<HTMLDivElement>(null);
  const resultPanzoomWrapperRef = useRef<HTMLDivElement>(null);
  const hasAnimatedResult = useRef(false);

  const actualEventId = eventId;
  const isShare = !!participantName;

  const { isPreparing, prepareStep, start, isRunning, clear, setAnimatorState } = useAmidaAnimation({ lotteryData: eventData });

  useEffect(() => {
    const init = async () => {
      try {
        let data;
        if (isShare) {
          data = await api.getPublicShareData(actualEventId!, participantName);
        } else if (customUrl) {
          data = await api.getPublicEventData(customUrl, participantSession.memberId, participantSession.token);
        } else {
          data = await api.getPublicEventData(actualEventId!, participantSession.memberId, participantSession.token);
        }
        
        setEventData(data);
        dispatch(setCurrentLotteryData(data));
        dispatch(setCurrentGroupId(data.groupId));
        setAnimatorState({ lotteryData: data });
        
        if (data.status === 'started' && data.results) {
          setAnimatorState({ revealedPrizes: [] });
        } else {
          setAnimatorState({ revealedPrizes: [] });
        }

        if (isShare) {
          if (data.status === 'started') {
            setPhase('result');
          } else {
            setPhase('staticAmida');
          }
        } else if (participantSession.memberId && participantSession.token && participantSession.groupId === data.groupId) {
          setMyMemberId(participantSession.memberId);
          setMyName(participantSession.name || '');
          
          const participation = data.participants.find((p: any) => p.memberId === participantSession.memberId);
          
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
          const unsubscribe = onSnapshot(doc(firestoreDb, 'events', actualEventId!),
            async (docSnap: any) => {
              if (!docSnap.exists()) return;
              const updatedData = docSnap.data();
              
              setEventData(updatedData);
            },
            (error: any) => {
              console.error("Firestore listener error:", error);
            }
          );
          return () => unsubscribe();
        }
      } catch (err: any) {
        // グループ合言葉が必要な場合は合言葉入力フェーズに遷移
        if (err.requiresPassword && err.groupId) {
          setPasswordGroupId(err.groupId);
          setPasswordGroupName(err.groupName || '');
          setPhase('passwordEntry');
        } else {
          setError(err.error || 'イベントの読み込みに失敗しました');
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [actualEventId, customUrl]);

  const prevEventDataRef = useRef<any>(null);
  useEffect(() => {
    if (!eventData) return;
    const prev = prevEventDataRef.current;
    
    if (prev?.status === 'pending' && eventData.status === 'started') {
      showToast('イベントが開始されました！結果発表です！');
      setPhase('result');
    }
    
    if (eventData.doodles && JSON.stringify(prev?.doodles) !== JSON.stringify(eventData.doodles)) {
      dispatch(setCurrentLotteryData(eventData));
      setAnimatorState({ lotteryData: eventData });
      if (staticCanvasRef.current) {
        const storedState = participantPanzoom ? { pan: participantPanzoom.getPan(), scale: participantPanzoom.getScale() } : null;
        prepareStep(staticCanvasRef, true, false, false, storedState);
      }
    }
    
    prevEventDataRef.current = eventData;
  }, [eventData, dispatch, setAnimatorState, prepareStep]);

  useEffect(() => {
    const redrawStaticAmida = () => {
      if (phase === 'staticAmida' && staticCanvasRef.current && eventData) {
        dispatch(setCurrentLotteryData(eventData));
        setAnimatorState({ lotteryData: eventData });
        const ctx = staticCanvasRef.current.getContext('2d');
        if (ctx) {
          const storedState = participantPanzoom ? { pan: participantPanzoom.getPan(), scale: participantPanzoom.getScale() } : null;
          prepareStep(staticCanvasRef, true, false, false, storedState).then(() => {
            if (participantPanzoom) {
              participantPanzoom.setOptions({
                disablePan: doodleTool !== 'pan',
                disableZoom: doodleTool !== 'pan'
              });
              const wrapper = staticPanzoomWrapperRef.current;
              if (wrapper) wrapper.style.cursor = doodleTool === 'pan' ? 'grab' : 'crosshair';
            }
          });
        }
      }
    };

    const redrawResultAmida = () => {
      if (phase === 'result' && resultCanvasRef.current && eventData) {
        dispatch(setCurrentLotteryData(eventData));
        setAnimatorState({ lotteryData: eventData });
        const ctx = resultCanvasRef.current.getContext('2d');
        if (ctx) {
          const participation = eventData.participants.find((p: any) => p.memberId === myMemberId);
          const targetName = isShare ? participantName : (participation ? participation.name : null);

          if (!hasAnimatedResult.current) {
            hasAnimatedResult.current = true;
            setIsAnimationFinished(false);
            if (targetName) {
              setMyResult(<div className="text-center text-xl"><b>{targetName}さんの結果をアニメーションで確認中...</b></div>);
            } else {
              setMyResult(<div className="text-center text-xl"><b>結果を読み込んでいます...</b></div>);
            }

            const onAnimationComplete = () => {
              setIsAnimationFinished(true);
              if (participantPanzoom) {
                participantPanzoom.setOptions({ disablePan: false, disableZoom: false });
                const wrapper = resultPanzoomWrapperRef.current;
                if (wrapper) wrapper.style.cursor = 'grab';
              }
              if (targetName && eventData.results) {
                const resultObj = eventData.results[targetName];
                if (resultObj) {
                  const prize = resultObj.prize;
                  const prizeName = typeof prize === 'object' ? prize.name : prize;
                  const prizeImageUrl = typeof prize === 'object' ? prize.imageUrl : null;
                  const rank = typeof prize === 'object' ? prize.rank : 'uncommon';
                  
                  let prefixMsg = 'おめでとうございます！';
                  let msgColor = '#333';
                  if (rank === 'epic') {
                    prefixMsg = '超大当たり！！おめでとうございます！！！';
                    msgColor = '#eab308'; // yellow-500
                  } else if (rank === 'rare') {
                    prefixMsg = '大当たり！おめでとうございます！！';
                    msgColor = '#ef4444'; // red-500
                  } else if (rank === 'common') {
                    prefixMsg = '当たり！おめでとうございます！';
                    msgColor = '#3b82f6'; // blue-500
                  } else if (rank === 'miss') {
                    prefixMsg = '残念…';
                    msgColor = '#6b7280'; // gray-500
                  }
                  
                  setMyResult(
                    <div className="text-center">
                      <div className={`result-message-title ${rank === 'epic' ? 'text-warning' : rank === 'rare' ? 'text-danger' : rank === 'common' ? 'text-primary' : 'text-muted'} mb-15 font-bold text-2xl`}>{prefixMsg}</div>
                      {prizeImageUrl && <img src={prizeImageUrl} alt={prizeName} className="result-prize-image large mb-15 max-w-200 radius-8" />}
                      <div className="text-xl"><b>{targetName}さんの結果は…「{prizeName}」でした！</b></div>
                    </div>
                  );
                } else {
                  setMyResult(
                    <div className="text-center">
                      <div className="result-message-title text-muted mb-15 font-bold text-2xl">残念…</div>
                      <div className="text-xl"><b>{targetName}さんの結果は…「ハズレ」でした。</b></div>
                    </div>
                  );
                }
              } else {
                setMyResult(<div className="text-center text-xl"><b>全結果を表示します</b></div>);
              }
            };

            // 前回のアニメーション状態（他の画面からの残存トレーサー）をクリアしてから開始
            clear();
            start(resultCanvasRef, targetName ? [targetName] : [], onAnimationComplete, targetName);
          } else {
            // アニメーション実行中は再描画しない（animator.tracers を上書きしてしまうため）
            if (isRunning()) return;

            const storedState = participantPanzoom ? { pan: participantPanzoom.getPan(), scale: participantPanzoom.getScale() } : null;
            // showAllTracers が false の場合、自分の軌跡のみ表示する（他人の軌跡はボタン押下後に表示）
            const onlyName = showAllTracers ? null : targetName;
            prepareStep(resultCanvasRef, false, true, true, storedState, true, onlyName).then(() => {
              if (participantPanzoom) {
                participantPanzoom.setOptions({ disablePan: false, disableZoom: false });
                const wrapper = resultPanzoomWrapperRef.current;
                if (wrapper) wrapper.style.cursor = 'grab';
              }
            });
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

    let resizeDebounceTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = setTimeout(() => {
        if (isRunning()) return;
        redrawStaticAmida();
        redrawResultAmida();
      }, 350);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeDebounceTimer);
    };
  }, [phase, eventData, myMemberId, showAllTracers, isRunning]); // showAllTracers の変更時も再描画

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
      const wrapper = staticPanzoomWrapperRef.current;
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
        await api.addDoodle(actualEventId!, myMemberId, doodleData, participantSession.token!);
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
        await api.deleteDoodle(actualEventId!, myMemberId, participantSession.token!);
        setPreviewDoodle(null);
      } catch (err: any) {
        showToast(err.error || '線の削除に失敗しました。');
      }
    }
  };

  // グループ合言葉検証ハンドラ
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!passwordInput.trim() || !passwordGroupId) return;

    try {
      await api.verifyGroupPassword(passwordGroupId, passwordInput.trim());
      // 検証成功 → Cookieが設定されるので再読込
      setPasswordInput('');
      setLoading(true);
      try {
        let data;
        if (isShare) {
          data = await api.getPublicShareData(actualEventId!, participantName);
        } else {
          data = await api.getPublicEventData(actualEventId!, participantSession.memberId, participantSession.token);
        }
        setEventData(data);
        dispatch(setCurrentLotteryData(data));
        setAnimatorState({ lotteryData: data, revealedPrizes: [] });
        dispatch(setCurrentGroupId(data.groupId));

        if (isShare) {
          setPhase(data.status === 'started' ? 'result' : 'staticAmida');
        } else if (participantSession.memberId && participantSession.token && participantSession.groupId === data.groupId) {
          setMyMemberId(participantSession.memberId);
          setMyName(participantSession.name || '');
          const participation = data.participants.find((p: any) => p.memberId === participantSession.memberId);
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
      } catch (retryErr: any) {
        setError(retryErr.error || 'イベントの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    } catch (err: any) {
      setPasswordError(err.error || '合言葉が正しくありません');
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!nameInput.trim() || !eventData) return;
    
    try {
      const res = await api.joinEvent(actualEventId!, nameInput.trim());
      dispatch(setParticipantSession({ token: res.token, memberId: res.memberId, name: nameInput.trim(), groupId: eventData.groupId }));
      setMyMemberId(res.memberId);
      setMyName(nameInput.trim());
      
      // 最新のイベントデータを取得（参加後なのでlinesが含まれる）
      const newData = await api.getPublicEventData(actualEventId!, res.memberId, res.token);
      setEventData(newData);

      if (res.status === 'event_full') {
        setLoginError('イベントが満員のため参加できませんでした。');
        setPhase('nameEntry');
      } else if (newData.status === 'started') {
        setPhase('result');
      } else {
        setPhase('staticAmida');
      }
    } catch (err: any) {
      if (err.requiresPassword) {
        setPendingLoginId(err.memberId);
        setPendingLoginName(nameInput.trim());
        setShowMemberPasswordModal(true);
      } else {
        setLoginError(err.error || 'ログインに失敗しました');
      }
    }
  };

  const handleMemberLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLoginId || !actualEventId) return;
    try {
      const res2 = await api.verifyPasswordAndJoin(actualEventId, pendingLoginId, memberPasswordInput);
      dispatch(setParticipantSession({ token: res2.token, memberId: res2.memberId, name: pendingLoginName, groupId: eventData.groupId }));
      setMyMemberId(res2.memberId);
      setMyName(pendingLoginName);
      
      // 最新のイベントデータを取得（参加後なのでlinesが含まれる）
      const newData = await api.getPublicEventData(actualEventId!, res2.memberId, res2.token);
      setEventData(newData);

      const updatedParticipation = newData.participants.find((p: any) => p.memberId === res2.memberId);
      setPhase(newData.status === 'started' ? 'result' : (updatedParticipation ? 'staticAmida' : 'join'));
      setShowMemberPasswordModal(false);
      setMemberPasswordInput('');
    } catch (err2: any) {
      setLoginError('合言葉が違います');
      setShowMemberPasswordModal(false);
      setMemberPasswordInput('');
    }
  };

  const handleJoinSlot = async () => {
    if (selectedSlot === null || !eventData || !myMemberId) return;
    
    confirmAction(`参加枠 ${selectedSlot + 1} で参加しますか？`, async () => {
      setLoading(true);
      try {
        await api.joinSlot(actualEventId!, myMemberId, participantSession.token!, selectedSlot);
        
        // 最新のイベントデータを取得（参加後なのでlinesが含まれる）
        const newData = await api.getPublicEventData(actualEventId!, myMemberId, participantSession.token!);
        setEventData(newData);

        setPhase('staticAmida');
      } catch (err: any) {
        showToast(err.error || '参加に失敗しました');
      } finally {
        setLoading(false);
      }
      setShowConfirmModal({ ...showConfirmModal, isOpen: false });
    });
  };

  if (loading) return <div className="loading-mask global-loading-mask">読み込み中...</div>;
  if (error) return <div className="view-container"><h2 className="error-message">{error}</h2></div>;

  return (
    <div id="participantView" className="view-container">
      <h2 id="participantEventName">{eventData?.eventName || '無題のイベント'}</h2>
      {!isShare && myMemberId && (
        <div className="event-header">
          <button 
            className="button back-btn" 
            onClick={() => navigate(customUrl ? `/g/${customUrl}/dashboard` : `/groups/${eventData?.groupId}/dashboard`)}
          >
            <ArrowLeft size={16} className="mr-5"/> ダッシュボードに戻る
          </button>
        </div>
      )}

      <div id="participantFlow">
        {phase === 'passwordEntry' && (
          <div className="controls">
            <div className="password-entry-container">
              <Lock size={48} className="password-icon" />
              <h3>{passwordGroupName || 'グループ'}の合言葉</h3>
              <p>このイベントにアクセスするにはグループの合言葉が必要です。</p>
              <form onSubmit={handlePasswordSubmit} className="input-group">
                <input
                  type="password"
                  placeholder="合言葉を入力"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={!passwordInput.trim()}>認証</button>
              </form>
              {passwordError && <p className="error-message">{passwordError}</p>}
            </div>
          </div>
        )}
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
            {loginError && <p className="error-message text-danger">{loginError}</p>}
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
          <div id="staticAmidaView" className="text-center">
            <h3>参加登録済み</h3>
            <p>イベント開始までお待ちください。自分の参加枠とあみだくじの線を確認できます。</p>
            <div className="canvas-panzoom-container">
              {isPreparing && <div className="loading-mask">あみだくじを生成中...</div>}
              <div className="panzoom-wrapper relative" id="participant-panzoom-wrapper-static" ref={staticPanzoomWrapperRef}>
                <canvas 
                  id="participantCanvasStatic" 
                  ref={staticCanvasRef}
                  className="block"
                ></canvas>
                <canvas 
                  id="participantCanvasPreview" 
                  ref={previewCanvasRef}
                  className={`absolute-top-left ${doodleTool === 'pan' ? 'pointer-events-none' : ''}`}
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

            <div className="controls mt-20 center gap-10">
              <button className="delete-btn" onClick={async () => {
                confirmAction('参加枠を変更しますか？', async () => {
                  try {
                    await api.deleteParticipant(actualEventId!, participantSession.token!);
                    setPhase('join');
                    setSelectedSlot(null);
                    showToast('参加枠を解除しました。新しい枠を選んでください。');
                  } catch (e: any) {
                    showToast(e.error || '変更に失敗しました');
                  }
                  setShowConfirmModal({ ...showConfirmModal, isOpen: false });
                });
              }}>
                参加枠を変更する
              </button>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div id="resultSection">
            <h3><PartyPopper size={24} /> 結果発表 <PartyPopper size={24} /></h3>
            <div className="canvas-panzoom-container">
              <div className="panzoom-wrapper" id="participant-panzoom-wrapper" ref={resultPanzoomWrapperRef}>
                <canvas id="participantCanvas" ref={resultCanvasRef}></canvas>
              </div>
            </div>
            {myResult && <div id="myResult" className="w-100 mt-20 center">{myResult}</div>}
            
            {!isShare && isAnimationFinished && (
              <div className="controls mt-20 flex-column center gap-10">
                {(() => {
                   const participation = eventData?.participants?.find((p: any) => p.memberId === myMemberId);
                   const isAcknowledged = participation?.acknowledgedResult;
                   
                   return !isShare && !isAcknowledged ? (
                     <button className="primary-action w-100 max-w-300 mx-auto" onClick={async () => {
                        try {
                          await api.acknowledgeResult(actualEventId!, myMemberId!, participantSession.token!);
                          showToast('結果を受け取りました！');
                          setEventData({
                            ...eventData,
                            participants: eventData.participants.map((p: any) => p.memberId === myMemberId ? { ...p, acknowledgedResult: true } : p)
                          });
                        } catch (e: any) {
                          showToast(e.error || '処理に失敗しました。');
                        }
                     }}>
                        <Gift size={20} className="icon-inline mr-8" />
                        結果を受け取る
                     </button>
                   ) : null;
                })()}

                {!isShare && (
                  <button className="secondary-btn mx-auto" onClick={() => {
                     const participation = eventData?.participants?.find((p: any) => p.memberId === myMemberId);
                     const shareUrl = `${window.location.origin}/share/${actualEventId}/${encodeURIComponent(participation?.name || '')}`;
                     navigator.clipboard.writeText(shareUrl)
                       .then(() => showToast('クリップボードにシェア用URLをコピーしました！'))
                       .catch(() => setShareFallbackUrl(shareUrl));
                  }}>
                     結果をシェアする
                  </button>
                )}
                
                {!isShare && (
                  <button className="secondary-btn mx-auto" onClick={async () => {
                    try {
                      const group = await api.getGroup(participantSession.groupId!);
                      if (group) {
                        window.location.href = group.customUrl ? `/g/${group.customUrl}/dashboard` : `/groups/${group.id}/dashboard`;
                      } else {
                        window.location.href = '/';
                      }
                    } catch (e) {
                      window.location.href = '/';
                    }
                  }}>
                     戻る
                  </button>
                )}
              </div>
            )}

            {!isShare && isAnimationFinished && eventData?.results && (
              <div id="allResultsContainer" className="mt-30">
                <div className="list-header flex-center-between mb-15">
                  <h3>みんなの結果</h3>
                  <button className="secondary-btn" onClick={() => {
                    // 全員の軌跡を表示するフラグを立てる（useEffect内で再描画される）
                    setShowAllTracers(true);
                  }}>
                    他の人の軌跡見る！
                  </button>
                </div>
                <ul className="item-list">
                  {Object.entries(eventData.results).map(([name, result]: [string, any]) => {
                    const prizeName = typeof result.prize === 'object' ? result.prize.name : result.prize;
                    const prizeImageUrl = typeof result.prize === 'object' ? result.prize.imageUrl : null;
                    const participation = eventData.participants?.find((p: any) => p.memberId === myMemberId);
                    const isMyResult = participation && participation.name === name;
                    
                    return (
                      <li key={name} className={`item-list-item ${isMyResult ? 'highlight' : ''}`}>
                        {prizeImageUrl && <img src={prizeImageUrl} alt={prizeName} className="result-prize-image large" />}
                        <span>{name} → {prizeName}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {isShare && isAnimationFinished && (
              <div style={{ marginTop: '40px', padding: '30px 20px', textAlign: 'center', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>ダイナミックあみだくじ</h3>
                <p style={{ margin: '0 0 20px 0', color: '#0c4a6e', fontSize: '0.95em', lineHeight: '1.6' }}>
                  ブラウザで誰でも簡単に、本格的でド派手なあみだくじが作れます。<br/>
                  あなたもオリジナルのあみだくじを作ってみませんか？
                </p>
                <button className="primary-action" onClick={() => window.location.href = '/'}>
                  あみだくじを無料で作成する
                </button>
              </div>
            )}
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

      {/* メンバーログイン用合言葉入力モーダル */}
      {showMemberPasswordModal && (
        <div className="modal" style={{display: 'block', zIndex: 10000}}>
          <div className="modal-content" style={{maxWidth: '400px'}}>
            <span className="close-button" onClick={() => setShowMemberPasswordModal(false)}>
              <X size={24} />
            </span>
            <h3 style={{textAlign: 'center'}}>本人確認</h3>
            <p style={{textAlign: 'center', fontSize: '0.95em'}}>
              このイベントには既にパスワード付きで <strong>{pendingLoginName}</strong> さんが登録されています。<br/><br/>
              ご本人の場合は合言葉を入力してください。別人の場合は、別の名前で参加してください。
            </p>
            <form onSubmit={handleMemberLoginSubmit} className="input-group">
              <input
                type="password"
                placeholder="合言葉を入力"
                value={memberPasswordInput}
                onChange={(e) => setMemberPasswordInput(e.target.value)}
                autoFocus
              />
              <div className="modal-actions" style={{justifyContent: 'center', marginTop: '15px'}}>
                <button type="submit" className="primary-action" disabled={!memberPasswordInput}>ログイン</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* シェア用URLフォールバック表示モーダル */}
      {shareFallbackUrl && (
        <div className="modal" style={{display: 'block', zIndex: 10000}}>
          <div className="modal-content" style={{maxWidth: '500px', textAlign: 'center'}}>
            <span className="close-button" onClick={() => setShareFallbackUrl('')}>
              <X size={24} />
            </span>
            <h3>URLをコピーしてください</h3>
            <p>ブラウザの制限により自動コピーに失敗しました。<br/>以下のURLを選択してコピーしてください。</p>
            <div className="input-group" style={{marginTop: '15px'}}>
              <textarea
                readOnly
                value={shareFallbackUrl}
                style={{width: '100%', minHeight: '80px', padding: '10px', fontSize: '14px', resize: 'none'}}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
            <div className="modal-actions" style={{justifyContent: 'center', marginTop: '15px'}}>
              <button className="primary-action" onClick={() => setShareFallbackUrl('')}>閉じる</button>
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
