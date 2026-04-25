import React from 'react';

export const EventEditView: React.FC = () => {
  return (
    <div id="eventEditView" className="view-container" style={{display: 'none'}}>
      <div className="event-header">
        <button id="backToGroupsButton"><i data-lucide="arrow-left"></i> グループダッシュボードに戻る</button>
      </div>
      <h3>イベント新規作成・編集</h3>
      <div className="controls">
        <div className="settings-section">
          <h4>1.
            イベント情報</h4>
          <div className="input-group">
            <label htmlFor="eventNameInput">イベント名:</label>
            <input type="text" id="eventNameInput" placeholder="（例: 忘年会2025）" />
          </div>
          <div id="saveStartedEventContainer" style={{display: 'none', marginTop: '15px'}}>
            <button id="saveStartedEventButton" className="primary-action">イベント名を保存する</button>
          </div>
          <p>現在のイベントURL: <a id="currentEventUrl" href="#" target="_blank">（未作成または未読み込み）</a></p>
        </div>
        <div className="settings-section">
          <h4>2.
            景品</h4>
          <div className="prize-controls-header">
            <div className="input-group prize-main-controls">
              <button id="openAddPrizeModalButton" className="primary-action"><i data-lucide="plus"></i> 追加</button>
              <button id="bulkAddPrizesButton">テキスト流し込み</button>
              <button id="shufflePrizesButton" type="button"><i data-lucide="refresh-cw"></i> ランダム並び替え</button>
              <button id="showSummaryButton">集計</button>
            </div>
            <div className="view-mode-switcher">
              <button id="viewModeCard" className="view-mode-btn active" data-mode="card">カード表示</button>
              <button id="viewModeList" className="view-mode-btn" data-mode="list">リスト表示</button>
            </div>
          </div>
          <ul id="prizeCardListContainer" className="prize-card-list"></ul>
          <div id="prizeListModeContainer" style={{display: 'none'}}></div>
        </div>
        <div className="settings-section">
          <h4>3.
            公開設定</h4>
          <p>参加者が参加枠を選ぶ画面で、どこまで景品情報を表示するか設定します。</p>
          <div className="input-group checkbox-group">
            <input type="checkbox" id="displayPrizeName" defaultChecked />
            <label htmlFor="displayPrizeName">景品名を表示する</label>
          </div>
          <div className="input-group checkbox-group">
            <input type="checkbox" id="displayPrizeCount" defaultChecked />
            <label htmlFor="displayPrizeCount">景品ごとの個数を表示する</label>
          </div>
          <div className="display-preview">
            <h5>参加者への表示プレビュー</h5>
            <ul id="prizeDisplayPreview" className="item-list"></ul>
          </div>
        </div>
        <div className="settings-section">
          <h4>4.
            インタラクティブ設定</h4>
          <div className="input-group checkbox-group">
            <input type="checkbox" id="allowDoodleModeCheckbox" />
            <label htmlFor="allowDoodleModeCheckbox">落書きモードを許可する</label>
          </div>
        </div>

        <div className="settings-section" id="createEventButtonContainer">
          <button id="createEventButton" className="primary-action">この内容でイベントを作成</button>
        </div>

        <div className="settings-section" id="finalPrepSection" style={{display: 'none'}}>
          <h4>5.
            最終準備と配信</h4>
          <div className="final-prep-content-wrapper">
            <div className="final-prep-overlay" style={{display: 'none'}}>
              <button id="saveForPreviewButton" className="primary-action">変更を保存してプレビューを更新</button>
            </div>
            <p>あみだくじの状態をプレビューし、必要に応じて調整します。</p>
            <div className="input-group">
              <button id="showFillSlotsModalButton"><i data-lucide="users"></i> 参加枠を埋める</button>
              <button id="regenerateLinesButton"><i data-lucide="refresh-cw"></i> 線を再生成</button>
              <button id="shufflePrizesBroadcastButton"><i data-lucide="gift"></i> 景品シャッフル</button>
            </div>
            <div className="canvas-panzoom-container" style={{marginTop: '15px'}}>
              <div className="panzoom-wrapper">
                <canvas id="eventEditPreviewCanvas"></canvas>
              </div>
            </div>
          </div>
          <div className="modal-actions" style={{marginTop: '20px'}}>
            <a href="#" id="goToBroadcastViewButton" className="button" style={{display: 'none'}}>配信画面へ進む <i data-lucide="arrow-right"></i></a>
          </div>
        </div>
      </div>
    </div>
  );
};
