import React from 'react';

export const MemberManagementView: React.FC = () => {
  return (
    <div id="memberManagementView" className="view-container" style={{display: 'none'}}>
      <div className="event-header">
        <button id="backToDashboardFromMembersButton"><i data-lucide="arrow-left"></i> ダッシュボードに戻る</button>
      </div>
      <h2><span id="memberManagementGroupName"></span> のメンバー管理</h2>
      <div className="controls">
        <div className="input-group">
          <label htmlFor="memberSearchInput" className="visually-hidden">メンバー名で検索</label>
          <input type="text" id="memberSearchInput" placeholder="メンバー名で検索..." />
          <button id="addNewMemberButton" className="primary-action"><i data-lucide="plus"></i> メンバー追加</button>
          <button id="bulkRegisterButton">一括登録</button>
          <button id="cleanupEventsButton" className="secondary-btn" style={{display: 'none'}}>過去データ修正</button>
        </div>
      </div>
      <div id="memberList" className="item-list"></div>
    </div>
  );
};
