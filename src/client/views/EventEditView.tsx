import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as api from '../lib/api';
// @ts-ignore
import * as state from '../lib/state.js';
// @ts-ignore
import { prepareStepAnimation } from '../lib/animation.js';
import { X, Users, RefreshCw, Gift, ArrowLeft, Plus, Star, Trash2, ArrowRight, ImagePlus, Grid, List } from 'lucide-react';
import { CustomConfirmModal } from '../components/CustomConfirmModal';
import { ImageCropperModal } from '../components/ImageCropperModal';

export const EventEditView: React.FC = () => {
  const { eventId, groupId } = useParams();
  const navigate = useNavigate();
  
  const [eventName, setEventName] = useState('');
  const [prizes, setPrizes] = useState<any[]>([]);
  const [displayPrizeName, setDisplayPrizeName] = useState(true);
  const [displayPrizeCount, setDisplayPrizeCount] = useState(true);
  const [allowDoodleMode, setAllowDoodleMode] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [eventData, setEventData] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modals state
  const [showAddPrizeModal, setShowAddPrizeModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showFillSlotsModal, setShowFillSlotsModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPrizeMasterSelectModal, setShowPrizeMasterSelectModal] = useState(false);
  
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeRank, setNewPrizeRank] = useState('uncommon');
  const [newPrizeFile, setNewPrizeFile] = useState<File | null>(null);
  const [newPrizeImageUrl, setNewPrizeImageUrl] = useState<string | null>(null);
  
  const [bulkPrizeText, setBulkPrizeText] = useState('');
  
  const [unjoinedMembers, setUnjoinedMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [fillSlotsStep, setFillSlotsStep] = useState(1);
  const [prizeMasters, setPrizeMasters] = useState<any[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<any | null>(null);

  const [confirmModalConfig, setConfirmModalConfig] = useState<{message: string, options: string[], callback: (opt: string | null) => void} | null>(null);
  const [cropperModalUrl, setCropperModalUrl] = useState<string | null>(null);
  const [cropperCallback, setCropperCallback] = useState<((file: File | null) => void) | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isNewEvent = !eventId;
  const currentEventId = isNewEvent ? null : eventId;

  // トースト通知
  const [toastMessage, setToastMessage] = useState<string>('');
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    const init = async () => {
      if (!isNewEvent) {
        try {
          const data = await api.getEvent(eventId!);
          setEventData(data);
          setEventName(data.eventName || '');
          setPrizes(data.prizes || []);
          setDisplayPrizeName(data.displayPrizeName ?? true);
          setDisplayPrizeCount(data.displayPrizeCount ?? true);
          setAllowDoodleMode(data.allowDoodleMode || false);
          state.setCurrentLotteryData(data);
          state.setPrizes(data.prizes || []);
        } catch (e) {
          console.error(e);
          showToast('イベントの読み込みに失敗しました');
        }
      }
    };
    init();
  }, [eventId, isNewEvent]);

  useEffect(() => {
    if (!isNewEvent && eventData && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        state.setCurrentLotteryData(eventData);
        prepareStepAnimation(ctx, true, false, true);
      }
    }
  }, [eventData, isNewEvent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Handle image uploads
      const uploadedImageUrls: Record<string, string> = {};
      const fileUploadPromises = prizes.map(async (prize) => {
        if (prize.newImageFile) {
          const buffer = await prize.newImageFile.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
          return { file: prize.newImageFile, hash: hashHex };
        }
        return null;
      });
      const resolvedFileUploads = (await Promise.all(fileUploadPromises)).filter(Boolean) as any[];
      const uniqueFiles = [...new Map(resolvedFileUploads.map((item) => [item.hash, item])).values()];
      
      const targetGroupId = groupId || eventData?.groupId;

      for (const { file, hash } of uniqueFiles) {
        const { signedUrl, imageUrl } = await api.generateEventPrizeUploadUrl(currentEventId || 'temp', file.type, hash, targetGroupId);
        const res = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        if (!res.ok) throw new Error('Upload failed');
        uploadedImageUrls[hash] = imageUrl;
      }

      const finalPrizes = await Promise.all(prizes.map(async (prize) => {
        if (prize.newImageFile) {
          const buffer = await prize.newImageFile.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
          const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
          return { name: prize.name, imageUrl: uploadedImageUrls[hashHex], rank: prize.rank || 'uncommon' };
        }
        return { name: prize.name, imageUrl: prize.imageUrl, rank: prize.rank || 'uncommon' };
      }));

      const finalEventData = {
        eventName: eventName.trim(),
        prizes: finalPrizes,
        participantCount: finalPrizes.length,
        displayPrizeName,
        displayPrizeCount,
        allowDoodleMode,
      };

      if (isNewEvent) {
        const created = await api.createEvent({ ...finalEventData, groupId });
        showToast('イベントを作成しました');
        navigate(`/admin/event/${created.id}/edit`, { replace: true });
      } else {
        await api.updateEvent(currentEventId!, finalEventData);
        const updated = await api.getEvent(currentEventId!);
        setEventData(updated);
        setPrizes(updated.prizes || []);
        setIsDirty(false);
        showToast('保存しました');
      }
    } catch (e: any) {
      showToast(e.error || e.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handlePrizeChange = (index: number, field: string, value: any) => {
    const newPrizes = [...prizes];
    newPrizes[index][field] = value;
    setPrizes(newPrizes);
    setIsDirty(true);
  };

  const handleGroupPrizeChange = (originalName: string, field: string, value: any) => {
    const newPrizes = [...prizes];
    if (field === 'quantity') {
      const currentCount = newPrizes.filter(p => p.name === originalName).length;
      const targetCount = parseInt(value, 10) || 0;
      if (targetCount > currentCount) {
        const template = newPrizes.find(p => p.name === originalName) || { name: originalName, rank: 'uncommon' };
        for (let i = 0; i < targetCount - currentCount; i++) {
          newPrizes.push({ ...template });
        }
      } else if (targetCount < currentCount) {
        let removed = 0;
        for (let i = newPrizes.length - 1; i >= 0; i--) {
          if (newPrizes[i].name === originalName) {
            newPrizes.splice(i, 1);
            removed++;
            if (removed === currentCount - targetCount) break;
          }
        }
      }
    } else {
      newPrizes.forEach(p => {
        if (p.name === originalName) {
          p[field] = value;
        }
      });
    }
    setPrizes(newPrizes);
    setIsDirty(true);
  };

  const handleGroupPrizeDelete = (originalName: string) => {
    const newPrizes = prizes.filter(p => p.name !== originalName);
    setPrizes(newPrizes);
    setIsDirty(true);
  };

  const handleDeletePrize = (index: number) => {
    const newPrizes = [...prizes];
    newPrizes.splice(index, 1);
    setPrizes(newPrizes);
    setIsDirty(true);
  };

  const handleDuplicatePrize = (index: number) => {
    const newPrizes = [...prizes];
    newPrizes.push({ ...prizes[index] });
    setPrizes(newPrizes);
    setIsDirty(true);
  };

  const addPrize = () => {
    if (!newPrizeName.trim() && !newPrizeFile) return;
    setPrizes([...prizes, { name: newPrizeName.trim() || '名称未設定', rank: newPrizeRank, newImageFile: newPrizeFile }]);
    setNewPrizeName('');
    setNewPrizeRank('uncommon');
    setNewPrizeFile(null);
    setShowAddPrizeModal(false);
    setIsDirty(true);
  };

  const handleBulkPrizeUpdate = () => {
    const lines = bulkPrizeText.split('\n').map(l => l.trim()).filter(l => l);
    const newPrizes = lines.map(line => {
      const match = line.match(/^(.+?)(?:\s*[:：×xX]\s*(\d+))?$/);
      if (match) {
        const name = match[1].trim();
        const count = parseInt(match[2], 10) || 1;
        return Array(count).fill({ name, rank: 'uncommon' });
      }
      return { name: line, rank: 'uncommon' };
    }).flat();
    setPrizes([...prizes, ...newPrizes]);
    setShowBulkAddModal(false);
    setBulkPrizeText('');
    setIsDirty(true);
  };

  const handleShufflePrizes = () => {
    const shuffled = [...prizes].sort(() => Math.random() - 0.5);
    setPrizes(shuffled);
    setIsDirty(true);
  };

  const isStarted = eventData?.status === 'started';

  const fetchUnjoinedMembers = async () => {
    try {
      const targetGroupId = groupId || eventData?.groupId;
      const members = await api.getUnjoinedMembers(targetGroupId, currentEventId!);
      setUnjoinedMembers(members);
      setFillSlotsStep(1);
      setShowFillSlotsModal(true);
    } catch (e) {
      showToast('未参加メンバーの取得に失敗しました');
    }
  };

  const showCustomConfirm = (message: string, options: string[]): Promise<string | null> => {
    return new Promise((resolve) => {
      setConfirmModalConfig({ message, options, callback: (opt) => {
        setConfirmModalConfig(null);
        resolve(opt);
      }});
    });
  };

  const handleRegenerateLines = async () => {
    if (!currentEventId) return;
    const doodlesExist = state.currentLotteryData?.doodles?.length > 0;
    let deleteDoodles = false;
    if (doodlesExist) {
      const opt = await showCustomConfirm(
        'ユーザーによる落書きが追加されています。線を再生成する際に、これらの落書きをどうしますか？',
        ['落書きもリセットする', '落書きを残す']
      );
      if (opt === '落書きもリセットする') deleteDoodles = true;
      else if (opt === '落書きを残す') deleteDoodles = false;
      else return;
    } else {
      const opt = await showCustomConfirm('あみだくじのパターンを再生成しますか？', ['再生成する']);
      if (!opt) return;
    }

    try {
      const result = await api.regenerateLines(currentEventId, deleteDoodles);
      state.currentLotteryData.lines = result.lines;
      state.currentLotteryData.results = result.results;
      if (deleteDoodles) state.currentLotteryData.doodles = [];
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) prepareStepAnimation(ctx, true, false, true);
      showToast('あみだくじを再生成しました。');
      
      const updated = await api.getEvent(currentEventId);
      setEventData(updated);
    } catch (e: any) {
      showToast(`エラー: ${e.error || '再生成に失敗しました。'}`);
    }
  };

  const handleSelectRandomMembers = () => {
    const emptySlotsCount = eventData?.participants?.filter((p: any) => p.name === null).length || 0;
    if (unjoinedMembers.length < emptySlotsCount) {
      showToast('空き枠に対して、未参加のメンバーが不足しています。全員を割り当てます。');
      setSelectedMembers([...unjoinedMembers]);
    } else {
      const shuffled = [...unjoinedMembers].sort(() => 0.5 - Math.random());
      setSelectedMembers(shuffled.slice(0, emptySlotsCount));
    }
    setFillSlotsStep(2);
  };

  const handleFillSlots = async () => {
    if (selectedMembers.length === 0) return;
    try {
      await api.fillSlots(currentEventId!, selectedMembers);
      showToast('参加枠を割り当てました');
      setShowFillSlotsModal(false);
      setSelectedMembers([]);
      const updated = await api.getEvent(currentEventId!);
      setEventData(updated);
    } catch (e: any) {
      showToast(e.error || '割り当てに失敗しました');
    }
  };

  const renderStars = (currentRank: string, onChange: (rank: string) => void, disabled: boolean) => {
    const ranks = ['miss', 'uncommon', 'common', 'rare', 'epic'];
    return (
      <div className="prize-rank-selector">
        {ranks.map((rank, i) => {
          const isFilled = ranks.indexOf(currentRank || 'uncommon') >= i;
          return (
            <i 
              key={rank} 
              className={`lucide-star ${isFilled ? 'filled' : ''}`}
              onClick={() => !disabled && onChange(rank)}
              style={{ cursor: disabled ? 'default' : 'pointer', fontSize: '20px' }}
            >
              ★
            </i>
          );
        })}
      </div>
    );
  };

  const aggregatedPrizes = prizes.reduce((acc: any[], prize) => {
    const existing = acc.find(p => p.name === prize.name);
    if (existing) {
      existing.quantity++;
    } else {
      acc.push({ ...prize, quantity: 1, originalName: prize.name });
    }
    return acc;
  }, []);

  return (
    <div id="eventEditView" className="view-container">
      <div className="event-header">
        <button onClick={() => navigate(`/admin/groups/${groupId || eventData?.groupId}`)}>
          <ArrowLeft size={16} style={{marginRight: '5px', verticalAlign: 'text-bottom'}}/> グループダッシュボードに戻る
        </button>
      </div>
      <h3>{isNewEvent ? 'イベント新規作成' : 'イベント編集'}</h3>
      
      <div className="controls">
        <div className="settings-section">
          <h4>1. イベント情報</h4>
          <div className="input-group">
            <label>イベント名:</label>
            <input 
              type="text" 
              value={eventName} 
              onChange={e => { setEventName(e.target.value); setIsDirty(true); }}
              placeholder="（例: 忘年会2025）"
              disabled={isStarted}
            />
          </div>
          {!isNewEvent && (
            <p style={{marginTop: '10px', fontSize: '0.9em', fontWeight: 'bold'}}>
              現在のイベントURL: <a href={`${window.location.origin}/events/${currentEventId}`} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color)'}}>{`${window.location.origin}/events/${currentEventId}`}</a>
            </p>
          )}
        </div>

        <div className="settings-section">
          <h4>2. 景品</h4>
          <div className="prize-controls-header">
            <div className="input-group prize-main-controls">
              <button className="primary-action" onClick={() => setShowAddPrizeModal(true)} disabled={isStarted}><Plus size={16}/> 追加</button>
              <button onClick={() => { setBulkPrizeText(prizes.map((p) => p.name).join('\n')); setShowBulkAddModal(true); }} disabled={isStarted}>テキスト流し込みで追加</button>
              <button onClick={handleShufflePrizes} disabled={isStarted}><RefreshCw size={16}/> ランダム並び替え</button>
              <button onClick={() => setShowSummaryModal(true)}>集計</button>
            </div>
            <div className="view-mode-switcher" data-active-mode={viewMode}>
              <button id="viewModeCard" className={`view-mode-btn ${viewMode === 'card' ? 'active' : ''}`} onClick={() => setViewMode('card')}><Grid size={16}/> カード表示</button>
              <button id="viewModeList" className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={16}/> リスト表示</button>
            </div>
          </div>

          {viewMode === 'card' ? (
            <ul className="prize-card-list">
              {prizes.map((p, i) => (
                <li key={i} className="prize-card">
                  <div className="prize-card-image" onClick={() => { if(!isStarted) document.getElementById(`prize-image-upload-${i}`)?.click(); }}>
                    {p.imageUrl || p.newImageFile ? (
                      <img src={p.newImageFile ? URL.createObjectURL(p.newImageFile) : p.imageUrl} alt={p.name} />
                    ) : <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="placeholder" className="placeholder" />}
                    <input type="file" id={`prize-image-upload-${i}`} style={{display: 'none'}} accept="image/*" disabled={isStarted} onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setCropperModalUrl(URL.createObjectURL(e.target.files[0]));
                        setCropperCallback(() => (file: File | null) => {
                          if (file) handlePrizeChange(i, 'newImageFile', file);
                          e.target.value = '';
                        });
                      }
                    }} />
                  </div>
                  <div className="prize-card-info">
                    <input 
                      type="text" 
                      className="prize-card-name-input"
                      value={p.name} 
                      onChange={e => handlePrizeChange(i, 'name', e.target.value)}
                      disabled={isStarted}
                    />
                    {renderStars(p.rank || 'uncommon', (rank) => handlePrizeChange(i, 'rank', rank), isStarted)}
                  </div>
                  {!isStarted && (
                    <div className="prize-card-actions">
                      <button onClick={() => handleDuplicatePrize(i)} className="duplicate-btn">複製</button>
                      <button onClick={() => handleDeletePrize(i)} className="delete-btn">削除</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <table className="prize-list-table">
              <thead>
                <tr>
                  <th style={{width: '80px'}}>画像</th>
                  <th style={{textAlign: 'left'}}>景品名 ▲</th>
                  <th style={{width: '80px'}}>数量</th>
                  <th style={{width: '140px'}}>ランク</th>
                  <th style={{textAlign: 'center', width: '80px'}}>操作</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedPrizes.map((p, i) => (
                  <tr key={i}>
                    <td style={{textAlign: 'center'}}>
                      <label className="prize-image-label" style={{cursor: isStarted ? 'default' : 'pointer'}}>
                        {p.imageUrl || p.newImageFile ? (
                          <img src={p.newImageFile ? URL.createObjectURL(p.newImageFile) : p.imageUrl} alt={p.name} className="prize-image-cell" />
                        ) : (
                          <div className="prize-image-cell no-image"><ImagePlus size={16} /></div>
                        )}
                        <input type="file" style={{display: 'none'}} accept="image/*" disabled={isStarted} onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setCropperModalUrl(URL.createObjectURL(e.target.files[0]));
                            setCropperCallback(() => (file: File | null) => {
                              if (file) handleGroupPrizeChange(p.originalName, 'newImageFile', file);
                              e.target.value = '';
                            });
                          }
                        }} />
                      </label>
                    </td>
                    <td>
                      <input type="text" className="prize-name-input-list" value={p.name} onChange={e => handleGroupPrizeChange(p.originalName, 'name', e.target.value)} disabled={isStarted} />
                    </td>
                    <td>
                      <input type="number" inputMode="numeric" pattern="[0-9]*" className="prize-quantity-input" value={p.quantity} min="1" onChange={e => handleGroupPrizeChange(p.originalName, 'quantity', e.target.value)} disabled={isStarted} />
                    </td>
                    <td>
                      {renderStars(p.rank || 'uncommon', (rank) => handleGroupPrizeChange(p.originalName, 'rank', rank), isStarted)}
                    </td>
                    <td style={{textAlign: 'center'}}>
                      {!isStarted && <button onClick={() => handleGroupPrizeDelete(p.originalName)} className="delete-btn delete-prize-list">削除</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="settings-section">
          <h4>3. 公開設定</h4>
          <p className="description" style={{fontSize: '0.9em', color: '#666', marginBottom: '10px'}}>参加者が参加枠を選ぶ画面で、どこまで景品情報を表示するか設定します。</p>
          <div className="input-group checkbox-group" style={{display: 'inline-flex', marginRight: '15px'}}>
            <input type="checkbox" id="displayPrizeName" checked={displayPrizeName} onChange={e => {setDisplayPrizeName(e.target.checked); setIsDirty(true);}} disabled={isStarted} />
            <label htmlFor="displayPrizeName">景品名を表示する</label>
          </div>
          <div className="input-group checkbox-group" style={{display: 'inline-flex'}}>
            <input type="checkbox" id="displayPrizeCount" checked={displayPrizeCount} onChange={e => {setDisplayPrizeCount(e.target.checked); setIsDirty(true);}} disabled={isStarted} />
            <label htmlFor="displayPrizeCount">景品ごとの個数を表示する</label>
          </div>

          <div className="display-preview">
            <h5>参加者への表示プレビュー</h5>
            <div id="prizeDisplayPreview">
              <ul>
                {prizes.length === 0 ? (
                  <li>景品を登録してください</li>
                ) : displayPrizeName && displayPrizeCount ? (
                  aggregatedPrizes.map((p, i) => <li key={i}>{p.name}: {p.quantity}個</li>)
                ) : !displayPrizeName && displayPrizeCount ? (
                  aggregatedPrizes.map((p, i) => <li key={i}>？？？: {p.quantity}個</li>)
                ) : displayPrizeName && !displayPrizeCount ? (
                  aggregatedPrizes.map((p, i) => <li key={i}>{p.name}</li>)
                ) : (
                  <li>合計景品数: {prizes.length}個</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h4>4. インタラクティブ設定</h4>
          <div className="input-group checkbox-group">
            <input type="checkbox" id="allowDoodleModeCheckbox" checked={allowDoodleMode} onChange={e => {setAllowDoodleMode(e.target.checked); setIsDirty(true);}} disabled={isStarted} />
            <label htmlFor="allowDoodleModeCheckbox">落書きモードを許可する</label>
          </div>
        </div>

        {isNewEvent ? (
          <div className="settings-section">
            <button className="primary-action" onClick={handleSave} disabled={saving}>この内容でイベントを作成</button>
          </div>
        ) : (
          <div className="settings-section">
            <h4>5. 最終準備と配信</h4>
            <div className="final-prep-content-wrapper" style={{position: 'relative'}}>
              {isDirty && (
                <div className="final-prep-overlay">
                  <button className="primary-action" onClick={handleSave} disabled={saving}>変更を保存してプレビューを更新</button>
                </div>
              )}
              <p>あみだくじを生成・プレビューし、必要に応じて調整します。</p>
              <div className="input-group" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                <button onClick={fetchUnjoinedMembers} disabled={isStarted}><Users size={16}/> 参加枠を埋める</button>
                <button onClick={handleRegenerateLines} disabled={isStarted}><RefreshCw size={16}/> 線を再生成</button>
                <button onClick={async () => {
                  const opt = await showCustomConfirm('景品をシャッフルしますか？', ['シャッフルする']);
                  if (!opt) return;
                  try {
                    const shuffledPrizes = [...prizes].sort(() => Math.random() - 0.5);
                    await api.shufflePrizes(currentEventId!, shuffledPrizes);
                    const updated = await api.getEvent(currentEventId!);
                    setEventData(updated);
                    showToast('景品をシャッフルしました');
                  } catch(e: any) { showToast(e.error || 'シャッフルに失敗しました'); }
                }} disabled={isStarted}><Gift size={16}/> 景品シャッフル</button>
              </div>
              
              <div className="canvas-panzoom-container" style={{marginTop: '15px', border: '1px solid #ccc'}}>
                <div className="panzoom-wrapper" style={{width: '100%', height: '400px', overflow: 'hidden'}}>
                  <canvas ref={canvasRef} style={{width: '100%', height: '100%'}}></canvas>
                </div>
              </div>
            </div>

            <div style={{marginTop: '20px', textAlign: 'center'}}>
              <Link to={`/admin/event/${currentEventId}/broadcast`} className="primary-action" style={{display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none'}}>
                配信画面へ進む <ArrowRight size={16}/>
              </Link>
            </div>
          </div>
        )}
      </div>

      {showAddPrizeModal && (
        <div id="addPrizeModal" className="modal" style={{display: 'block'}}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowAddPrizeModal(false)}><X /></span>
            <h3>景品の追加</h3>
            <div className="input-group">
              <label>景品名:</label>
              <input type="text" id="newPrizeNameInput" placeholder="景品名を入力" value={newPrizeName} onChange={e => setNewPrizeName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>画像:</label>
              <input type="file" id="newPrizeImageInput" accept="image/*" onChange={(e) => {
                if (e.target.files?.[0]) {
                  setCropperModalUrl(URL.createObjectURL(e.target.files[0]));
                  setCropperCallback(() => (file: File | null) => {
                    if (file) {
                      setNewPrizeFile(file);
                      setNewPrizeImageUrl(URL.createObjectURL(file));
                    }
                    e.target.value = '';
                  });
                }
              }} />
            </div>
            {renderStars(newPrizeRank, setNewPrizeRank, false)}
            
            <img id="newPrizeImagePreview" src={newPrizeImageUrl || ''} alt="Image Preview" style={{maxWidth: '100px', maxHeight: '100px', display: newPrizeImageUrl ? 'block' : 'none'}} />
            
            <div className="modal-actions">
              <button id="callMasterButton" className="secondary-btn action-left" onClick={async () => {
                try {
                  const masters = await api.getPrizeMasters(groupId || eventData?.groupId);
                  setPrizeMasters(masters);
                  setShowPrizeMasterSelectModal(true);
                } catch(e) { showToast('マスター取得に失敗'); }
              }}>マスターから呼び出し</button>
              <button id="addPrizeOkButton" className="primary-action" onClick={addPrize}>追加</button>
            </div>
          </div>
        </div>
      )}

      {showSummaryModal && (
        <div id="summaryModal" className="modal" style={{display: 'block'}}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowSummaryModal(false)}><X /></span>
            <h3>景品集計</h3>
            <p style={{fontSize: '1.2em'}}>合計: <strong>{prizes.length}</strong> 個</p>
            <ul style={{listStyle: 'none', padding: 0, marginTop: '15px'}}>
              {aggregatedPrizes.map((p, i) => (
                <li key={i} style={{padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between'}}>
                  <span>{p.name}</span>
                  <strong>{p.quantity} 個</strong>
                </li>
              ))}
            </ul>
            <div className="modal-actions" style={{marginTop: '20px'}}>
              <button className="secondary-btn" onClick={() => setShowSummaryModal(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {showBulkAddModal && (
        <div id="prizeBulkAddModal" className="modal" style={{display: 'block'}}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowBulkAddModal(false)}><X /></span>
            <h3>テキスト流し込みで景品を追加</h3>
            <p>1行に1つの景品名を入力してください。「景品名: 個数」の形式でも入力可能です。<br/>例:<br/>A賞<br/>B賞: 3<br/>ハズレ: 10</p>
            <textarea id="prizeBulkTextarea" rows={10} style={{width: '100%', marginTop: '10px'}} placeholder="ここにテキストを入力..." value={bulkPrizeText} onChange={e => setBulkPrizeText(e.target.value)}></textarea>
            <div className="modal-actions">
              <button id="cancelBulkAddButton" className="secondary-btn" onClick={() => setShowBulkAddModal(false)}>キャンセル</button>
              <button id="clearBulkPrizesButton" className="secondary-btn action-left" onClick={() => setBulkPrizeText('')}>クリア</button>
              <button id="updatePrizesFromTextButton" className="primary-action" onClick={handleBulkPrizeUpdate}>追加</button>
            </div>
          </div>
        </div>
      )}

      {showFillSlotsModal && (
        <div id="fillSlotsModal" className="modal" style={{display: 'block'}}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowFillSlotsModal(false)}><X /></span>
            <h3>参加枠を埋める</h3>
            <p>現在 <strong id="emptySlotCount">{eventData?.participants?.filter((p: any) => p.name === null).length || 0}</strong> 件の空き枠があります。</p>
            
            {fillSlotsStep === 1 ? (
              <div id="fillSlotsStep1" style={{display: 'block'}}>
                <h4>ステップ1：未参加のアクティブメンバー</h4>
                <ul id="unjoinedMemberList" className="item-list" style={{maxHeight: '200px', overflowY: 'auto'}}>
                  {unjoinedMembers.length > 0 ? unjoinedMembers.map(m => (
                    <li key={m.id} className="item-list-item">{m.name}</li>
                  )) : <li>対象メンバーはいません。</li>}
                </ul>
                <div className="modal-actions">
                  <button id="selectMembersButton" className="primary-action" onClick={handleSelectRandomMembers} disabled={unjoinedMembers.length === 0}>ランダムに選択</button>
                </div>
              </div>
            ) : (
              <div id="fillSlotsStep2" style={{display: 'block'}}>
                <h4>ステップ2：割り当て予定のメンバー</h4>
                <p>以下のメンバーを割り当てます。よろしいですか？</p>
                <ul id="selectedMemberList" className="item-list" style={{maxHeight: '200px', overflowY: 'auto'}}>
                  {selectedMembers.map(m => (
                    <li key={m.id} className="item-list-item">{m.name}</li>
                  ))}
                </ul>
                <div className="modal-actions">
                  <button id="confirmFillSlotsButton" className="primary-action" onClick={handleFillSlots}>確定する</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPrizeMasterSelectModal && (
        <div id="prizeMasterSelectModal" className="modal" style={{display: 'block', zIndex: 3060}}>
          <div className="modal-content" style={{maxWidth: '800px', width: '90%'}}>
            <span className="close-button" onClick={() => { setShowPrizeMasterSelectModal(false); setSelectedMaster(null); }}><X /></span>
            <h3>景品マスターから選択</h3>
            <div style={{maxHeight: '60vh', overflowY: 'auto', marginBottom: '20px'}}>
              <ul id="prizeMasterSelectList" className="item-list">
                {prizeMasters.map(m => (
                  <li 
                    key={m.id} 
                    className={`item-list-item ${selectedMaster?.id === m.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMaster(m)}
                    style={{display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', padding: '10px'}}
                  >
                    {m.imageUrl ? <img src={m.imageUrl} alt={m.name} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}} /> : <div style={{width: '50px', height: '50px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Gift size={24}/></div>}
                    <div>
                      <div style={{fontWeight: 'bold'}}>{m.name}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => { setShowPrizeMasterSelectModal(false); setSelectedMaster(null); }}>キャンセル</button>
              <button className="primary-action" disabled={!selectedMaster} onClick={async () => {
                if (selectedMaster) {
                  setNewPrizeName(selectedMaster.name);
                  setNewPrizeImageUrl(selectedMaster.imageUrl);
                  
                  // Fetch image blob to convert to File object if possible
                  try {
                    if (selectedMaster.imageUrl) {
                      const res = await fetch(selectedMaster.imageUrl);
                      const blob = await res.blob();
                      const file = new File([blob], 'master_image.png', { type: blob.type });
                      setNewPrizeFile(file);
                    }
                  } catch(e) {}
                  
                  setShowPrizeMasterSelectModal(false);
                  setSelectedMaster(null);
                }
              }}>選択して反映</button>
            </div>
          </div>
        </div>
      )}

      {confirmModalConfig && (
        <CustomConfirmModal
          message={confirmModalConfig.message}
          options={confirmModalConfig.options}
          onSelect={confirmModalConfig.callback}
        />
      )}

      {cropperModalUrl && cropperCallback && (
        <ImageCropperModal
          imageUrl={cropperModalUrl}
          onConfirm={(file) => {
            cropperCallback(file);
            setCropperModalUrl(null);
            setCropperCallback(null);
          }}
          onCancel={() => {
            cropperCallback(null);
            setCropperModalUrl(null);
            setCropperCallback(null);
          }}
        />
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

