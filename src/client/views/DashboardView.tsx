import React from 'react';

export const DashboardView: React.FC = () => {
  return (
    <div id="dashboardView" className="view-container" style={{display: 'none'}}>
      <h2 id="eventGroupName"></h2>
      <div id="passwordResetNotification" className="notification-banner" style={{display: 'none'}}>
        <p><span id="passwordResetCount"></span>件の合言葉リセット依頼が承認を待っています。</p>
        <button id="showPasswordResetRequestsButton">詳細を表示</button>
      </div>
      <div className="controls">
        <div id="userInfoDisplay" className="user-info-display"></div>
        <button id="goToGroupSettingsButton"><i data-lucide="settings"></i> グループ設定</button>
        <button id="goToPrizeMasterButton"><i data-lucide="trophy"></i> 賞品マスター管理</button>
        <button id="goToMemberManagementButton"><i data-lucide="users"></i> メンバー管理</button>
        <button id="goToCreateEventViewButton">イベント新規作成</button>
      </div>
      <div className="list-header">
        <h3>このグループのイベント一覧</h3>
        <div className="input-group checkbox-group">
          <input type="checkbox" id="showStartedEvents" />
          <label htmlFor="showStartedEvents">終了済みを表示する</label>
        </div>
      </div>
      <ul id="eventList" className="item-list"></ul>
    </div>
  );
};
