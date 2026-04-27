import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setCurrentGroupPrizeMasters } from '../../store/adminSlice';
import { X, ImagePlus, Star, Trash2 } from 'lucide-react';
import * as api from '../../lib/api';
import { ImageCropperModal } from '../ImageCropperModal';

interface PrizeMasterModalProps {
  groupId: string;
  onClose: () => void;
  setToastMessage: (msg: string) => void;
  setConfirmDialog: (dialog: { message: string, onConfirm: () => void } | null) => void;
}

export const PrizeMasterModal: React.FC<PrizeMasterModalProps> = ({
  groupId,
  onClose,
  setToastMessage,
  setConfirmDialog
}) => {
  const dispatch = useDispatch();
  const prizeMasters = useSelector((state: RootState) => state.admin.currentGroupPrizeMasters);
  
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterFile, setNewMasterFile] = useState<File | null>(null);
  const [newMasterFilePreview, setNewMasterFilePreview] = useState<string | null>(null);
  const [newMasterRank, setNewMasterRank] = useState('common');
  const [prizeMasterError, setPrizeMasterError] = useState('');
  
  const [cropTargetImage, setCropTargetImage] = useState<string | null>(null);

  const loadPrizeMasters = async () => {
    try {
      const data = await api.getPrizeMasters(groupId);
      dispatch(setCurrentGroupPrizeMasters(data));
    } catch (e) {}
  };

  useEffect(() => {
    loadPrizeMasters();
  }, [groupId]);



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

      const res = await api.generatePrizeMasterUploadUrl(groupId, newMasterFile.type, fileHash);
      const { signedUrl, imageUrl } = res;
      
      const resUpload = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': newMasterFile.type }, body: newMasterFile });
      if (!resUpload.ok) throw new Error('Upload failed');

      await api.addPrizeMaster(groupId, newMasterName, imageUrl, newMasterRank);

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
          await api.deletePrizeMaster(masterId, groupId);
          setToastMessage('削除しました');
          loadPrizeMasters();
        } catch (e) {
          setToastMessage('削除に失敗しました');
        }
      }
    });
  };

  return (
    <>
      <div className="modal active">
        <div className="modal-content">
          <span className="close-button" onClick={onClose}><X size={28} /></span>
          <h3>賞品マスター管理</h3>
          <p>よく使う賞品を登録しておくと、イベント作成時に簡単に呼び出せます。</p>
          
          <div className="prize-master-form">
            <div className="prize-master-image-dropzone">
              <label htmlFor="newMasterImageUpload">
                <img id="addMasterPrizeImagePreview" src={newMasterFilePreview || undefined} alt="プレビュー" className={newMasterFilePreview ? '' : 'hidden-element'} />
                <div id="addMasterPrizePlaceholder" className={newMasterFilePreview ? 'hidden-element' : ''}>
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
          {prizeMasterError && <p className="error-message text-center my-10">{prizeMasterError}</p>}

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
                          className={`lucide-star star-color-${pm.rank} ${i < config.stars ? 'filled' : ''}`} 
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

      {cropTargetImage && (
        <ImageCropperModal
          imageUrl={cropTargetImage}
          onConfirm={(file) => {
            setNewMasterFile(file);
            setNewMasterFilePreview(URL.createObjectURL(file));
            setCropTargetImage(null);
          }}
          onCancel={() => setCropTargetImage(null)}
        />
      )}
    </>
  );
};
