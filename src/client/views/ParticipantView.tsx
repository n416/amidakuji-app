import React from 'react';

export const ParticipantView: React.FC = () => {
  return (
    <div id="participantView" className="view-container" style={{display: 'none'}}>
      <h2 id="participantEventName">イベント読み込み中...</h2>
      <div className="event-header">
        <a href="#" id="backToGroupEventListLink" style={{display: 'none'}}><i data-lucide="arrow-left"></i> イベント一覧に戻る</a>
      </div>
      <div id="participantFlow">
        <div id="nameEntrySection" className="controls" style={{display: 'none'}}>
          <h3>イベントに参加</h3>
          <div className="input-group">
            <label htmlFor="nameInput" className="visually-hidden">あなたの名前</label>
            <input type="text" id="nameInput" placeholder="あなたの名前を入力してください" />
            <button id="confirmNameButton">OK</button>
          </div>
          <div id="suggestionList" className="suggestion-list"></div>
        </div>
        <div id="participantControlPanel" className="controls participant-dashboard" style={{display: 'none'}}>
          <h3>ようこそ、<span id="welcomeName"></span> さん</h3>
          <div className="setting-group">
            <h4 className="setting-group-title">アカウント設定</h4>
            <div className="setting-group-buttons">
              <button id="editProfileButton" className="secondary-btn">プロフィール編集</button>
              <button id="setPasswordButton" className="secondary-btn">合言葉を設定</button>
            </div>
          </div>
          <div className="danger-zone">
            <button id="participantLogoutButton" className="secondary-btn">ログアウト</button>
            <button id="deleteMyAccountButton" className="secondary-btn danger">アカウントを削除</button>
          </div>
        </div>
        <div id="otherEventsSection" className="controls" style={{display: 'none', marginTop: '20px'}}>
          <div className="list-header">
            <h4>イベント一覧</h4>
            <div className="input-group checkbox-group" style={{marginBottom: '0'}}>
              <input type="checkbox" id="showAcknowledgedEvents" />
              <label htmlFor="showAcknowledgedEvents">終了済みを表示する</label>
            </div>
          </div>
          <ul id="otherEventsList" className="item-list"></ul>
        </div>
        <div id="joinSection" style={{display: 'none'}}>
          <button id="backToControlPanelButton"><i data-lucide="arrow-left"></i> メニューに戻る</button>
          <div id="prizeDisplay"></div>
          <div className="slot-selection-container">
            <h3>参加枠を選んでください</h3>
            <div id="slotList"></div>
           </div>
          <div className="join-form">
            <button id="joinButton" disabled>この枠で参加する</button>
          </div>
        </div>
      </div>

      <div id="staticAmidaView" className="view-container" style={{display: 'none', textAlign: 'center'}}>
        <h3>参加登録済み</h3>
        <p>イベント開始までお待ちください。自分の参加枠とあみだくじの線を確認できます。</p>
        <div className="canvas-panzoom-container">
          <div className="loading-mask" id="participant-loading-mask-static">あみだくじを生成中...</div>
          <div className="panzoom-wrapper" id="participant-panzoom-wrapper-static">
            <canvas id="participantCanvasStatic"></canvas>
          </div>
        </div>
        <div id="doodleControls" style={{display: 'none'}}>
          <div className="doodle-mode-switcher">
            <button id="doodleModePan" className="doodle-mode-btn active" title="移動モード"><i data-lucide="hand"></i></button>
            <button id="doodleModeDraw" className="doodle-mode-btn" title="落書きモード"><i data-lucide="pencil"></i></button>
            <button id="doodleModeErase" className="doodle-mode-btn" title="消しゴムモード"><i data-lucide="eraser"></i></button>
          </div>
          <p>隣り合った縦線の間をクリックして横線を追加し、1本だけ線を引いて運命を変えよう！</p>
          </div>
        <div className="controls" style={{marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px'}}>
          <button id="deleteParticipantWaitingButton" className="delete-btn">参加を取り消す</button>
          <button id="backToDashboardFromWaitingButton">ダッシュボードに戻る</button>
        </div>
      </div>

      <div id="resultSection" style={{display: 'none'}}>
        <h3><i data-lucide="party-popper"></i> 結果発表 <i data-lucide="party-popper"></i></h3>
        <div className="canvas-panzoom-container">
          <div className="loading-mask" id="participant-loading-mask">あみだくじを生成中...</div>
          <div className="panzoom-wrapper" id="participant-panzoom-wrapper">
            <canvas id="participantCanvas"></canvas>
          </div>
        </div>
        <p id="myResult"></p>
        <div id="allResultsContainer"></div>
        <button id="acknowledgeButton" className="primary-action" style={{display: 'none', marginTop: '15px'}}><i data-lucide="gift"></i> 結果を受け取る</button>
        <button id="shareButton" style={{display: 'none'}}>結果をシェアする</button>
        <button id="backToControlPanelFromResultButton" style={{display: 'none'}}>戻る</button>
      </div>
    </div>
  );
};
