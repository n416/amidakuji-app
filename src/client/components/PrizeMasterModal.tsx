import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { ImageDropzone } from './ImageDropzone';

interface PrizeMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrizeMasterModal: React.FC<PrizeMasterModalProps> = ({ isOpen, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prizeName, setPrizeName] = useState('');
  const [rank, setRank] = useState('uncommon');

  if (!isOpen) return null;

  const handleImageSelected = (file: File) => {
    // プレビュー用にローカルURLを生成
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleAddPrize = () => {
    console.log('賞品追加:', { prizeName, rank, hasImage: !!previewUrl });
    // TODO: 後続フェーズで状態管理(API保存処理など)を実装
  };

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <span className="close-button" onClick={onClose}><X size={20} /></span>
        <h3>賞品マスター管理</h3>

        <div className="prize-master-form">
          {/* 画像ドロップゾーンコンポーネントを利用 */}
          <ImageDropzone onImageSelected={handleImageSelected} previewUrl={previewUrl} />
          
          <div className="prize-master-inputs">
            <input 
              type="text" 
              placeholder="新しい賞品名" 
              value={prizeName}
              onChange={(e) => setPrizeName(e.target.value)}
            />
            <div className="prize-rank-selector" data-rank={rank}>
              {['miss', 'uncommon', 'common', 'rare', 'epic'].map((r) => (
                <Star 
                  key={r}
                  size={20} 
                  className={`lucide-star ${['miss', 'uncommon'].includes(r) ? 'filled' : ''}`} 
                  onClick={() => setRank(r)}
                  style={{ cursor: 'pointer', fill: ['miss', 'uncommon'].includes(r) ? 'currentColor' : 'none' }}
                />
              ))}
            </div>
            <button className="primary-action" onClick={handleAddPrize}>マスターに追加</button>
          </div>
        </div>
        
        <ul className="item-list prize-master-list">
          {/* 登録済み賞品リストのプレースホルダー */}
        </ul>
      </div>
    </div>
  );
};
