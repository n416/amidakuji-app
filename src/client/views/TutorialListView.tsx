import React from 'react';

export const TutorialListView: React.FC = () => {
  return (
    <div id="tutorialListView" className="view-container" style={{display: 'none'}}>
      <h2>チュートリアル一覧</h2>
      <div className="controls">
        <p>各チュートリアルのタイトルをクリックすると、いつでも説明を再確認できます。</p>
      </div>
      <div id="tutorial-list-container">
      </div>
    </div>
  );
};
