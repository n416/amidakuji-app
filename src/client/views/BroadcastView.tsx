import React from 'react';

export const BroadcastView: React.FC = () => {
  return (
    <div id="broadcastView" className="view-container" style={{display: 'none'}}>
      <div className="broadcast-header">
        <button id="backToDashboardButton"><i data-lucide="arrow-left"></i> <span>ダッシュボードに戻る</span></button>
        <div className="broadcast-header-controls">
          <button id="toggleFullscreenButton"><i data-lucide="maximize"></i> <span>表示エリアを最大化</span></button>
          <button id="openSidebarButton"><i data-lucide="sliders-horizontal"></i> <span>設定</span></button>
        </div>
      </div>
      <div className="broadcast-layout">
        <p className="event-url-display">イベントURL: <a id="broadcastEventUrl" href="#" target="_blank">読み込み中...</a></p>
        <div className="canvas-panzoom-container">
          <div id="adminControls" className="floating-controls" style={{justifyContent: 'center', width: '100%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}>
            <button id="startEventButton" className="primary-action" style={{fontSize: '1.5em', padding: '15px 30px'}}><i data-lucide="party-popper"></i> イベント開始！</button>
            <button id="glimpseButton">景品チラ見せ</button>
          </div>
          <div className="loading-mask" id="admin-loading-mask">あみだくじを生成中...</div>
          <div className="panzoom-wrapper" id="admin-panzoom-wrapper">
            <canvas id="adminCanvas" width="800" height="400"></canvas>
          </div>
        </div>

        <div id="broadcastResultsContainer" className="controls" style={{display: 'none', width: '100%', marginTop: '20px'}}>
          <ul id="broadcastResultsList" className="item-list"></ul>
        </div>
        <aside id="broadcastSidebar" className="broadcast-sidebar">
          <button id="closeSidebarButton" className="close-sidebar-btn" aria-label="閉じる"><i data-lucide="x"></i></button>
          <h4>コントロールパネル</h4>
          <div className="broadcast-controls">
            <div className="control-group">
              <h5>全体進行</h5>
              <button id="animateAllButton">全結果を再生</button>
              <button id="advanceLineByLineButton">一段ずつ進む</button>
            </div>
            <div className="control-group">
              <h5>あみだくじ操作</h5>
            </div>
            <div className="control-group">
              <h5>個別演出</h5>
              <label htmlFor="highlightUserSelect">特定ユーザー:</label>
              <select id="highlightUserSelect"></select>
              <button id="highlightUserButton">選択した人を表示</button>
              <button id="revealRandomButton">ランダムに一人表示</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
