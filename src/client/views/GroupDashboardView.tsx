import React from 'react';

export const GroupDashboardView: React.FC = () => {
  return (
    <div id="groupDashboard" className="view-container" style={{display: 'none'}}>
      <h2>マイグループ一覧</h2>
      <div className="controls">
        <div className="input-group">
          <label htmlFor="groupNameInput" className="visually-hidden">新しいグループ名</label>
          <input type="text" id="groupNameInput" placeholder="新しいグループ名" />
          <button id="createGroupButton">グループ作成</button>
        </div>
      </div>
      <ul id="groupList" className="item-list"></ul>
      <div className="controls" style={{marginTop: '20px'}} id="requestAdminControls">
        <button id="requestAdminButton" style={{display: 'none'}}>管理者権限を申請する</button>
      </div>
    </div>
  );
};
