import React from 'react';

export const AdminDashboardView: React.FC = () => {
  return (
    <div id="adminDashboard" className="view-container" style={{display: 'none'}}>
      <h2>システム管理ダッシュボード</h2>
      <div className="controls">
        <h3>管理者申請一覧</h3>
        <ul id="pendingRequestsList" className="item-list"></ul>
      </div>
      <div className="controls">
        <h3>ユーザー一覧</h3>
        <div className="search-controls">
          <input type="text" id="groupAdminSearchInput" placeholder="ユーザーIDで検索" />
          <button id="groupAdminSearchButton">検索</button>
        </div>
        <ul id="adminUserList" className="item-list"></ul>
        <div className="pagination-controls" id="groupAdminPagination">
          <button className="prev-btn" style={{display: 'none'}}>前へ</button>
          <button className="next-btn" style={{display: 'none'}}>次へ</button>
        </div>
      </div>
      <div className="controls">
        <h3>システム管理者一覧</h3>
        <div className="search-controls">
          <input type="text" id="systemAdminSearchInput" placeholder="ユーザーIDで検索" />
          <button id="systemAdminSearchButton">検索</button>
        </div>
        <ul id="systemAdminList" className="item-list"></ul>
        <div className="pagination-controls" id="systemAdminPagination">
          <button className="prev-btn" style={{display: 'none'}}>前へ</button>
          <button className="next-btn" style={{display: 'none'}}>次へ</button>
        </div>
      </div>
    </div>
  );
};
