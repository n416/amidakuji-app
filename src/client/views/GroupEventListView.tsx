import React from 'react';

export const GroupEventListView: React.FC = () => {
  return (
    <div id="groupEventListView" className="view-container" style={{display: 'none'}}>
      <div className="event-header">
        <button id="backToDashboardFromEventListButton" style={{display: 'none'}}></button>
      </div>
      <h2 id="groupEventListName">イベント一覧を読み込んでいます...</h2>
      <ul id="groupEventList" className="item-list"></ul>
    </div>
  );
};
