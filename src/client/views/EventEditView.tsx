import React, { useState } from 'react';
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { PrizeMasterModal } from '../components/PrizeMasterModal';

export const EventEditView: React.FC = () => {
  const [isPrizeMasterModalOpen, setIsPrizeMasterModalOpen] = useState(false);

  return (
    <div id="eventEditView" className="view-container">
      <div className="event-header">
        <button id="backToGroupsButton" className="button">
          <ArrowLeft size={16} style={{ marginRight: '5px' }} /> グループダッシュボードに戻る
        </button>
      </div>
      
      <h3>イベント新規作成・編集</h3>
      
      <div className="controls">
        {/* 1. イベント情報 */}
        <div className="settings-section">
          <h4>1. イベント情報</h4>
          <div className="input-group">
            <label htmlFor="eventNameInput">イベント名:</label>
            <input type="text" id="eventNameInput" placeholder="（例: 忘年会2025）" />
          </div>
        </div>

        {/* 2. 景品設定 */}
        <div className="settings-section">
          <h4>2. 景品</h4>
          <div className="prize-controls-header">
            <div className="input-group prize-main-controls">
              <button className="primary-action" onClick={() => setIsPrizeMasterModalOpen(true)}>
                <Plus size={16} /> 追加
              </button>
              <button>テキスト流し込み</button>
              <button type="button"><RefreshCw size={16} /> ランダム並び替え</button>
              <button>集計</button>
            </div>
          </div>
          <ul id="prizeCardListContainer" className="prize-card-list">
             {/* 景品カードのリスト。D&D並び替えは後続で実装 */}
          </ul>
        </div>
      </div>

      {/* 景品マスター管理モーダル */}
      <PrizeMasterModal 
        isOpen={isPrizeMasterModalOpen} 
        onClose={() => setIsPrizeMasterModalOpen(false)} 
      />
    </div>
  );
};
