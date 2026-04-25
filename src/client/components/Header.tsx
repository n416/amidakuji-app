import React, { useEffect } from 'react';

export const Header: React.FC = () => {
  useEffect(() => {
    if ((window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

  return (
    <div id="header-container">
      <div className="impersonation-banner" style={{display: 'none', backgroundColor: '#ffeeb0', padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#333', zIndex: '1000', position: 'relative'}}>
        <span id="impersonationBannerText">現在、別のユーザーとして操作中です。</span>
        <button id="stopImpersonatingButton" className="button-secondary" style={{marginLeft: '10px', padding: '5px 10px', fontSize: '0.9em', cursor: 'pointer'}}>元の管理者に戻る</button>
      </div>
      <header className="main-header">
        <h1>ダイナミックあみだくじ</h1>
        <button id="hamburger-button" aria-label="メニューを開く" aria-controls="nav-menu" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div id="nav-menu">
          
          <a href="/" className="button header-icon-button" id="homeButton" title="ホーム"><i data-lucide="home"></i><span>ホーム</span></a>

          <div className="group-switcher-container" style={{display: 'none'}}>
            <label className="group-switcher-label">グループ選択</label>
            <div id="groupSwitcher">
              <button id="currentGroupName"></button>
              <div id="groupDropdown" className="dropdown-content">
                <ul id="switcherGroupList"></ul>

                <button id="switcherCreateGroup"><i data-lucide="plus"></i> 新規グループを作成</button>
              </div>
            </div>
          </div>

          <div className="header-dropdown" id="tutorialMenuContainer" style={{display: 'none'}}>
            <button className="button header-icon-button" id="tutorialMenuButton">
              <i data-lucide="help-circle"></i>
              <span>チュートリアル</span>
              <i data-lucide="chevron-down" className="dropdown-arrow"></i>

              <span className="notification-dot" style={{display: 'none'}}></span>
            </button>
            <div className="dropdown-content">
              <ul id="tutorialDropdownList" className="item-list"></ul>
              <a href="/tutorials" className="dropdown-item-link" id="viewAllTutorialsLink">すべて表示</a>
            </div>
          </div>

          <div className="header-dropdown" id="userMenuContainer">
            <button className="button header-icon-button" id="userMenuButton">
              <i data-lucide="user"></i>

              <span>ユーザー</span>
              <i data-lucide="chevron-down" className="dropdown-arrow"></i>
            </button>
            <div className="dropdown-content">
              <ul>
                
                <li><button id="adminDashboardButton">システム管理</button></li>
                

                <li><button id="logoutButton">ログアウト</button></li>
                <li><button id="deleteAccountButton" className="delete-btn">アカウント削除</button></li>
              </ul>
            </div>
          </div>
          <div className="auth-controls">
            <button id="loginButton">運営者ログイン</button>
          </div>
        </div>
      </header>
      <header className="participant-header" id="participantHeader" style={{display: 'none'}}>
        <div className="header-content-wrapper">
          <div id="participant-header-logged-out" style={{display: 'none'}}>
            <div className="participant-header-actions">
              <button id="participantDashboardButtonLoggedOut">ダッシュボード</button>
              <button id="participantLoginButton" className="primary-action">参加者ログイン</button>
            </div>
          </div>
          <div id="participant-header-logged-in" style={{display: 'none'}}>
            
            <div id="participantWelcomeMessage">ようこそ、〇〇さん</div>
            <div className="participant-header-actions">
              <button id="participantDashboardButton">ダッシュボード</button>
              <button id="participantProfileButton">プロフィール</button>
              <button id="headerParticipantLogoutButton" className="secondary-btn">ログアウト</button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
